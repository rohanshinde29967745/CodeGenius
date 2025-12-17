import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "codegenius-secret-key-2024";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// ========================
// HELPER: Create or find OAuth user
// ========================
async function findOrCreateOAuthUser(provider, oauthId, email, fullName, profilePhoto) {
    // First, try to find by OAuth ID
    let result = await query(
        `SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2`,
        [provider, oauthId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Try to find by email (link accounts)
    result = await query(
        `SELECT * FROM users WHERE email = $1`,
        [email.toLowerCase()]
    );

    if (result.rows.length > 0) {
        // Update existing user with OAuth info
        const user = result.rows[0];
        await query(
            `UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3`,
            [provider, oauthId, user.id]
        );
        return user;
    }

    // Create new user
    result = await query(
        `INSERT INTO users (email, full_name, profile_photo_url, oauth_provider, oauth_id, role, current_level)
         VALUES ($1, $2, $3, $4, $5, 'User', 'Bronze')
         RETURNING *`,
        [email.toLowerCase(), fullName, profilePhoto, provider, oauthId]
    );

    const newUser = result.rows[0];

    // Log registration
    await query(
        `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
         VALUES ($1, 'registration', $2, NOW())`,
        [newUser.id, `New user registered via ${provider}`]
    );

    return newUser;
}

// ========================
// HELPER: Generate JWT and redirect
// ========================
function generateTokenAndRedirect(res, user) {
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        level: user.current_level,
        points: user.total_points || 0,
        profilePhoto: user.profile_photo_url
    }));

    res.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}&user=${userData}`);
}

// ========================
// GOOGLE OAuth
// ========================
router.get("/google", (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env" });
    }

    const redirectUri = `${BACKEND_URL}/api/oauth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile` +
        `&access_type=offline`;

    res.redirect(googleAuthUrl);
});

router.get("/google/callback", async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.redirect(`${FRONTEND_URL}/login?error=${error}`);
        }

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
        }

        // Exchange code for tokens
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: `${BACKEND_URL}/api/oauth/google/callback`,
            grant_type: "authorization_code"
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { id, email, name, picture } = userResponse.data;

        // Find or create user
        const user = await findOrCreateOAuthUser("google", id, email, name, picture);

        // Log login
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
             VALUES ($1, 'login', 'User logged in via Google', NOW())`,
            [user.id]
        );

        generateTokenAndRedirect(res, user);

    } catch (error) {
        console.error("Google OAuth error:", error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
});

// ========================
// GITHUB OAuth
// ========================
router.get("/github", (req, res) => {
    if (!GITHUB_CLIENT_ID) {
        return res.status(500).json({ error: "GitHub OAuth not configured. Add GITHUB_CLIENT_ID to .env" });
    }

    const redirectUri = `${BACKEND_URL}/api/oauth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${GITHUB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=user:email`;

    res.redirect(githubAuthUrl);
});

router.get("/github/callback", async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.redirect(`${FRONTEND_URL}/login?error=${error}`);
        }

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
        }

        // Exchange code for token
        const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code
        }, {
            headers: { Accept: "application/json" }
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { id, login, name, avatar_url } = userResponse.data;

        // Get user email (GitHub may hide email)
        let email = userResponse.data.email;
        if (!email) {
            const emailsResponse = await axios.get("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            const primaryEmail = emailsResponse.data.find(e => e.primary);
            email = primaryEmail ? primaryEmail.email : `${login}@github.local`;
        }

        // Find or create user
        const user = await findOrCreateOAuthUser("github", id.toString(), email, name || login, avatar_url);

        // Log login
        await query(
            `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
             VALUES ($1, 'login', 'User logged in via GitHub', NOW())`,
            [user.id]
        );

        generateTokenAndRedirect(res, user);

    } catch (error) {
        console.error("GitHub OAuth error:", error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/login?error=github_auth_failed`);
    }
});

export default router;
