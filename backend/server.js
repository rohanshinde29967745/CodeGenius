import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Existing routes
import analyzeRoute from "./routes/analyze.js";
import convertRoute from "./routes/convert.js";

// NEW routes (Problem Generate + Problem Check)
import problemGenerateRoute from "./routes/problemGenerate.js";
import problemCheckRoute from "./routes/problemCheck.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --------------------
// ROUTES
// --------------------

// Code Analyzer (AI analysis)
app.use("/api/analyze", analyzeRoute);

// Code Converter (language conversion)
app.use("/api/convert", convertRoute);

// NEW — AI Problem Generator
app.use("/api/problem-generate", problemGenerateRoute);

// NEW — AI Problem Checker
app.use("/api/problem-check", problemCheckRoute);

// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ Routes active:");
  console.log("→ /api/analyze (Code Analyzer)");
  console.log("→ /api/convert (Code Converter)");
  console.log("→ /api/problem-generate (Problem Generator)");
  console.log("→ /api/problem-check (Solution Checker)");
});