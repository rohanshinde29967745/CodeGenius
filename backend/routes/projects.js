import express from "express";
import { query } from "../config/db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
ensureDir(path.join(__dirname, "../uploads/projects"));
ensureDir(path.join(__dirname, "../uploads/screenshots"));
ensureDir(path.join(__dirname, "../uploads/videos"));

// Configure multer storage for different file types
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, "../uploads/projects");

        if (file.fieldname === "screenshots") {
            uploadPath = path.join(__dirname, "../uploads/screenshots");
        } else if (file.fieldname === "demoVideo") {
            uploadPath = path.join(__dirname, "../uploads/videos");
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

// Allowed file types for different uploads
const allowedArchiveMimeTypes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
    "application/octet-stream"
];

const allowedImageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
];

const allowedVideoMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo"
];

// File filter for multiple file types
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "projectFile") {
        const ext = path.extname(file.originalname).toLowerCase();
        const isAllowedExt = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'].includes(ext);
        const isAllowedMime = allowedArchiveMimeTypes.includes(file.mimetype);
        if (isAllowedExt || isAllowedMime) {
            cb(null, true);
        } else {
            cb(new Error("Only archive files (ZIP, RAR, 7z, TAR) are allowed for project files"), false);
        }
    } else if (file.fieldname === "screenshots") {
        if (allowedImageMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed for screenshots"), false);
        }
    } else if (file.fieldname === "demoVideo") {
        if (allowedVideoMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only video files (MP4, WebM, MOV, AVI) are allowed for demo video"), false);
        }
    } else {
        cb(null, true);
    }
};

// Configure multer for multiple file uploads
const upload = multer({
    storage,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200MB max per file
        files: 10 // Max 10 files total (1 project + 8 screenshots + 1 video)
    },
    fileFilter: fileFilter
});

// Define fields for multiple file uploads
const projectUpload = upload.fields([
    { name: "projectFile", maxCount: 1 },
    { name: "screenshots", maxCount: 8 },
    { name: "demoVideo", maxCount: 1 }
]);

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: "File too large. Maximum size is 200MB per file.",
                details: "Please compress your file or upload a smaller one."
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: "Too many files. Maximum is 8 screenshots.",
                details: "Please reduce the number of screenshots."
            });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// ========================
// GET ALL PROJECTS
// ========================
router.get("/", async (req, res) => {
    try {
        const { language, category, sort } = req.query;
        const limit = parseInt(req.query.limit) || 20;

        // First try with all columns, fallback to basic columns if error
        let result;
        let hasExtraColumns = true;

        try {
            let sql = `
                SELECT p.id, p.user_id, p.title, p.description, p.programming_language, p.category,
                       p.github_url, p.files_url, p.screenshots, p.demo_video_url, p.views_count, p.likes_count, p.created_at,
                       u.full_name as author_name
                FROM projects p
                JOIN users u ON p.user_id = u.id
                WHERE p.is_published = TRUE
            `;
            const params = [];
            let paramIndex = 1;

            if (language && language !== "All Languages") {
                sql += ` AND p.programming_language = $${paramIndex}`;
                params.push(language);
                paramIndex++;
            }

            if (category && category !== "All Categories") {
                sql += ` AND p.category = $${paramIndex}`;
                params.push(category);
                paramIndex++;
            }

            // Sort order
            if (sort === "Most Popular") {
                sql += ` ORDER BY p.likes_count DESC`;
            } else {
                sql += ` ORDER BY p.created_at DESC`;
            }

            sql += ` LIMIT $${paramIndex}`;
            params.push(limit);

            result = await query(sql, params);
        } catch (columnError) {
            // Fallback query without optional columns
            console.log("Using fallback query for projects (missing columns)");
            hasExtraColumns = false;

            let sql = `
                SELECT p.id, p.user_id, p.title, p.description, p.programming_language, p.category,
                       p.github_url, p.views_count, p.likes_count, p.created_at,
                       u.full_name as author_name
                FROM projects p
                JOIN users u ON p.user_id = u.id
                WHERE p.is_published = TRUE
            `;
            const params = [];
            let paramIndex = 1;

            if (language && language !== "All Languages") {
                sql += ` AND p.programming_language = $${paramIndex}`;
                params.push(language);
                paramIndex++;
            }

            if (category && category !== "All Categories") {
                sql += ` AND p.category = $${paramIndex}`;
                params.push(category);
                paramIndex++;
            }

            if (sort === "Most Popular") {
                sql += ` ORDER BY p.likes_count DESC`;
            } else {
                sql += ` ORDER BY p.created_at DESC`;
            }

            sql += ` LIMIT $${paramIndex}`;
            params.push(limit);

            result = await query(sql, params);
        }

        // Get tags for each project
        const projectsWithTags = await Promise.all(
            result.rows.map(async (project) => {
                let tags = [];
                try {
                    const tagsResult = await query(
                        `SELECT t.name FROM tags t
                         JOIN project_tags pt ON t.id = pt.tag_id
                         WHERE pt.project_id = $1`,
                        [project.id]
                    );
                    tags = tagsResult.rows.map((t) => t.name);
                } catch {
                    // Tags table might not exist
                }

                // Parse screenshots JSON if it exists
                let screenshots = [];
                if (hasExtraColumns && project.screenshots) {
                    try {
                        screenshots = JSON.parse(project.screenshots);
                    } catch {
                        screenshots = [];
                    }
                }

                return {
                    id: project.id,
                    userId: project.user_id,
                    title: project.title,
                    description: project.description,
                    language: project.programming_language,
                    category: project.category,
                    github: project.github_url,
                    filesUrl: hasExtraColumns ? project.files_url : null,
                    screenshots: screenshots,
                    demoVideoUrl: hasExtraColumns ? project.demo_video_url : null,
                    views: project.views_count,
                    likes: project.likes_count,
                    author: project.author_name,
                    createdAt: project.created_at,
                    tags: tags,
                };
            })
        );

        res.json({ projects: projectsWithTags });
    } catch (error) {
        console.error("Projects fetch error:", error);
        res.status(500).json({ error: "Failed to fetch projects", details: error.message });
    }
});

// ========================
// GET USER'S PROJECTS
// ========================
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT id, title, description, programming_language, category,
              github_url, views_count, likes_count, created_at
       FROM projects 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            projects: result.rows.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                language: p.programming_language,
                category: p.category,
                github: p.github_url,
                views: p.views_count,
                likes: p.likes_count,
                createdAt: p.created_at,
            })),
        });
    } catch (error) {
        console.error("User projects fetch error:", error);
        res.status(500).json({ error: "Failed to fetch user projects" });
    }
});

// ========================
// CREATE PROJECT
// ========================
router.post("/", projectUpload, handleMulterError, async (req, res) => {
    try {
        const { userId, title, description, github } = req.body;
        let { category } = req.body;

        // Parse tags from string if sent via FormData
        let tags = [];
        if (req.body.tags) {
            try {
                tags = JSON.parse(req.body.tags);
            } catch {
                tags = req.body.tags.split(",").map(t => t.trim()).filter(t => t);
            }
        }

        if (!userId || !title) {
            return res.status(400).json({ error: "User ID and title are required" });
        }

        // Validate category - must be one of allowed values or null
        const allowedCategories = ['Web Development', 'Data Science', 'Mobile Apps', 'Machine Learning', 'Other'];
        if (category && !allowedCategories.includes(category)) {
            category = 'Other'; // Default to 'Other' if invalid
        }
        if (!category || category === '') {
            category = null; // Allow null for no category
        }

        // Get file paths from uploaded files
        const filesUrl = req.files?.projectFile?.[0]
            ? `/uploads/projects/${req.files.projectFile[0].filename}`
            : null;

        // Get screenshot URLs (array)
        const screenshotUrls = req.files?.screenshots
            ? req.files.screenshots.map(file => `/uploads/screenshots/${file.filename}`)
            : [];

        // Get demo video URL
        const demoVideoUrl = req.files?.demoVideo?.[0]
            ? `/uploads/videos/${req.files.demoVideo[0].filename}`
            : null;

        // Insert project with screenshots and video
        const result = await query(
            `INSERT INTO projects (user_id, title, description, category, github_url, files_url, screenshots, demo_video_url, is_published, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
       RETURNING id, title, description, category, files_url, screenshots, demo_video_url`,
            [userId, title, description || '', category, github || null, filesUrl, JSON.stringify(screenshotUrls), demoVideoUrl]
        );

        const project = result.rows[0];

        // Add tags if provided
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Get or create tag
                let tagResult = await query(`SELECT id FROM tags WHERE name = $1`, [tagName]);

                let tagId;
                if (tagResult.rows.length === 0) {
                    const newTag = await query(
                        `INSERT INTO tags (name) VALUES ($1) RETURNING id`,
                        [tagName]
                    );
                    tagId = newTag.rows[0].id;
                } else {
                    tagId = tagResult.rows[0].id;
                }

                // Link tag to project
                await query(
                    `INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [project.id, tagId]
                );
            }
        }

        // Log activity
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
       VALUES ($1, 'project_uploaded', $2, NOW())`,
            [userId, `Uploaded project: ${title}`]
        );

        res.status(201).json({
            message: "Project uploaded successfully",
            project: {
                id: project.id,
                title: project.title,
                description: project.description,
                category: project.category,
                screenshots: screenshotUrls,
                demoVideoUrl: demoVideoUrl
            },
        });
    } catch (error) {
        console.error("Project create error:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ error: "Failed to create project", details: error.message });
    }
});

// ========================
// LIKE PROJECT
// ========================
router.post("/:projectId/like", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        // Check if already liked
        const existing = await query(
            `SELECT * FROM project_likes WHERE user_id = $1 AND project_id = $2`,
            [userId, projectId]
        );

        if (existing.rows.length > 0) {
            // Unlike
            await query(
                `DELETE FROM project_likes WHERE user_id = $1 AND project_id = $2`,
                [userId, projectId]
            );
            await query(
                `UPDATE projects SET likes_count = likes_count - 1 WHERE id = $1`,
                [projectId]
            );
            res.json({ liked: false });
        } else {
            // Like
            await query(
                `INSERT INTO project_likes (user_id, project_id) VALUES ($1, $2)`,
                [userId, projectId]
            );
            await query(
                `UPDATE projects SET likes_count = likes_count + 1 WHERE id = $1`,
                [projectId]
            );
            res.json({ liked: true });
        }
    } catch (error) {
        console.error("Like project error:", error);
        res.status(500).json({ error: "Failed to like project" });
    }
});

export default router;
