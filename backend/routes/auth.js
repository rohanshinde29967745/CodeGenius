import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "codegenius-secret-key-2024";

// ========================
// REGISTER
// ========================
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password, role = "User" } = req.body;

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
            // Log failed login attempt
            await query(
                `INSERT INTO activity_logs (activity_type, description, ip_address, created_at)
         VALUES ('login_failed', $1, $2, NOW())`,
                [`Failed login attempt for: ${email}`, req.ip]
            );
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await query(
                `INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
         VALUES ($1, 'login_failed', 'Incorrect password', $2, NOW())`,
                [user.id, req.ip]
            );
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check if role matches (optional - based on your login component)
        if (role && user.role !== role) {
            return res.status(403).json({ error: `Access denied. You are not registered as ${role}` });
        }

        // Update last login
        await query(
            "UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1",
            [user.id]
        );

        // Log successful login
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
       VALUES ($1, 'login', 'User logged in', $2, NOW())`,
            [user.id, req.ip]
        );

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
// GET USER PROFILE
// ========================
router.get("/profile/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT id, email, full_name, role, bio, location, github_url, linkedin_url,
              profile_photo_url, total_points, current_level, current_xp, xp_to_next_level,
              current_streak, problems_solved, accuracy_rate, created_at
       FROM users WHERE id = $1`,
            [userId]
        );

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
