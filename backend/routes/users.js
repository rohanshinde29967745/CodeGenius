import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// GET USER DASHBOARD STATS
// ========================
router.get("/stats/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT 
        id, full_name, email, profile_photo_url,
        total_points, current_level, current_xp, xp_to_next_level,
        current_streak, longest_streak,
        problems_solved, total_submissions, accepted_submissions, accuracy_rate
       FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];

        // Get earned badges count
        const badgesResult = await query(
            `SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1 AND is_earned = TRUE`,
            [userId]
        );

        // Get user rank
        const rankResult = await query(
            `SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY total_points DESC) as rank
        FROM users WHERE role = 'User'
      ) ranked WHERE id = $1`,
            [userId]
        );

        res.json({
            stats: {
                problemsSolved: user.problems_solved || 0,
                totalPoints: user.total_points || 0,
                accuracy: parseFloat(user.accuracy_rate) || 0,
                currentLevel: user.current_level || "Bronze",
                currentXp: user.current_xp || 0,
                xpToNextLevel: user.xp_to_next_level || 1000,
                currentStreak: user.current_streak || 0,
                longestStreak: user.longest_streak || 0,
                badgesEarned: parseInt(badgesResult.rows[0]?.count) || 0,
                rank: parseInt(rankResult.rows[0]?.rank) || 0,
            },
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                profilePhoto: user.profile_photo_url,
            },
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// ========================
// GET USER RECENT ACTIVITY
// ========================
router.get("/activity/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT id, activity_type, description, metadata, created_at
       FROM activity_logs 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
            [userId, limit]
        );

        res.json({
            activities: result.rows.map((row) => ({
                id: row.id,
                type: row.activity_type,
                description: row.description,
                metadata: row.metadata,
                time: row.created_at,
            })),
        });
    } catch (error) {
        console.error("Activity fetch error:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
    }
});

// ========================
// GET USER BADGES
// ========================
router.get("/badges/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user stats for calculating progress
        const userResult = await query(
            `SELECT problems_solved, accuracy_rate, current_streak, total_submissions, accepted_submissions
             FROM users WHERE id = $1`,
            [userId]
        );

        const userStats = userResult.rows[0] || {
            problems_solved: 0,
            accuracy_rate: 0,
            current_streak: 0,
            total_submissions: 0,
            accepted_submissions: 0
        };

        // Fetch all badges with user's earned status
        const result = await query(
            `SELECT b.id, b.name, b.description, b.icon, b.color, 
              b.requirement_type, b.requirement_value,
              ub.is_earned, ub.earned_at
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       WHERE b.is_active = TRUE
       ORDER BY b.id`,
            [userId]
        );

        // Calculate progress for each badge based on requirement type
        const badgesWithProgress = result.rows.map((row) => {
            let progress = 0;
            const reqValue = row.requirement_value || 1;

            switch (row.requirement_type) {
                case 'problems_solved':
                    progress = Math.min(100, Math.round((userStats.problems_solved / reqValue) * 100));
                    break;
                case 'accuracy_rate':
                    // Only count if user has at least 10 submissions
                    if (userStats.total_submissions >= 10) {
                        progress = Math.min(100, Math.round((userStats.accuracy_rate / reqValue) * 100));
                    } else {
                        progress = 0;
                    }
                    break;
                case 'streak':
                    progress = Math.min(100, Math.round((userStats.current_streak / reqValue) * 100));
                    break;
                case 'submissions':
                    progress = Math.min(100, Math.round((userStats.total_submissions / reqValue) * 100));
                    break;
                case 'optimal_solutions':
                    // For now, approximate with accepted_submissions
                    progress = Math.min(100, Math.round((userStats.accepted_submissions / reqValue) * 100));
                    break;
                default:
                    progress = 0;
            }

            return {
                id: row.id,
                name: row.name,
                description: row.description,
                icon: row.icon,
                color: row.color,
                requirementType: row.requirement_type,
                requirementValue: row.requirement_value,
                progress: row.is_earned ? 100 : progress,
                isEarned: row.is_earned || false,
                earnedAt: row.earned_at,
            };
        });

        res.json({ badges: badgesWithProgress });
    } catch (error) {
        console.error("Badges fetch error:", error);
        res.status(500).json({ error: "Failed to fetch badges" });
    }
});

// ========================
// GET USER SKILLS
// ========================
router.get("/skills/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT skill_name, proficiency_percent, problems_solved_in_skill
       FROM user_skills 
       WHERE user_id = $1
       ORDER BY proficiency_percent DESC`,
            [userId]
        );

        res.json({
            skills: result.rows.map((row) => ({
                name: row.skill_name,
                proficiency: row.proficiency_percent,
                problemsSolved: row.problems_solved_in_skill,
            })),
        });
    } catch (error) {
        console.error("Skills fetch error:", error);
        res.status(500).json({ error: "Failed to fetch skills" });
    }
});

// ========================
// UPDATE USER PROFILE
// ========================
router.put("/profile/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, bio, location, github, linkedin, profilePhoto } = req.body;

        const result = await query(
            `UPDATE users SET 
         full_name = COALESCE($1, full_name),
         bio = COALESCE($2, bio),
         location = COALESCE($3, location),
         github_url = COALESCE($4, github_url),
         linkedin_url = COALESCE($5, linkedin_url),
         profile_photo_url = COALESCE($6, profile_photo_url),
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, full_name, bio, location, github_url, linkedin_url, profile_photo_url`,
            [fullName, bio, location, github, linkedin, profilePhoto, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

export default router;
