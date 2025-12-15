import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// GET PLATFORM STATISTICS
// ========================
router.get("/stats", async (req, res) => {
    try {
        // Get total users
        const usersResult = await query(
            `SELECT COUNT(*) as total FROM users WHERE role = 'User'`
        );

        // Get new users today
        const newUsersResult = await query(
            `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= CURRENT_DATE AND role = 'User'`
        );

        // Get daily submissions
        const submissionsResult = await query(
            `SELECT COUNT(*) as count FROM submissions 
       WHERE submitted_at >= CURRENT_DATE`
        );

        // Get active problems
        const problemsResult = await query(
            `SELECT COUNT(*) as count FROM problems WHERE is_active = TRUE`
        );

        // Get project uploads today
        const projectsResult = await query(
            `SELECT COUNT(*) as count FROM projects 
       WHERE created_at >= CURRENT_DATE`
        );

        // Get total projects
        const totalProjectsResult = await query(
            `SELECT COUNT(*) as count FROM projects`
        );

        // Calculate growth percentages (comparing to yesterday)
        const yesterdayUsers = await query(
            `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' 
       AND created_at < CURRENT_DATE AND role = 'User'`
        );

        const yesterdaySubmissions = await query(
            `SELECT COUNT(*) as count FROM submissions 
       WHERE submitted_at >= CURRENT_DATE - INTERVAL '1 day' 
       AND submitted_at < CURRENT_DATE`
        );

        res.json({
            totalUsers: parseInt(usersResult.rows[0].total) || 0,
            newUsersToday: parseInt(newUsersResult.rows[0].count) || 0,
            dailySubmissions: parseInt(submissionsResult.rows[0].count) || 0,
            activeProblems: parseInt(problemsResult.rows[0].count) || 0,
            projectUploadsToday: parseInt(projectsResult.rows[0].count) || 0,
            totalProjects: parseInt(totalProjectsResult.rows[0].count) || 0,
            growth: {
                users: calculateGrowth(
                    parseInt(newUsersResult.rows[0].count),
                    parseInt(yesterdayUsers.rows[0].count)
                ),
                submissions: calculateGrowth(
                    parseInt(submissionsResult.rows[0].count),
                    parseInt(yesterdaySubmissions.rows[0].count)
                ),
            },
        });
    } catch (error) {
        console.error("Admin stats fetch error:", error);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
});

// ========================
// GET RECENT PLATFORM ACTIVITY
// ========================
router.get("/activity", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT al.id, al.activity_type, al.description, al.created_at,
              u.full_name, u.email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
            [limit]
        );

        res.json({
            activities: result.rows.map((row) => ({
                id: row.id,
                type: row.activity_type,
                description: row.description,
                userName: row.full_name,
                email: row.email,
                time: row.created_at,
            })),
        });
    } catch (error) {
        console.error("Admin activity fetch error:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
    }
});

// ========================
// GET POPULAR PROBLEMS
// ========================
router.get("/popular-problems", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const result = await query(
            `SELECT id, title, total_attempts, total_accepted, success_rate
       FROM problems 
       WHERE is_active = TRUE
       ORDER BY total_attempts DESC
       LIMIT $1`,
            [limit]
        );

        res.json({
            problems: result.rows.map((row) => ({
                id: row.id,
                title: row.title,
                attempts: row.total_attempts,
                successRate: parseFloat(row.success_rate) || 0,
            })),
        });
    } catch (error) {
        console.error("Popular problems fetch error:", error);
        res.status(500).json({ error: "Failed to fetch popular problems" });
    }
});

// Helper function to calculate growth percentage
function calculateGrowth(today, yesterday) {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
}

export default router;
