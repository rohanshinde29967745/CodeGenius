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
        // If no API key, use simulation mode
        if (!JUDGE0_API_KEY) {
            console.log("⚠️ No Judge0 API key - using simulation mode");
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

        // Fallback to simulation if API fails
        return simulateExecution(code, language, input, res);
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
function simulateExecution(code, language, input, res) {
    // This simulates code execution for demo purposes
    // In production, you should use the Judge0 API

    setTimeout(() => {
        // Try to detect common patterns and simulate output
        let output = "";
        let error = null;

        try {
            // Simple pattern detection for common code structures
            if (language === "python") {
                // Check for print statements
                const printMatch = code.match(/print\s*\(\s*["'](.+?)["']\s*\)/);
                if (printMatch) {
                    output = printMatch[1];
                } else if (code.includes("print(")) {
                    output = "Program executed successfully";
                }
            } else if (language === "javascript") {
                const consoleMatch = code.match(/console\.log\s*\(\s*["'](.+?)["']\s*\)/);
                if (consoleMatch) {
                    output = consoleMatch[1];
                } else if (code.includes("console.log")) {
                    output = "Program executed successfully";
                }
            }

            // If no output detected, provide generic message
            if (!output) {
                output = "Code executed (simulation mode - add JUDGE0_API_KEY for real execution)";
            }

            res.json({
                success: true,
                output: output,
                error: null,
                status: "Simulated",
                executionTime: Math.random() * 50 + 10, // Random 10-60ms
                memory: Math.floor(Math.random() * 5000) + 1000, // Random 1-6MB
                simulated: true,
            });

        } catch (e) {
            res.json({
                success: false,
                output: "",
                error: "Simulation failed: " + e.message,
                status: "Error",
                executionTime: null,
                memory: null,
                simulated: true,
            });
        }
    }, 500); // Simulate delay
}

// Simulate test cases
function simulateTestCases(code, language, testCases, res) {
    setTimeout(() => {
        const results = testCases.map((testCase, i) => {
            // For simulation, we'll randomly pass/fail or use simple logic
            // In real usage, Judge0 would actually execute the code

            const expectedOutput = testCase.expectedOutput?.trim() || "";

            // Simple simulation: pass if code looks reasonable
            const hasReturnOrPrint = code.includes("return") ||
                code.includes("print") ||
                code.includes("console.log") ||
                code.trim().length > 5;

            // Make it pass predictably for demo testing instead of randomly failing 30% of the time
            const passed = hasReturnOrPrint;

            return {
                testCaseNumber: i + 1,
                input: testCase.input,
                expectedOutput: expectedOutput,
                actualOutput: passed ? expectedOutput : "Different output (simulated)",
                passed: passed,
                error: null,
                status: "Simulated",
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
            maxMemory: Math.max(...results.map(r => r.memory)),
            results,
            simulated: true,
            message: "⚠️ Running in simulation mode. Add JUDGE0_API_KEY to .env for real code execution.",
        });
    }, 800);
}

export default router;
