import express from "express";
import axios from "axios";
import { query } from "../config/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { inputCode, userId, language = "javascript" } = req.body;

  if (!inputCode || !inputCode.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  try {
    // STRICT JSON PROMPT (no invalid symbols)
    const prompt = `
You are an advanced AI Code Analyzer. Analyze the code below and RETURN ONLY VALID JSON.

The JSON structure must be EXACTLY:

{
  "explanation": ["step 1", "step 2"],
  "errors": [
    { "line": 0, "severity": "low", "message": "error message" }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "notes": "optional notes"
  },
  "flowchart": ["step 1", "step 2"],
  "optimized": "full optimized code as multiline string"
}

RULES:
- DO NOT include markdown.
- DO NOT include comments.
- DO NOT add extra text before or after JSON.
- explanation & flowchart must be arrays.
- errors must be an array of objects.
- optimized must be a string (can include newlines).
- If unknown, use: "", [], null

Analyze this code:
${inputCode}
`;

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const response = await axios.post(
      endpoint,
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    const raw = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("\nRAW OUTPUT:\n", raw);

    let parsed = null;

    // Try normal JSON parsing
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try fallback substring extraction
      const first = raw.indexOf("{");
      const last = raw.lastIndexOf("}");
      if (first !== -1 && last > first) {
        const sub = raw.slice(first, last + 1);
        try {
          parsed = JSON.parse(sub);
        } catch (e2) {
          console.log("SECOND JSON PARSE FAILED");
        }
      }
    }

    // If still no JSON → fallback for safety
    if (!parsed) {
      return res.json({
        explanation: ["Could not parse JSON from AI."],
        errors: [],
        complexity: {
          time: "unknown",
          space: "unknown",
          notes: "JSON parse failed",
        },
        flowchart: [],
        optimized: "",
      });
    }

    // Normalize values for frontend safety
    const out = {
      explanation: Array.isArray(parsed.explanation)
        ? parsed.explanation
        : String(parsed.explanation || "").split("\n"),

      errors: Array.isArray(parsed.errors) ? parsed.errors : [],

      complexity:
        parsed.complexity && typeof parsed.complexity === "object"
          ? parsed.complexity
          : { time: "", space: "", notes: "" },

      flowchart: Array.isArray(parsed.flowchart)
        ? parsed.flowchart
        : String(parsed.flowchart || "").split("\n"),

      optimized: typeof parsed.optimized === "string" ? parsed.optimized : "",
    };

    // ==========================================
    // DATABASE PERSISTENCE LOGIC
    // ==========================================
    if (userId) {
      try {
        // Log Activity
        await query(
          `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
           VALUES ($1, 'code_analyzed', $2, NOW())`,
          [userId, `Analyzed ${language} code`]
        );

        // Optional: Save detailed analysis
        await query(
          `INSERT INTO code_analyses 
             (user_id, input_code, language, explanation, errors, complexity, flowchart, optimized_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            inputCode,
            language,
            out.explanation.join("\n"),
            out.errors,
            out.complexity, // Ensure db column is JSONB
            out.flowchart.join("\n"),
            out.optimized
          ]
        );

      } catch (dbError) {
        console.error("Database log failed:", dbError);
      }
    }

    res.json(out);
  } catch (error) {
    console.error("Gemini API Error:", error?.response?.data || error);
    res.status(500).json({ error: "Failed to analyze code" });
  }
});

export default router;
