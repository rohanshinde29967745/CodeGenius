import express from "express";
import { query } from "../config/db.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// Debug endpoint to check connections table
router.get("/debug", authenticateToken, async (req, res) => {
    try {
        // Check if connections table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'connections'
            )
        `);

        const tableExists = tableCheck.rows[0].exists;

        if (!tableExists) {
            return res.json({
                status: "error",
                message: "Connections table does not exist. Run the migration SQL.",
                tableExists: false
            });
        }

        // Get count of connections
        const countResult = await query("SELECT COUNT(*) FROM connections");
        const pendingResult = await query("SELECT COUNT(*) FROM connections WHERE status = 'pending'");

        res.json({
            status: "ok",
            tableExists: true,
            totalConnections: parseInt(countResult.rows[0].count),
            pendingConnections: parseInt(pendingResult.rows[0].count),
            currentUserId: req.user?.id
        });
    } catch (error) {
        res.json({
            status: "error",
            message: error.message
        });
    }
});

// Get all users with connection status
router.get("/users", authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userId = req.user.id;
        const searchQuery = req.query.search || "";

        // Try to get users with connection status first
        let result;
        try {
            let sql = `
                SELECT 
                    u.id, 
                    u.full_name, 
                    u.email, 
                    u.profile_photo_url, 
                    u.current_level,
                    c.status as connection_status,
                    c.requester_id
                FROM users u
                LEFT JOIN connections c ON 
                    (c.requester_id = $1 AND c.receiver_id = u.id) OR 
                    (c.requester_id = u.id AND c.receiver_id = $1)
                WHERE u.id != $1
            `;

            const params = [userId];

            if (searchQuery) {
                sql += ` AND (u.full_name ILIKE $2 OR u.email ILIKE $2)`;
                params.push(`%${searchQuery}%`);
            }

            sql += ` ORDER BY u.total_points DESC NULLS LAST LIMIT 50`;

            result = await query(sql, params);
        } catch (connError) {
            // If connections table doesn't exist, fall back to simple query
            console.log("Connections table may not exist, using fallback query");
            let sql = `
                SELECT 
                    u.id, 
                    u.full_name, 
                    u.email, 
                    u.profile_photo_url, 
                    u.current_level,
                    NULL as connection_status,
                    NULL as requester_id
                FROM users u
                WHERE u.id != $1
            `;

            const params = [userId];

            if (searchQuery) {
                sql += ` AND (u.full_name ILIKE $2 OR u.email ILIKE $2)`;
                params.push(`%${searchQuery}%`);
            }

            sql += ` ORDER BY u.total_points DESC LIMIT 50`;

            result = await query(sql, params);
        }

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Send connection request
router.post("/request", authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const requesterId = req.user.id;
        const { receiverId } = req.body;

        if (requesterId === parseInt(receiverId)) {
            return res.status(400).json({ error: "Cannot connect with yourself" });
        }

        // Check if user exists
        try {
            const userCheck = await query("SELECT id FROM users WHERE id = $1", [receiverId]);
            if (userCheck.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
        } catch (checkError) {
            console.error("Error checking user:", checkError);
            return res.status(500).json({ error: "Failed to verify user" });
        }

        // Always set status to 'pending' - receiver must accept
        const status = 'pending';

        try {
            // Check if connection already exists (in either direction)
            const existingCheck = await query(
                `SELECT * FROM connections 
                 WHERE (requester_id = $1 AND receiver_id = $2) 
                    OR (requester_id = $2 AND receiver_id = $1)`,
                [requesterId, receiverId]
            );

            if (existingCheck.rows.length > 0) {
                const existing = existingCheck.rows[0];
                if (existing.status === 'accepted') {
                    return res.status(400).json({ error: "Already connected" });
                }
                return res.status(400).json({ error: "Connection request already pending" });
            }

            const result = await query(
                `INSERT INTO connections (requester_id, receiver_id, status) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [requesterId, receiverId, status]
            );

            res.json({
                message: "Connection request sent! Waiting for acceptance.",
                connection: result.rows[0]
            });
        } catch (tableError) {
            console.error("Database error:", tableError);
            // Connections table doesn't exist
            res.status(500).json({ error: "Database not configured. Please run migrations." });
        }
    } catch (error) {
        console.error("Error sending request:", error);
        res.status(500).json({ error: "Failed to send request" });
    }
});

// Accept connection request
router.put("/accept", authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userId = req.user.id;
        const { connectionId } = req.body;

        const result = await query(
            `UPDATE connections 
             SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
             RETURNING *`,
            [connectionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Request not found or already accepted" });
        }

        res.json({ message: "Request accepted", connection: result.rows[0] });
    } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ error: "Failed to accept request" });
    }
});

// Get pending requests (received)
router.get("/requests", authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userId = req.user.id;
        try {
            const result = await query(
                `SELECT 
                    c.id, 
                    c.created_at, 
                    u.id as user_id, 
                    u.full_name, 
                    u.profile_photo_url 
                 FROM connections c
                 JOIN users u ON c.requester_id = u.id
                 WHERE c.receiver_id = $1 AND c.status = 'pending'`,
                [userId]
            );
            res.json(result.rows);
        } catch (tableError) {
            // Connections table doesn't exist, return empty array
            res.json([]);
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.json([]);
    }
});

// Get friends (accepted connections)
router.get("/friends", authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userId = req.user.id;
        try {
            const result = await query(
                `SELECT 
                    u.id, 
                    u.full_name, 
                    u.email, 
                    u.profile_photo_url, 
                    u.current_level,
                    u.total_points
                 FROM connections c
                 JOIN users u ON (c.requester_id = u.id AND c.receiver_id = $1)
                              OR (c.receiver_id = u.id AND c.requester_id = $1)
                 WHERE c.status = 'accepted'`,
                [userId]
            );
            res.json(result.rows);
        } catch (tableError) {
            // Connections table doesn't exist, return empty array
            res.json([]);
        }
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.json([]);
    }
});

// Get user profile with privacy check
router.get("/profile/:userId", authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const targetUserId = parseInt(req.params.userId);

        if (!currentUserId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Get user basic info - try with is_private first, fallback without
        let user;
        try {
            const userResult = await query(
                `SELECT id, full_name, email, profile_photo_url, bio, current_level, 
                        experience_points, total_points, is_private, created_at
                 FROM users WHERE id = $1`,
                [targetUserId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            user = userResult.rows[0];
        } catch (columnError) {
            // Try without is_private column
            const userResult = await query(
                `SELECT id, full_name, email, profile_photo_url, bio, current_level, 
                        experience_points, total_points, created_at
                 FROM users WHERE id = $1`,
                [targetUserId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            user = userResult.rows[0];
            user.is_private = false; // Default to public if column doesn't exist
        }

        const isPrivate = user.is_private || false;
        const isOwnProfile = currentUserId === targetUserId;

        // Check connection status
        let isConnected = false;
        try {
            const connectionResult = await query(
                `SELECT status FROM connections 
                 WHERE ((requester_id = $1 AND receiver_id = $2) 
                    OR (requester_id = $2 AND receiver_id = $1))
                   AND status = 'accepted'`,
                [currentUserId, targetUserId]
            );
            isConnected = connectionResult.rows.length > 0;
        } catch {
            // Connections table might not exist
        }

        // If private and not connected (and not own profile), return limited info
        if (isPrivate && !isConnected && !isOwnProfile) {
            return res.json({
                id: user.id,
                fullName: user.full_name,
                profilePhotoUrl: user.profile_photo_url,
                isPrivate: true,
                isConnected: false,
                canViewDetails: false,
                message: "This profile is private. Send a connection request to view full details."
            });
        }

        // Get user stats
        let stats = { projectsCount: 0, problemsSolved: 0 };
        try {
            const projectsResult = await query(
                "SELECT COUNT(*) FROM projects WHERE user_id = $1", [targetUserId]
            );
            stats.projectsCount = parseInt(projectsResult.rows[0].count);

            const problemsResult = await query(
                "SELECT COUNT(*) FROM problem_attempts WHERE user_id = $1 AND is_correct = true", [targetUserId]
            );
            stats.problemsSolved = parseInt(problemsResult.rows[0].count);
        } catch {
            // Tables might not exist
        }

        // Get user badges
        let badges = [];
        try {
            const badgesResult = await query(
                `SELECT b.name, b.description, b.icon, ub.earned_at 
                 FROM user_badges ub
                 JOIN badges b ON ub.badge_id = b.id
                 WHERE ub.user_id = $1
                 ORDER BY ub.earned_at DESC
                 LIMIT 6`,
                [targetUserId]
            );
            badges = badgesResult.rows;
        } catch {
            // Badges table might not exist
        }

        // Get user skills
        let skills = [];
        try {
            const skillsResult = await query(
                `SELECT skill_name, proficiency_percent as proficiency_level FROM user_skills WHERE user_id = $1`,
                [targetUserId]
            );
            skills = skillsResult.rows;
        } catch {
            // Skills table might not exist
        }

        // Return full profile
        res.json({
            id: user.id,
            fullName: user.full_name,
            email: isOwnProfile ? user.email : null,
            profilePhotoUrl: user.profile_photo_url,
            bio: user.bio,
            level: user.current_level || 1,
            xp: user.experience_points || 0,
            totalPoints: user.total_points || 0,
            memberSince: user.created_at,
            isPrivate: isPrivate,
            isConnected: isConnected,
            isOwnProfile: isOwnProfile,
            canViewDetails: true,
            stats: stats,
            badges: badges,
            skills: skills
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

export default router;
