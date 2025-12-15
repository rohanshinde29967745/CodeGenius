import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { query } from "../config/db.js";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const {
    userId, // New: User ID required for tracking
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

  // AI Judge Prompt
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
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const aiResult = JSON.parse(raw);

    // ==========================================
    // DATABASE PERSISTENCE LOGIC
    // ==========================================
    let statsUpdated = false;

    if (userId && problem) {
      try {
        // 1. Ensure Problem Exists (or find it)
        // Since we generate problems on the fly, we need to save this specific instance
        // Check if problem with same title exists to avoid duplicates
        let problemId;
        const problemCheck = await query(
          "SELECT id FROM problems WHERE title = $1",
          [problem]
        );

        if (problemCheck.rows.length > 0) {
          problemId = problemCheck.rows[0].id;
        } else {
          // Insert new problem
          const newProblem = await query(
            `INSERT INTO problems 
             (title, description, difficulty, language, constraints, is_generated_by_ai, points_reward)
             VALUES ($1, $2, $3, $4, $5, TRUE, 20)
             RETURNING id`,
            [
              problem,
              description,
              "Medium", // Default for AI problems if not passed
              language,
              constraints
            ]
          );
          problemId = newProblem.rows[0].id;
        }

        // 2. Record Submission
        const status = aiResult.correct ? "Accepted" : "Wrong Answer";
        // Calculate points: Full points (20) if correct, 0 if not (simplified)
        // If high score but not fully correct, maybe give partial? 
        // For now, let's give score/5 points
        const pointsEarned = aiResult.correct ? 20 : Math.floor(aiResult.score / 10);

        await query(
          `INSERT INTO submissions 
           (user_id, problem_id, code, language, status, passed_test_cases, total_test_cases, ai_score, points_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userId,
            problemId,
            userSolution,
            language,
            status,
            aiResult.testsPassed || 0,
            aiResult.testsTotal || 0,
            aiResult.score || 0,
            pointsEarned
          ]
        );

        // 3. Log Activity
        await query(
          `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [
            userId,
            aiResult.correct ? "problem_solved" : "problem_attempted",
            `Solved: ${problem} (${status})`
          ]
        );

        statsUpdated = true;

      } catch (dbError) {
        console.error("Database save failed:", dbError);
        // Don't fail the request, just log error
      }
    }

    const finalMessage = aiResult.correct
      ? `✅ Correct Solution!\n\n${aiResult.feedback}\n\nScore: ${aiResult.score}`
      : `❌ Incorrect Solution.\n\n${aiResult.feedback}`;

    res.json({ result: finalMessage, saved: statsUpdated });

  } catch (err) {
    console.error("CHECK ERROR:", err);
    res.json({ result: "❌ Failed to check solution." });
  }
});

export default router;
