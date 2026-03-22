import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// GET USER DASHBOARD STATS
// ========================
router.get("/stats/:userId", async (req, res) => {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    try {
        const { userId } = req.params;
        const parsedUserId = parseInt(userId);

        console.log(`\n🔍 DASHBOARD: Fetching stats for user ID: ${parsedUserId}`);

        // Try to fetch user with all columns, fallback if some don't exist
        let user;
        try {
            const result = await query(
                `SELECT * FROM users WHERE id = $1`,
                [parsedUserId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const row = result.rows[0];
            user = {
                id: row.id,
                full_name: row.full_name,
                email: row.email,
                profile_photo_url: row.profile_photo_url,
                total_points: parseInt(row.total_points) || 0,
                current_level: row.current_level || 1,
                current_xp: parseInt(row.current_xp) || 0,
                xp_to_next_level: parseInt(row.xp_to_next_level) || 1000,
                current_streak: parseInt(row.current_streak) || 0,
                longest_streak: parseInt(row.longest_streak) || 0,
                problems_solved: parseInt(row.problems_solved) || 0,
                total_submissions: parseInt(row.total_submissions) || 0,
                accepted_submissions: parseInt(row.accepted_submissions) || 0,
                accuracy_rate: parseFloat(row.accuracy_rate) || 0,
                experience_points: parseInt(row.experience_points) || 0
            };

            console.log("User stats fetched:", {
                currentXp: user.current_xp,
                totalPoints: user.total_points,
                problemsSolved: user.problems_solved
            });

        } catch (colError) {
            // Fallback query if some columns don't exist
            console.error("Stats query error:", colError.message);
            const result = await query(
                `SELECT id, full_name, email, profile_photo_url FROM users WHERE id = $1`,
                [parsedUserId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            user = {
                ...result.rows[0],
                total_points: 0,
                current_level: 1,
                current_xp: 0,
                xp_to_next_level: 1000,
                current_streak: 0,
                longest_streak: 0,
                problems_solved: 0,
                total_submissions: 0,
                accepted_submissions: 0,
                accuracy_rate: 0,
                experience_points: 0
            };
        }

        // Convert numeric level to string level name
        const getLevelName = (level) => {
            const numLevel = parseInt(level) || 1;
            if (numLevel >= 50) return "Platinum";
            if (numLevel >= 25) return "Gold";
            if (numLevel >= 10) return "Silver";
            return "Bronze";
        };

        // Get earned badges count
        let badgesCount = 0;
        try {
            const badgesResult = await query(
                `SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1 AND is_earned = TRUE`,
                [parsedUserId]
            );
            badgesCount = parseInt(badgesResult.rows[0]?.count) || 0;
        } catch { badgesCount = 0; }

        // Get user rank
        let rank = 0;
        try {
            const rankResult = await query(
                `SELECT rank FROM (
                    SELECT id, RANK() OVER (ORDER BY COALESCE(total_points, 0) DESC) as rank
                    FROM users WHERE role = 'User'
                ) ranked WHERE id = $1`,
                [parsedUserId]
            );
            rank = parseInt(rankResult.rows[0]?.rank) || 0;
        } catch { rank = 0; }

        // Calculate XP progress percentage for the frontend
        const currentXp = parseInt(user.current_xp) || 0;
        const xpToNextLevel = parseInt(user.xp_to_next_level) || 1000;
        const xpProgress = Math.min(100, Math.round((currentXp / xpToNextLevel) * 100));

        res.json({
            stats: {
                problemsSolved: parseInt(user.problems_solved) || 0,
                totalPoints: parseInt(user.total_points) || 0,
                accuracy: parseFloat(user.accuracy_rate) || 0,
                currentLevel: getLevelName(user.current_level),
                currentXp: currentXp,
                xpToNextLevel: xpToNextLevel,
                xpProgress: xpProgress,
                currentStreak: parseInt(user.current_streak) || 0,
                longestStreak: parseInt(user.longest_streak) || 0,
                badgesEarned: badgesCount,
                rank: rank,
                experiencePoints: parseInt(user.experience_points) || 0,
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
// DEBUG: RAW DATABASE CHECK
// ========================
router.get("/debug/:userId", async (req, res) => {
    try {
        const parsedUserId = parseInt(req.params.userId);
        console.log(`\n🔧 DEBUG: Checking raw database values for user ${parsedUserId}`);

        const result = await query(
            `SELECT id, full_name, total_points, problems_solved, current_xp, 
                    experience_points, total_submissions, accepted_submissions 
             FROM users WHERE id = $1`,
            [parsedUserId]
        );

        if (result.rows.length === 0) {
            return res.json({ error: "User not found", userId: parsedUserId });
        }

        console.log(`🔧 DEBUG RAW DATA:`, result.rows[0]);

        res.json({
            message: "Raw database values",
            userId: parsedUserId,
            rawData: result.rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Debug error:", error);
        res.status(500).json({ error: error.message });
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
        const { fullName, bio, location, github, linkedin, profilePhoto, isPrivate } = req.body;

        // Try update with is_private first, fallback if column doesn't exist
        let result;
        try {
            result = await query(
                `UPDATE users SET 
             full_name = COALESCE($1, full_name),
             bio = COALESCE($2, bio),
             location = COALESCE($3, location),
             github_url = COALESCE($4, github_url),
             linkedin_url = COALESCE($5, linkedin_url),
             profile_photo_url = COALESCE($6, profile_photo_url),
             is_private = COALESCE($7, is_private),
             updated_at = NOW()
           WHERE id = $8
           RETURNING id, full_name, bio, location, github_url, linkedin_url, profile_photo_url, is_private`,
                [fullName, bio, location, github, linkedin, profilePhoto, isPrivate, userId]
            );
        } catch (colError) {
            // Fallback query without is_private
            result = await query(
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
        }

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
