import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// import both routes
import analyzeRoute from "./routes/analyze.js";
import convertRoute from "./routes/convert.js";

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

// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ Routes active:");
  console.log("→ /api/analyze (Code Analyzer)");
  console.log("→ /api/convert (Code Converter)");
});