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
    // Count actual code lines for context
    const codeLines = inputCode.split('\n').filter(line => line.trim()).length;

    // STRICT JSON PROMPT with Mermaid flowchart
    const prompt = `
You are an advanced AI Code Analyzer. Analyze the code below and RETURN ONLY VALID JSON.

The JSON structure must be EXACTLY:

{
  "explanation": [
    { "line": 1, "code": "actual code line", "explanation": "what this line does" }
  ],
  "errors": [
    { "line": 1, "severity": "low|medium|high", "title": "Error Title", "message": "description", "fix": "suggested fix code" }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "explanation": "Brief explanation of why this complexity"
  },
  "flowchart": "Mermaid flowchart syntax starting with graph TD",
  "optimized": "full optimized code as multiline string"
}

CRITICAL RULES:
- explanation array must have EXACTLY ${codeLines} items - one per actual non-empty line of code
- For each explanation item, include the actual code line text and its explanation
- flowchart must be valid Mermaid syntax (graph TD\\n  A[Start] --> B[Step]...)
- errors: if no errors found, return empty array []
- If code has no issues, return empty errors array
- DO NOT include markdown backticks
- DO NOT include comments or extra text

Analyze this ${language} code:
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
      // Keep explanation as array (may be objects with line/code/explanation or strings)
      explanation: Array.isArray(parsed.explanation)
        ? parsed.explanation
        : [],

      errors: Array.isArray(parsed.errors) ? parsed.errors : [],

      complexity:
        parsed.complexity && typeof parsed.complexity === "object"
          ? parsed.complexity
          : { time: "", space: "", explanation: "" },

      // Flowchart is now a Mermaid string
      flowchart: typeof parsed.flowchart === "string"
        ? parsed.flowchart
        : (Array.isArray(parsed.flowchart) ? parsed.flowchart.join("\n") : ""),

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
