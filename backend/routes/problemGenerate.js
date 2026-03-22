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
  "constraints": []
}

IMPORTANT REQUIREMENTS:
- Difficulty: ${difficulty}
- Programming Language: ${language}
- Problem Type: ${problemType || 'General'}
- Generate a problem that is SPECIFICALLY suited for ${language}
- Use ${language} syntax in examples and descriptions
- Make sure the problem showcases ${language} features and idioms
- Examples should use ${language}-appropriate data structures and syntax

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

export default router;
