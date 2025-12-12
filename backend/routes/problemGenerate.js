import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const { difficulty, language } = req.body;

  const prompt = `
Generate a coding interview problem in JSON ONLY.
Match this structure EXACTLY:

{
  "title": "",
  "description": "",
  "examples": [
    { "input": "", "output": "", "explain": "" }
  ],
  "constraints": []
}

Difficulty: ${difficulty}
Language focus: ${language}
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

    // Extract JSON safely
    raw = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    const json = JSON.parse(raw);

    res.json(json);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Problem generation failed" });
  }
});

export default router;
