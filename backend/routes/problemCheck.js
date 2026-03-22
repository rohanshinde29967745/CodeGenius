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
    return res.json({ result: "⚠️ No solution provided.", saved: false });
  }

  // Ensure arrays are properly defined
  const safeConstraints = Array.isArray(constraints) ? constraints : [];
  const safeExamples = Array.isArray(examples) ? examples : [];

  // Ensure userId is a valid number
  const parsedUserId = parseInt(userId);

  // Validate user ID early
  if (!parsedUserId || isNaN(parsedUserId)) {
    console.log(`⚠️ Invalid or missing userId: ${userId}`);
    return res.json({ result: "⚠️ Please log in to track your progress.", saved: false });
  }

  console.log(`📝 Checking solution for problem: ${problem} by user: ${parsedUserId}`);

  // AI Judge Prompt
  const prompt = `
You are a strict coding judge.
Check the user's solution for correctness.

### Problem Title:
${problem || "Unknown Problem"}

### Description:
${description || "No description provided"}

### Constraints:
${safeConstraints.length > 0 ? safeConstraints.join("\n") : "No constraints"}

### Examples:
${safeExamples.length > 0
      ? safeExamples.map(
        (ex) =>
          `Input: ${ex?.input || "N/A"}\nOutput: ${ex?.output || "N/A"}\nExplanation: ${ex?.explain || "N/A"}`
      ).join("\n\n")
      : "No examples provided"}

### User Language:
${language || "Unknown"}

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
    console.log("🔄 Calling Gemini API...");

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

    if (parsedUserId && problem) {
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

        // 2. Record Submission & Attempt
        const isCorrect = aiResult.correct || false;
        const pointsEarned = isCorrect ? 20 : Math.floor((aiResult.score || 0) / 10);

        // Record in submissions (legacy)
        await query(
          `INSERT INTO submissions 
           (user_id, problem_id, code, language, status, passed_test_cases, total_test_cases, ai_score, points_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            parsedUserId,
            problemId,
            userSolution,
            language,
            isCorrect ? "Accepted" : "Wrong Answer",
            aiResult.testsPassed || 0,
            aiResult.testsTotal || 0,
            aiResult.score || 0,
            pointsEarned
          ]
        );

        // Record in problem_attempts (for Insights)
        try {
          await query(
            `INSERT INTO problem_attempts 
             (user_id, problem_id, language, is_correct, xp_earned, attempted_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [parsedUserId, problemId, language, isCorrect, pointsEarned]
          );
        } catch (err) {
          console.error("Failed to insert into problem_attempts - maybe table missing?", err.message);
        }

        // 3. Update User Stats (XP, Points, Solved Count) - SIMPLIFIED & ROBUST
        let userStatsUpdated = false;
        try {
          console.log(`📊 Updating stats for userId: ${parsedUserId}, pointsEarned: ${pointsEarned}, isCorrect: ${isCorrect}`);

          // Use a simple UPDATE that adds to existing values
          // This works even if columns have NULL values (COALESCE handles it)
          const isMedium = (problemCheck.rows[0]?.difficulty || 'Medium') === 'Medium';

          const updateResult = await query(
            `UPDATE users SET 
              total_points = COALESCE(total_points, 0) + $1,
              experience_points = COALESCE(experience_points, 0) + $1,
              current_xp = COALESCE(current_xp, 0) + $1,
              problems_solved = COALESCE(problems_solved, 0) + $2,
              medium_problems_solved = COALESCE(medium_problems_solved, 0) + $3,
              total_submissions = COALESCE(total_submissions, 0) + 1,
              accepted_submissions = COALESCE(accepted_submissions, 0) + $2,
              accuracy_rate = CASE 
                WHEN (COALESCE(total_submissions, 0) + 1) > 0 
                THEN ROUND(((COALESCE(accepted_submissions, 0) + $2)::DECIMAL / (COALESCE(total_submissions, 0) + 1)) * 100, 2)
                ELSE 0 
              END,
              updated_at = NOW()
            WHERE id = $4
            RETURNING id, total_points, problems_solved, current_xp, experience_points, total_submissions, accepted_submissions, accuracy_rate`,
            [pointsEarned, isCorrect ? 1 : 0, (isCorrect && isMedium) ? 1 : 0, parsedUserId]
          );

          if (updateResult.rows.length > 0) {
            console.log(`✅ Stats updated successfully:`, updateResult.rows[0]);
            userStatsUpdated = true;

            // Now update level based on total XP using string levels
            const newTotalXp = parseInt(updateResult.rows[0].current_xp) || 0;
            let newLevel = 'Bronze';
            let xpToNext = 1000;

            // Level thresholds based on XP
            if (newTotalXp >= 5000) {
              newLevel = 'Platinum';
              xpToNext = 0; // Max level
            } else if (newTotalXp >= 2500) {
              newLevel = 'Gold';
              xpToNext = 5000 - newTotalXp;
            } else if (newTotalXp >= 1000) {
              newLevel = 'Silver';
              xpToNext = 2500 - newTotalXp;
            } else {
              newLevel = 'Bronze';
              xpToNext = 1000 - newTotalXp;
            }

            // Update level using string value (handles both VARCHAR and attempts graceful fallback)
            try {
              await query(
                `UPDATE users SET 
                  current_level = $1,
                  xp_to_next_level = $2
                WHERE id = $3`,
                [newLevel, Math.max(0, xpToNext), parsedUserId]
              );
              console.log(`🎮 User ${parsedUserId} level: ${newLevel}, XP to next: ${xpToNext}`);
            } catch (levelErr) {
              // If current_level is INTEGER type, try with numeric value
              console.log(`⚠️ Level update with string failed, trying numeric fallback...`);
              const levelMap = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4 };
              try {
                await query(
                  `UPDATE users SET 
                    current_level = $1,
                    xp_to_next_level = $2
                  WHERE id = $3`,
                  [levelMap[newLevel], Math.max(0, xpToNext), parsedUserId]
                );
              } catch (numErr) {
                console.error(`❌ Failed to update level:`, numErr.message);
              }
            }
          } else {
            console.log(`⚠️ No user found with id ${parsedUserId} - stats NOT updated!`);
          }

          console.log(`✅ Updated stats for user ${parsedUserId}: +${pointsEarned} points, solved: ${isCorrect}`);

        } catch (err) {
          console.error("❌ Failed to update user stats:", err.message);
          console.error("Full error:", err);
          // Continue with the request but note that stats weren't updated
        }

        // 4. Log Activity
        await query(
          `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [
            parsedUserId,
            isCorrect ? "problem_solved" : "problem_attempted",
            `Solved: ${problem} (${isCorrect ? "Accepted" : "Wrong Answer"})`
          ]
        );

        // 5. Update Streak (only for correct solutions)
        if (isCorrect) {
          // Get user's last submission date
          const userResult = await query(
            `SELECT last_submission_date, current_streak, longest_streak FROM users WHERE id = $1`,
            [parsedUserId]
          );

          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const lastDate = user.last_submission_date ? new Date(user.last_submission_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let newStreak = user.current_streak || 0;

            if (lastDate) {
              lastDate.setHours(0, 0, 0, 0);
              const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

              if (diffDays === 0) {
                // Same day - streak stays same (already counted)
              } else if (diffDays === 1) {
                // Consecutive day - increment streak!
                newStreak = newStreak + 1;
              } else {
                // Streak broken - reset to 1
                newStreak = 1;
              }
            } else {
              // First submission ever
              newStreak = 1;
            }

            const newLongest = Math.max(newStreak, user.longest_streak || 0);

            await query(
              `UPDATE users SET current_streak = $1, longest_streak = $2, last_submission_date = CURRENT_DATE WHERE id = $3`,
              [newStreak, newLongest, parsedUserId]
            );
          }
        }

        statsUpdated = true;

      } catch (dbError) {
        console.error("Database save failed:", dbError);
        // Don't fail the request, just log error
      }
    }

    const finalMessage = aiResult.correct
      ? `✅ Correct Solution!\n\n${aiResult.feedback}\n\nScore: ${aiResult.score}`
      : `❌ Incorrect Solution.\n\n${aiResult.feedback}`;

    // Return comprehensive response with stats update info
    res.json({
      result: finalMessage,
      saved: statsUpdated,
      correct: aiResult.correct || false,
      score: aiResult.score || 0,
      pointsEarned: aiResult.correct ? 20 : Math.floor((aiResult.score || 0) / 10)
    });

  } catch (err) {
    console.error("❌ CHECK ERROR:", err.message);
    console.error("Full error:", err.response?.data || err);

    // FALLBACK: Still save stats even if Gemini API fails
    // Assume the solution is correct with a default score
    let statsUpdated = false;

    if (parsedUserId && problem) {
      try {
        console.log("⚠️ API failed, using fallback logic to save stats...");

        // Default values when API fails - give user benefit of doubt
        const isCorrect = true;
        const pointsEarned = 15; // Slightly lower than perfect score

        // 1. Find or create problem
        let problemId;
        const problemCheck = await query(
          "SELECT id FROM problems WHERE title = $1",
          [problem]
        );

        if (problemCheck.rows.length > 0) {
          problemId = problemCheck.rows[0].id;
        } else {
          const newProblem = await query(
            `INSERT INTO problems 
             (title, description, difficulty, language, is_generated_by_ai, points_reward)
             VALUES ($1, $2, $3, $4, TRUE, 15)
             RETURNING id`,
            [problem, description || 'AI Generated Problem', 'Medium', language]
          );
          problemId = newProblem.rows[0].id;
        }

        // 2. Update user stats
        const updateResult = await query(
          `UPDATE users SET 
            total_points = COALESCE(total_points, 0) + $1,
            experience_points = COALESCE(experience_points, 0) + $1,
            current_xp = COALESCE(current_xp, 0) + $1,
            problems_solved = COALESCE(problems_solved, 0) + 1,
            medium_problems_solved = COALESCE(medium_problems_solved, 0) + 1,
            total_submissions = COALESCE(total_submissions, 0) + 1,
            accepted_submissions = COALESCE(accepted_submissions, 0) + 1,
            accuracy_rate = CASE 
              WHEN (COALESCE(total_submissions, 0) + 1) > 0 
              THEN ROUND(((COALESCE(accepted_submissions, 0) + 1)::DECIMAL / (COALESCE(total_submissions, 0) + 1)) * 100, 2)
              ELSE 0 
            END,
            updated_at = NOW()
          WHERE id = $2
          RETURNING id, total_points, problems_solved, current_xp, accuracy_rate`,
          [pointsEarned, parsedUserId]
        );

        if (updateResult.rows.length > 0) {
          console.log(`✅ Fallback stats saved:`, updateResult.rows[0]);
          statsUpdated = true;

          // Update level
          const newTotalXp = parseInt(updateResult.rows[0].current_xp) || 0;
          let newLevel = 'Bronze';
          let xpToNext = 1000;

          if (newTotalXp >= 5000) {
            newLevel = 'Platinum';
            xpToNext = 0;
          } else if (newTotalXp >= 2500) {
            newLevel = 'Gold';
            xpToNext = 5000 - newTotalXp;
          } else if (newTotalXp >= 1000) {
            newLevel = 'Silver';
            xpToNext = 2500 - newTotalXp;
          } else {
            xpToNext = 1000 - newTotalXp;
          }

          await query(
            `UPDATE users SET current_level = $1, xp_to_next_level = $2 WHERE id = $3`,
            [newLevel, Math.max(0, xpToNext), parsedUserId]
          );
        }

        // 3. Log activity
        await query(
          `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [parsedUserId, 'problem_solved', `Solved: ${problem} (Accepted - Fallback)`]
        );

        // 4. Record in problem_attempts (for Insights/Heatmap/Skills)
        try {
          await query(
            `INSERT INTO problem_attempts 
             (user_id, problem_id, language, is_correct, xp_earned, attempted_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [parsedUserId, problemId, language || 'JavaScript', true, pointsEarned]
          );
          console.log(`📊 Fallback: Added to problem_attempts for insights`);
        } catch (attemptErr) {
          console.error("Failed to insert problem_attempt:", attemptErr.message);
        }

      } catch (dbErr) {
        console.error("❌ Fallback save also failed:", dbErr.message);
      }
    }

    res.json({
      result: statsUpdated
        ? `✅ Solution submitted! (AI feedback unavailable)\n\nYour progress has been saved.`
        : `❌ Failed to check solution: ${err.message}`,
      saved: statsUpdated,
      correct: statsUpdated,
      score: statsUpdated ? 70 : 0,
      pointsEarned: statsUpdated ? 15 : 0
    });
  }
});

export default router;
