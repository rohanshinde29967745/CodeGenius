import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const { difficulty, language, problemType } = req.body;

  const prompt = `
Generate a coding interview problem in JSON ONLY for ${language}.
Match this structure EXACTLY:

{
  "title": "",
  "description": "",
  "examples": [
    { "input": "", "output": "", "explain": "" }
  ],
  "constraints": [],
  "starterCode": ""
}

IMPORTANT REQUIREMENTS:
- Difficulty: ${difficulty}
- Programming Language: ${language}
- Problem Type: ${problemType || 'General'}
- Generate a problem that is SPECIFICALLY suited for ${language}
- Use ${language} syntax in examples and descriptions
- Make sure the problem showcases ${language} features and idioms
- Examples should use ${language}-appropriate data structures and syntax
- The "starterCode" field MUST contain a starter code template/skeleton written in ${language} syntax.
  It should be a function or class stub that the user will fill in to solve the problem.
  Use proper ${language} syntax, keywords, and conventions.
  For example:
    - If ${language} is Python: use "def function_name(params):\n    # Write your solution here\n    pass"
    - If ${language} is JavaScript: use "function functionName(params) {\n  // Write your solution here\n}"
    - If ${language} is Java: use "public class Solution {\n    public ReturnType methodName(ParamType params) {\n        // Write your solution here\n    }\n}"
    - If ${language} is C++: use "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    ReturnType methodName(ParamType params) {\n        // Write your solution here\n    }\n};"
  The function/method name should be relevant to the problem.
  Include appropriate parameter types and return types for the language.

Generate the problem now in valid JSON format only.
`;

  try {
    const apiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    let raw = apiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const json = JSON.parse(raw);
    res.json(json);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem generation failed" });
  }
});

// Cache for daily problem to avoid regenerating same thing many times
let dailyCache = {
  date: null,
  problem: null
};

router.get("/daily", async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  if (dailyCache.date === today && dailyCache.problem) {
    return res.json(dailyCache.problem);
  }

  const prompt = `
Generate a modern coding interview problem in JSON ONLY.
Match this structure EXACTLY:

{
  "title": "",
  "description": "",
  "examples": [
    { "input": "", "output": "", "explain": "" }
  ],
  "constraints": [],
  "difficulty": "Medium",
  "category": "Daily Challenge",
  "language": "JavaScript"
}

IMPORTANT: 
- This is the DAILY CHALLENGE for ${today}.
- Focus on a specific logic or data structure problem (like Arrays, Strings, or Recursion).
- Complexity should be suitable for a 30-minute session.
- Generate valid JSON only.
`;

  try {
    const apiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    let raw = apiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const json = JSON.parse(raw);
    json.id = `daily-${today}`; // Unique ID for the day

    dailyCache = { date: today, problem: json };
    res.json(json);

  } catch (err) {
    console.error("Daily problem generation failed:", err);
    res.status(500).json({ error: "Failed to load daily challenge" });
  }
});

export default router;
