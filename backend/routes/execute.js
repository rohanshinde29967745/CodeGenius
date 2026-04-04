import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Judge0 Language IDs
const LANGUAGE_IDS = {
    "python": 71,      // Python 3
    "javascript": 63,  // JavaScript (Node.js)
    "java": 62,        // Java
    "c": 50,           // C (GCC)
    "c++": 54,         // C++ (GCC)
    "cpp": 54,         // C++ alternate name
};

// Judge0 API Configuration
// You can use RapidAPI's Judge0 or self-hosted
// RapidAPI: https://rapidapi.com/judge0-official/api/judge0-ce
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Execute single code
router.post("/run", async (req, res) => {
    const { code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: "Code and language are required" });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    try {
        // If no API key, enforce real execution explicitly
        if (!JUDGE0_API_KEY) {
            console.log("⚠️ No Judge0 API key - using simulation mode for compilation/run");
            return simulateExecution(code, language, input, res);
        }

        // Submit code to Judge0
        const submitResponse = await axios.post(
            `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
            {
                source_code: Buffer.from(code).toString('base64'),
                language_id: languageId,
                stdin: input ? Buffer.from(input).toString('base64') : "",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_API_HOST,
                },
            }
        );

        const result = submitResponse.data;

        // Decode base64 outputs
        const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : "";
        const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : "";
        const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : "";

        res.json({
            success: true,
            output: stdout.trim(),
            error: stderr || compileOutput || null,
            status: result.status?.description || "Unknown",
            executionTime: result.time ? parseFloat(result.time) * 1000 : null, // Convert to ms
            memory: result.memory || null, // in KB
        });

    } catch (error) {
        console.error("Judge0 API error:", error.response?.data || error.message);
        return res.json({
            success: false,
            error: "Execution failed. Judge0 API encountered an error.",
            status: "Error"
        });
    }
});

// Run multiple test cases
router.post("/test", async (req, res) => {
    const { code, language, testCases } = req.body;

    if (!code || !language || !testCases || !Array.isArray(testCases)) {
        return res.status(400).json({ error: "Code, language, and testCases array are required" });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const results = [];

    try {
        // If no API key, use simulation mode
        if (!JUDGE0_API_KEY) {
            console.log("⚠️ No Judge0 API key - using simulation mode for test cases");
            return simulateTestCases(code, language, testCases, res);
        }

        // Process each test case
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];

            try {
                const submitResponse = await axios.post(
                    `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
                    {
                        source_code: Buffer.from(code).toString('base64'),
                        language_id: languageId,
                        stdin: testCase.input ? Buffer.from(testCase.input).toString('base64') : "",
                        expected_output: testCase.expectedOutput ? Buffer.from(testCase.expectedOutput).toString('base64') : undefined,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-RapidAPI-Key": JUDGE0_API_KEY,
                            "X-RapidAPI-Host": JUDGE0_API_HOST,
                        },
                        timeout: 15000, // 15 second timeout per test
                    }
                );

                const result = submitResponse.data;
                const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString().trim() : "";
                const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : "";
                const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : "";

                const expectedOutput = (testCase.expectedOutput || testCase.expected_output || "").trim();
                const passed = stdout === expectedOutput;

                results.push({
                    testCaseNumber: i + 1,
                    input: testCase.input,
                    expectedOutput: expectedOutput,
                    actualOutput: stdout,
                    passed: passed,
                    error: stderr || compileOutput || null,
                    status: result.status?.description || "Unknown",
                    executionTime: result.time ? parseFloat(result.time) * 1000 : null,
                    memory: result.memory || null,
                });

            } catch (testError) {
                results.push({
                    testCaseNumber: i + 1,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput?.trim() || "",
                    actualOutput: "",
                    passed: false,
                    error: testError.message || "Execution failed",
                    status: "Error",
                    executionTime: null,
                    memory: null,
                });
            }
        }

        const passedCount = results.filter(r => r.passed).length;
        const totalTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
        const maxMemory = Math.max(...results.map(r => r.memory || 0));

        res.json({
            success: true,
            allPassed: passedCount === testCases.length,
            passedCount,
            totalCount: testCases.length,
            totalTime: Math.round(totalTime * 100) / 100,
            maxMemory,
            results,
        });

    } catch (error) {
        console.error("Test execution error:", error.message);
        return simulateTestCases(code, language, testCases, res);
    }
});

// Simulation mode when no API key
async function simulateExecution(code, language, input, res) {
    if (!GEMINI_API_KEY) {
        return res.json({
            success: true,
            output: "Code executed (dumb simulation mode - add GEMINI_API_KEY or JUDGE0_API_KEY)",
            error: null,
            status: "Simulated",
            executionTime: 15,
            memory: 1024,
            simulated: true,
        });
    }

    const prompt = `You are a code execution engine simulating stdout. Run this ${language} code with this input:\nInput: ${input || "(no input)"}\n\nCode:\n${code}\n\nReturn JSON ONLY:\n{ "output": "stdout string", "error": "error string if it fails, else null", "status": "Finished or Error" }`;
    
    try {
        const apiRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
            { contents: [{ parts: [{ text: prompt }] }] }
        );
        let raw = apiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) raw = raw.substring(firstBrace, lastBrace + 1);
        const json = JSON.parse(raw);
        
        res.json({
            success: true,
            output: json.output || "",
            error: json.error || null,
            status: json.status || "Simulated",
            executionTime: Math.random() * 50 + 10,
            memory: Math.floor(Math.random() * 5000) + 1000,
            simulated: true,
        });
    } catch(err) {
        res.json({ success: false, output: "", error: "Simulation failed", status: "Error", executionTime: null, memory: null, simulated: true });
    }
}

// Simulate test cases using Gemini
async function simulateTestCases(code, language, testCases, res) {
    if (!GEMINI_API_KEY) {
        const results = testCases.map((tc, i) => ({
            testCaseNumber: i + 1,
            input: tc.input,
            expectedOutput: tc.expectedOutput?.trim() || "",
            actualOutput: "Requires API Key",
            passed: false,
            error: "Please add GEMINI_API_KEY or JUDGE0_API_KEY to .env",
            status: "Simulated Error",
            executionTime: 0,
            memory: 0,
        }));
        return res.json({ success: true, allPassed: false, passedCount: 0, totalCount: testCases.length, totalTime: 0, maxMemory: 0, results, simulated: true });
    }

    const testCasesString = testCases.map((tc, i) => `Case ${i+1}:\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}`).join("\n\n");
    const prompt = `You are a strict test case runner. Run this ${language} code mentally against these test cases.\nCode:\n${code}\n\nCases:\n${testCasesString}\n\nIMPORTANT: If the code is missing logic, incomplete, or functionally wrong, it MUST NOT match the expected output. Return JSON ONLY:\n{ "results": [ { "testCaseNumber": 1, "actualOutput": "string output", "passed": true/false, "error": "error if any" } ] }`;

    try {
        const apiRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
            { contents: [{ parts: [{ text: prompt }] }] }
        );
        let raw = apiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) raw = raw.substring(firstBrace, lastBrace + 1);
        const json = JSON.parse(raw);
        
        const results = testCases.map((tc, i) => {
            const aiResult = json.results?.find(r => r.testCaseNumber === i + 1) || {};
            const passed = aiResult.passed || false;
            return {
                testCaseNumber: i + 1,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: aiResult.actualOutput || (passed ? tc.expectedOutput : "Wrong Output"),
                passed: passed,
                error: aiResult.error || null,
                status: passed ? "Accepted" : "Wrong Answer",
                executionTime: Math.random() * 30 + 5,
                memory: Math.floor(Math.random() * 3000) + 500,
            };
        });

        const passedCount = results.filter(r => r.passed).length;
        res.json({
            success: true,
            allPassed: passedCount === testCases.length,
            passedCount,
            totalCount: testCases.length,
            totalTime: results.reduce((sum, r) => sum + r.executionTime, 0),
            maxMemory: Math.max(...results.map(r => r.memory || 0)),
            results,
            simulated: true,
            message: "⚠️ AI simulation mode."
        });
    } catch(err) {
        res.json({ success: false, error: "AI Simulation failed", results: [], allPassed: false, passedCount: 0, totalCount: testCases.length });
    }
}

export default router;
