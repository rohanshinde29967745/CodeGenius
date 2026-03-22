import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// SAVED PROBLEMS
// ========================

// Save a problem
router.post("/problems", async (req, res) => {
    try {
        const { userId, problemId, problemTitle, problemDifficulty, problemCategory } = req.body;

        if (!userId || !problemId) {
            return res.status(400).json({ error: "User ID and Problem ID are required" });
        }

        const result = await query(
            `INSERT INTO saved_problems (user_id, problem_id, problem_title, problem_difficulty, problem_category)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, problem_id) DO NOTHING
             RETURNING *`,
            [userId, problemId, problemTitle || 'Untitled', problemDifficulty || 'Medium', problemCategory || 'General']
        );

        if (result.rows.length === 0) {
            return res.json({ message: "Problem already saved", saved: true });
        }

        res.status(201).json({ message: "Problem saved successfully", saved: result.rows[0] });
    } catch (error) {
        console.error("Save problem error:", error);
        res.status(500).json({ error: "Failed to save problem" });
    }
});

// Unsave a problem
router.delete("/problems/:userId/:problemId", async (req, res) => {
    try {
        const { userId, problemId } = req.params;

        await query(
            `DELETE FROM saved_problems WHERE user_id = $1 AND problem_id = $2`,
            [userId, problemId]
        );

        res.json({ message: "Problem removed from saved" });
    } catch (error) {
        console.error("Unsave problem error:", error);
        res.status(500).json({ error: "Failed to unsave problem" });
    }
});

// Get saved problems for a user
router.get("/problems/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT * FROM saved_problems 
             WHERE user_id = $1 
             ORDER BY saved_at DESC`,
            [userId]
        );

        res.json({ savedProblems: result.rows });
    } catch (error) {
        console.error("Get saved problems error:", error);
        res.status(500).json({ error: "Failed to get saved problems" });
    }
});

// Check if problem is saved
router.get("/problems/check/:userId/:problemId", async (req, res) => {
    try {
        const { userId, problemId } = req.params;

        const result = await query(
            `SELECT id FROM saved_problems WHERE user_id = $1 AND problem_id = $2`,
            [userId, problemId]
        );

        res.json({ isSaved: result.rows.length > 0 });
    } catch (error) {
        console.error("Check saved problem error:", error);
        res.status(500).json({ error: "Failed to check saved status" });
    }
});

// ========================
// SAVED PROJECTS
// ========================

// Save a project
router.post("/projects", async (req, res) => {
    try {
        const { userId, projectId } = req.body;

        if (!userId || !projectId) {
            return res.status(400).json({ error: "User ID and Project ID are required" });
        }

        const result = await query(
            `INSERT INTO saved_projects (user_id, project_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, project_id) DO NOTHING
             RETURNING *`,
            [userId, projectId]
        );

        if (result.rows.length === 0) {
            return res.json({ message: "Project already saved", saved: true });
        }

        res.status(201).json({ message: "Project saved successfully", saved: result.rows[0] });
    } catch (error) {
        console.error("Save project error:", error);
        res.status(500).json({ error: "Failed to save project" });
    }
});

// Unsave a project
router.delete("/projects/:userId/:projectId", async (req, res) => {
    try {
        const { userId, projectId } = req.params;

        await query(
            `DELETE FROM saved_projects WHERE user_id = $1 AND project_id = $2`,
            [userId, projectId]
        );

        res.json({ message: "Project removed from saved" });
    } catch (error) {
        console.error("Unsave project error:", error);
        res.status(500).json({ error: "Failed to unsave project" });
    }
});

// Get saved projects for a user
router.get("/projects/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT sp.*, p.title, p.description, p.category, p.github_url, p.views_count, p.likes_count,
                    u.full_name as author_name
             FROM saved_projects sp
             JOIN projects p ON sp.project_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE sp.user_id = $1 
             ORDER BY sp.saved_at DESC`,
            [userId]
        );

        res.json({
            savedProjects: result.rows.map(p => ({
                id: p.id,
                projectId: p.project_id,
                title: p.title,
                description: p.description,
                category: p.category,
                github: p.github_url,
                views: p.views_count,
                likes: p.likes_count,
                author: p.author_name,
                savedAt: p.saved_at
            }))
        });
    } catch (error) {
        console.error("Get saved projects error:", error);
        res.status(500).json({ error: "Failed to get saved projects" });
    }
});

// Check if project is saved
router.get("/projects/check/:userId/:projectId", async (req, res) => {
    try {
        const { userId, projectId } = req.params;

        const result = await query(
            `SELECT id FROM saved_projects WHERE user_id = $1 AND project_id = $2`,
            [userId, projectId]
        );

        res.json({ isSaved: result.rows.length > 0 });
    } catch (error) {
        console.error("Check saved project error:", error);
        res.status(500).json({ error: "Failed to check saved status" });
    }
});

export default router;
