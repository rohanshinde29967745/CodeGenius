import express from "express";
import axios from "axios";
import { query } from "../config/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { inputLang, outputLang, inputCode, userId } = req.body;

    if (!inputCode || !inputLang || !outputLang) {
      return res.status(400).json({ error: "Missing inputLang/outputLang/inputCode" });
    }

    // Compose a focused prompt
    const prompt = `
You are a professional code converter.
Convert the code below from ${inputLang} to ${outputLang}.
Output ONLY the converted code block — no explanations, no extra text.

Input code:
${inputCode}
`;

    // Gemini Flash 2.5 REST endpoint (using API key as param)
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const body = {
      // Use the request shape expected by the API - keep it simple: single content with prompt
      // The exact request schema may vary by provider; the example uses { contents: [{ parts: [{ text }] }] }
      // This mirrors common "generate" shapes but if your account expects different shape, adjust accordingly.
      contents: [{ parts: [{ text: prompt }] }],
      // optional: tune safety / temperature etc if supported
      // e.g. temperature: 0.0
    };

    const response = await axios.post(endpoint, body, {
      params: { key: process.env.GEMINI_API_KEY },
      headers: { "Content-Type": "application/json" },
      timeout: 60000
    });

    // Attempt to extract text (structure depends on API response)
    const converted =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.data?.candidates?.[0]?.output ||
      response?.data?.output?.[0]?.content ||
      null;

    if (!converted) {
      console.error("Unexpected Gemini response:", JSON.stringify(response.data, null, 2));
      return res.status(500).json({ error: "No output from Gemini" });
    }

    const convertedCode = String(converted).trim();

    // ==========================================
    // DATABASE PERSISTENCE LOGIC
    // ==========================================
    if (userId) {
      try {
        // Log Activity
        await query(
          `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
            VALUES ($1, 'code_converted', $2, NOW())`,
          [userId, `Converted ${inputLang} to ${outputLang}`]
        );

        // Optional: Save conversion
        await query(
          `INSERT INTO code_conversions 
             (user_id, source_language, target_language, source_code, converted_code)
             VALUES ($1, $2, $3, $4, $5)`,
          [userId, inputLang, outputLang, inputCode, convertedCode]
        );

      } catch (dbError) {
        console.error("Database log failed:", dbError);
      }
    }

    // Trim any leading/trailing whitespace
    res.json({ convertedCode });
  } catch (err) {
    console.error("Convert error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Conversion failed", details: err?.message || err });
  }
});

export default router;
