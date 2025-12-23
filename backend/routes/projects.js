import express from "express";
import { query } from "../config/db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/projects"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

// Allowed file types for project uploads
const allowedMimeTypes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
    "application/octet-stream" // For some ZIP files
];

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
    fileFilter: (req, file, cb) => {
        // Check if it's an allowed archive type or has archive extension
        const ext = path.extname(file.originalname).toLowerCase();
        const isAllowedExt = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'].includes(ext);
        const isAllowedMime = allowedMimeTypes.includes(file.mimetype);

        if (isAllowedExt || isAllowedMime) {
            cb(null, true);
        } else {
            cb(new Error("Only archive files (ZIP, RAR, 7z, TAR) are allowed"), false);
        }
    },
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: "File too large. Maximum size is 200MB.",
                details: "Please compress your project or upload a smaller file."
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

        let sql = `
      SELECT p.id, p.user_id, p.title, p.description, p.programming_language, p.category,
             p.github_url, p.files_url, p.views_count, p.likes_count, p.created_at,
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

        const result = await query(sql, params);

        // Get tags for each project
        const projectsWithTags = await Promise.all(
            result.rows.map(async (project) => {
                const tagsResult = await query(
                    `SELECT t.name FROM tags t
           JOIN project_tags pt ON t.id = pt.tag_id
           WHERE pt.project_id = $1`,
                    [project.id]
                );
                return {
                    id: project.id,
                    userId: project.user_id,
                    title: project.title,
                    description: project.description,
                    language: project.programming_language,
                    category: project.category,
                    github: project.github_url,
                    filesUrl: project.files_url,
                    views: project.views_count,
                    likes: project.likes_count,
                    author: project.author_name,
                    createdAt: project.created_at,
                    tags: tagsResult.rows.map((t) => t.name),
                };
            })
        );

        res.json({ projects: projectsWithTags });
    } catch (error) {
        console.error("Projects fetch error:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
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
router.post("/", upload.single("projectFile"), handleMulterError, async (req, res) => {
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

        // Get file path if uploaded
        const filesUrl = req.file ? `/uploads/projects/${req.file.filename}` : null;

        // Insert project
        const result = await query(
            `INSERT INTO projects (user_id, title, description, category, github_url, files_url, is_published, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
       RETURNING id, title, description, category, files_url`,
            [userId, title, description || '', category, github || null, filesUrl]
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
