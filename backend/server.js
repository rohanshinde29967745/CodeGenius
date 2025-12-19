import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
import pool from "./config/db.js";

// Existing routes
import analyzeRoute from "./routes/analyze.js";
import convertRoute from "./routes/convert.js";

// NEW routes (Problem Generate + Problem Check)
import problemGenerateRoute from "./routes/problemGenerate.js";
import problemCheckRoute from "./routes/problemCheck.js";

// Auth routes
import authRoute from "./routes/auth.js";

// NEW Dynamic Data routes
import usersRoute from "./routes/users.js";
import leaderboardRoute from "./routes/leaderboard.js";
import adminRoute from "./routes/admin.js";
import projectsRoute from "./routes/projects.js";
import reportsRoute from "./routes/reports.js";
import oauthRoute from "./routes/oauth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------
// ROUTES
// --------------------

// Authentication (Register, Login, Profile)
app.use("/api/auth", authRoute);

// User data (Stats, Activity, Badges, Skills)
app.use("/api/users", usersRoute);

// Leaderboard
app.use("/api/leaderboard", leaderboardRoute);

// Admin Dashboard
app.use("/api/admin", adminRoute);

// Projects
app.use("/api/projects", projectsRoute);

// Code Analyzer (AI analysis)
app.use("/api/analyze", analyzeRoute);

// Code Converter (language conversion)
app.use("/api/convert", convertRoute);

// NEW — AI Problem Generator
app.use("/api/problem-generate", problemGenerateRoute);

// NEW — AI Problem Checker
app.use("/api/problem-check", problemCheckRoute);

// Reports (Bug/Feature reporting)
app.use("/api/reports", reportsRoute);

// OAuth (Google, GitHub login)
app.use("/api/oauth", oauthRoute);

// --------------------
// Database Health Check
// --------------------
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected",
      error: error.message
    });
  }
});

// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Test database connection
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }

  console.log("✅ Routes active:");
  console.log("→ /api/auth (Authentication)");
  console.log("→ /api/users (User Stats, Activity, Badges)");
  console.log("→ /api/leaderboard (Rankings)");
  console.log("→ /api/admin (Platform Statistics)");
  console.log("→ /api/projects (Project Gallery)");
  console.log("→ /api/analyze (Code Analyzer)");
  console.log("→ /api/convert (Code Converter)");
  console.log("→ /api/problem-generate (Problem Generator)");
  console.log("→ /api/problem-check (Solution Checker)");
  console.log("→ /api/health (Database Health Check)");
});