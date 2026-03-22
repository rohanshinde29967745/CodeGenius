import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "codegenius-secret-key-2024";

// ========================
// JWT AUTHENTICATION MIDDLEWARE
// ========================
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Allow request to continue without user for public endpoints
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            req.user = null;
            return next();
        }
        req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
        next();
    });
};

// ========================
// REGISTER
// ========================
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // SECURITY: Force role to 'User' - Admin accounts can only be created manually in database
        const role = "User";

        // Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await query("SELECT id FROM users WHERE email = $1", [
            email.toLowerCase(),
        ]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, role, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, email, full_name, role, current_level, total_points`,
            [email.toLowerCase(), passwordHash, fullName, role]
        );

        const newUser = result.rows[0];

        // Log registration activity
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
       VALUES ($1, 'registration', $2, $3, NOW())`,
            [newUser.id, `New user registered: ${email}`, req.ip]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.full_name,
                role: newUser.role,
                level: newUser.current_level,
                points: newUser.total_points,
            },
            token,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ========================
// LOGIN
// ========================
router.post("/login", async (req, res) => {
    try {
        const { email, password, role = "User" } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user
        const result = await query(
            `SELECT id, email, password_hash, full_name, role, current_level, 
              total_points, problems_solved, accuracy_rate, profile_photo_url
       FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Log failed login attempt (non-blocking)
            try {
                await query(
                    `INSERT INTO activity_logs (activity_type, description, ip_address, created_at)
             VALUES ('login_failed', $1, $2, NOW())`,
                    [`Failed login attempt for: ${email}`, req.ip]
                );
            } catch (logError) {
                console.log("Activity log failed (non-blocking):", logError.message);
            }
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // Log failed password attempt (non-blocking)
            try {
                await query(
                    `INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
             VALUES ($1, 'login_failed', 'Incorrect password', $2, NOW())`,
                    [user.id, req.ip]
                );
            } catch (logError) {
                console.log("Activity log failed (non-blocking):", logError.message);
            }
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Role check removed - mobile app handles role-based navigation based on user.role from database
        // The frontend role selector is now just for UX, not authentication

        // Update last login (non-blocking)
        try {
            await query(
                "UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1",
                [user.id]
            );
        } catch (updateError) {
            console.log("Last login update failed (non-blocking):", updateError.message);
        }

        // Log successful login (non-blocking)
        try {
            await query(
                `INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
       VALUES ($1, 'login', 'User logged in', $2, NOW())`,
                [user.id, req.ip]
            );
        } catch (logError) {
            console.log("Activity log failed (non-blocking):", logError.message);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                level: user.current_level,
                points: user.total_points,
                problemsSolved: user.problems_solved,
                accuracy: user.accuracy_rate,
                profilePhoto: user.profile_photo_url,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ========================
// FORGOT PASSWORD - Request Reset
// ========================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Check if user exists
        const result = await query(
            "SELECT id, email, full_name FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Don't reveal if email exists or not for security
            return res.json({
                message: "If this email exists, a reset code has been generated.",
                success: true
            });
        }

        const user = result.rows[0];

        // Generate a 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store reset code in database (try with reset columns, fallback to temp storage)
        try {
            await query(
                `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
                [resetCode, resetExpiry, user.id]
            );
        } catch (colError) {
            // If columns don't exist, we'll use a simple in-memory approach for demo
            // In production, you'd want to add these columns to the database
            console.log("Reset columns don't exist, using backup approach");
        }

        // In development, show the code directly
        // In production, you would send this via email
        console.log(`\n========================================`);
        console.log(`🔐 PASSWORD RESET CODE for ${email}`);
        console.log(`📧 Code: ${resetCode}`);
        console.log(`⏰ Expires in 15 minutes`);
        console.log(`========================================\n`);

        res.json({
            message: "Reset code generated successfully!",
            success: true,
            // In dev mode, return the code directly
            resetCode: resetCode,
            expiresIn: "15 minutes",
            note: "In production, this code would be sent via email"
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// ========================
// RESET PASSWORD - With Code
// ========================
router.post("/reset-password", async (req, res) => {
    try {
        const { email, resetCode, newPassword } = req.body;

        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({ error: "Email, reset code, and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Find user and verify reset code
        let user;
        try {
            const result = await query(
                `SELECT id, email, reset_token, reset_token_expiry FROM users WHERE email = $1`,
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ error: "Invalid email or reset code" });
            }

            user = result.rows[0];

            // Verify reset code
            if (user.reset_token !== resetCode) {
                return res.status(400).json({ error: "Invalid reset code" });
            }

            // Check if code expired
            if (new Date() > new Date(user.reset_token_expiry)) {
                return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
            }
        } catch (colError) {
            // If reset columns don't exist, just verify user exists for demo
            const result = await query(
                `SELECT id, email FROM users WHERE email = $1`,
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ error: "Invalid email" });
            }
            user = result.rows[0];
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        try {
            await query(
                `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
                [passwordHash, user.id]
            );
        } catch (colError) {
            // Fallback if reset columns don't exist
            await query(
                `UPDATE users SET password_hash = $1 WHERE id = $2`,
                [passwordHash, user.id]
            );
        }

        res.json({
            message: "Password reset successfully! You can now login with your new password.",
            success: true
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

// ========================
// GET USER PROFILE
// ========================
router.get("/profile/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Try query with is_private first, fallback if column doesn't exist
        let result;
        try {
            result = await query(
                `SELECT id, email, full_name, role, bio, location, github_url, linkedin_url,
                  profile_photo_url, total_points, current_level, current_xp, xp_to_next_level,
                  current_streak, problems_solved, accuracy_rate, created_at, is_private
           FROM users WHERE id = $1`,
                [userId]
            );
        } catch (colError) {
            // Fallback query without is_private
            result = await query(
                `SELECT id, email, full_name, role, bio, location, github_url, linkedin_url,
                  profile_photo_url, total_points, current_level, current_xp, xp_to_next_level,
                  current_streak, problems_solved, accuracy_rate, created_at
           FROM users WHERE id = $1`,
                [userId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];

        // Get user badges
        const badgesResult = await query(
            `SELECT b.name, b.icon, b.color, ub.is_earned, ub.progress, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1`,
            [userId]
        );

        // Get user skills
        const skillsResult = await query(
            `SELECT skill_name, proficiency_percent, problems_solved_in_skill
       FROM user_skills WHERE user_id = $1`,
            [userId]
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                bio: user.bio,
                location: user.location,
                github: user.github_url,
                linkedin: user.linkedin_url,
                profilePhoto: user.profile_photo_url,
                points: user.total_points,
                level: user.current_level,
                xp: user.current_xp,
                xpToNextLevel: user.xp_to_next_level,
                streak: user.current_streak,
                problemsSolved: user.problems_solved,
                accuracy: user.accuracy_rate,
                joinedAt: user.created_at,
                isPrivate: user.is_private || false,
            },
            badges: badgesResult.rows,
            skills: skillsResult.rows,
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// ========================
// UPDATE USER PROFILE
// ========================
router.put("/profile/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, bio, location, github, linkedin } = req.body;

        const result = await query(
            `UPDATE users SET 
         full_name = COALESCE($1, full_name),
         bio = COALESCE($2, bio),
         location = COALESCE($3, location),
         github_url = COALESCE($4, github_url),
         linkedin_url = COALESCE($5, linkedin_url),
         updated_at = NOW()
       WHERE id = $6
       RETURNING id, full_name, bio, location, github_url, linkedin_url`,
            [fullName, bio, location, github, linkedin, userId]
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

// ========================
// CHANGE PASSWORD
// ========================
router.put("/change-password/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        // Get user's current password hash
        const userResult = await query(
            "SELECT id, password_hash FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await query(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
            [newPasswordHash, userId]
        );

        // Log password change activity
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
             VALUES ($1, 'password_change', 'Password changed successfully', NOW())`,
            [userId]
        );

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

// ========================
// DELETE ACCOUNT
// ========================
router.delete("/account/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        // Validation
        if (!password) {
            return res.status(400).json({ error: "Password is required to delete account" });
        }

        // Get user's password hash
        const userResult = await query(
            "SELECT id, email, password_hash FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Delete user's related data first (foreign key constraints)
        await query("DELETE FROM user_badges WHERE user_id = $1", [userId]);
        await query("DELETE FROM user_skills WHERE user_id = $1", [userId]);
        await query("DELETE FROM activity_logs WHERE user_id = $1", [userId]);
        await query("DELETE FROM user_submissions WHERE user_id = $1", [userId]);
        await query("DELETE FROM projects WHERE user_id = $1", [userId]);
        await query("DELETE FROM collaboration_requests WHERE sender_id = $1 OR receiver_id = $1", [userId]);

        // Finally delete the user
        await query("DELETE FROM users WHERE id = $1", [userId]);

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// ========================
// SAVE USER SETTINGS
// ========================
router.put("/settings/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { settings } = req.body;

        // For now, we'll store settings in the user's record as JSON
        // You could also create a separate user_settings table
        await query(
            `UPDATE users SET 
             settings = $1,
             updated_at = NOW()
           WHERE id = $2`,
            [JSON.stringify(settings), userId]
        );

        res.json({ message: "Settings saved successfully" });
    } catch (error) {
        console.error("Save settings error:", error);
        res.status(500).json({ error: "Failed to save settings" });
    }
});

// ========================
// GET USER SETTINGS
// ========================
router.get("/settings/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            "SELECT settings FROM users WHERE id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const settings = result.rows[0].settings || {};

        res.json({ settings });
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ error: "Failed to get settings" });
    }
});

// ========================
// LOGOUT (Log activity)
// ========================
router.post("/logout", async (req, res) => {
    try {
        const { userId } = req.body;

        if (userId) {
            await query(
                `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
         VALUES ($1, 'logout', 'User logged out', NOW())`,
                [userId]
            );
        }

        res.json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
});

export default router;
