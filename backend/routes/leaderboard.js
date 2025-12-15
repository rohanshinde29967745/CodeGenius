import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// GET LEADERBOARD (All Time)
// ========================
router.get("/", async (req, res) => {
    try {
        const period = req.query.period || "all_time"; // all_time, this_month
        const limit = parseInt(req.query.limit) || 50;

        let result;

        if (period === "this_month") {
            // Monthly leaderboard based on submissions this month
            result = await query(
                `SELECT 
          u.id, u.full_name, u.profile_photo_url, u.current_level,
          COALESCE(SUM(s.points_earned), 0) as points,
          COUNT(CASE WHEN s.status = 'Accepted' THEN 1 END) as problems_solved,
          ROUND(
            CASE 
              WHEN COUNT(s.id) > 0 
              THEN (COUNT(CASE WHEN s.status = 'Accepted' THEN 1 END)::DECIMAL / COUNT(s.id)) * 100
              ELSE 0 
            END, 2
          ) as accuracy
         FROM users u
         LEFT JOIN submissions s ON u.id = s.user_id 
           AND s.submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
         WHERE u.role = 'User'
         GROUP BY u.id
         ORDER BY points DESC
         LIMIT $1`,
                [limit]
            );
        } else {
            // All-time leaderboard
            result = await query(
                `SELECT 
          id, full_name, profile_photo_url, current_level,
          total_points as points, problems_solved, accuracy_rate as accuracy
         FROM users 
         WHERE role = 'User'
         ORDER BY total_points DESC
         LIMIT $1`,
                [limit]
            );
        }

        // Add rank to each user
        const leaderboard = result.rows.map((user, index) => ({
            rank: index + 1,
            id: user.id,
            name: user.full_name,
            initials: user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase(),
            profilePhoto: user.profile_photo_url,
            level: user.current_level,
            points: parseInt(user.points) || 0,
            problemsSolved: parseInt(user.problems_solved) || 0,
            accuracy: parseFloat(user.accuracy) || 0,
        }));

        res.json({
            period,
            leaderboard,
            topThree: leaderboard.slice(0, 3),
        });
    } catch (error) {
        console.error("Leaderboard fetch error:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// ========================
// GET USER RANK
// ========================
router.get("/rank/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT rank, total_points, problems_solved FROM (
        SELECT id, total_points, problems_solved,
               RANK() OVER (ORDER BY total_points DESC) as rank
        FROM users WHERE role = 'User'
      ) ranked WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            rank: parseInt(result.rows[0].rank),
            totalPoints: result.rows[0].total_points,
            problemsSolved: result.rows[0].problems_solved,
        });
    } catch (error) {
        console.error("Rank fetch error:", error);
        res.status(500).json({ error: "Failed to fetch rank" });
    }
});

export default router;
