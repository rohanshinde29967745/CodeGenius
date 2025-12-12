import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const {
    language,
    problem,
    description,
    constraints,
    examples,
    userSolution,
  } = req.body;

  if (!userSolution) {
    return res.json({ result: "⚠️ No solution provided." });
  }

  const prompt = `
You are a strict coding judge.
Check the user's solution for correctness.

### Problem Title:
${problem}

### Description:
${description}

### Constraints:
${constraints.join("\n")}

### Examples:
${examples
  .map(
    (ex) =>
      `Input: ${ex.input}\nOutput: ${ex.output}\nExplanation: ${ex.explain}`
  )
  .join("\n\n")}

### User Language:
${language}

### User Solution:
${userSolution}

### IMPORTANT — RETURN ONLY JSON BELOW:
{
  "correct": true/false,
  "feedback": "Short explanation of correctness or mistakes.",
  "score": <number 0-100>,
  "testsPassed": <number>,
  "testsTotal": <number>
}
NO extra text outside JSON.
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

    let raw = apiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Extract JSON safely
    raw = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    const json = JSON.parse(raw);

    const finalMessage =
      json.correct
        ? `✅ Correct Solution!\n\n${json.feedback}\n\nScore: ${json.score}`
        : `❌ Incorrect Solution.\n\n${json.feedback}`;

    res.json({ result: finalMessage });
  } catch (err) {
    console.error("CHECK ERROR:", err);
    res.json({ result: "❌ Failed to check solution." });
  }
});

export default router;
