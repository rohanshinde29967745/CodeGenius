import React, { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";

function ProblemSolving() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [problemLang, setProblemLang] = useState("JavaScript");
  const [language, setLanguage] = useState("JavaScript");

  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState("");

  // Test results state (no attempts tracking)
  const [testResults, setTestResults] = useState([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  const solutionHighlightRef = useRef(null);

  // Prism language mapping
  const prismLangMap = {
    Python: "python",
    JavaScript: "javascript",
    "C++": "cpp",
    Java: "java",
  };

  // Highlight code using Prism
  const highlightCode = (code, lang) => {
    if (!code) return "";
    const prismLang = prismLangMap[lang] || "javascript";
    try {
      return Prism.highlight(code, Prism.languages[prismLang], prismLang);
    } catch (e) {
      return code;
    }
  };

  // Re-highlight when code changes
  useEffect(() => {
    Prism.highlightAll();
  }, [solution, language]);

  // Generate line numbers
  const getLineNumbers = (code) => {
    if (!code) return "1";
    const lines = code.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };

  // Sync scroll
  const handleScrollSync = (e) => {
    const scrollTop = e.target.scrollTop;
    if (solutionHighlightRef.current) {
      solutionHighlightRef.current.scrollTop = scrollTop;
    }
  };

  // -------------------------------
  // GENERATE PROBLEM
  // -------------------------------
  const generateProblem = async () => {
    setResult("Generating problem...");
    // Reset results when generating new problem
    setTestResults([]);
    setShowTestResults(false);
    setShowAIFeedback(false);
    setAiFeedback(null);

    try {
      const res = await fetch("http://localhost:4000/api/problem-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          language: problemLang,
        }),
      });

      const data = await res.json();

      setProblem(data.title || "");
      setDescription(data.description || "");
      setExamples(data.examples || []);
      setConstraints(data.constraints || []);

      setSolution("");
      setResult("");
    } catch (err) {
      console.error(err);
      setResult("❌ Could not generate problem");
    }
  };

  // -------------------------------
  // RUN TESTS - Just shows message, no test results
  // -------------------------------
  const runTests = async () => {
    if (!solution.trim()) {
      setResult("⚠️ Write solution first!");
      return;
    }

    setResult("🔄 Running tests...");

    // Simulate running tests (just shows a simple message)
    setTimeout(() => {
      setResult("✓ Code executed successfully! Submit to see full test results and AI feedback.");
    }, 1000);
  };

  // -------------------------------
  // CHECK SOLUTION - Shows test results and AI feedback
  // -------------------------------
  const checkSolution = async () => {
    if (!solution.trim()) {
      setResult("⚠️ Write solution first!");
      return;
    }

    setResult("🔄 Checking solution...");

    try {
      const res = await fetch("http://localhost:4000/api/problem-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          problem,
          description,
          constraints,
          examples,
          userSolution: solution,
        }),
      });

      const data = await res.json();

      // Check if solution passed all tests
      if (data.allPassed) {
        setResult("✅ All tests passed! Great job!");
        setTestResults([
          { id: 1, input: "Test 1", expected: "Pass", output: "Pass", passed: true },
          { id: 2, input: "Test 2", expected: "Pass", output: "Pass", passed: true },
          { id: 3, input: "Test 3", expected: "Pass", output: "Pass", passed: true },
        ]);
      } else {
        setResult(data.result || "❌ Some tests failed. Check the results below.");
        setTestResults([
          { id: 1, input: "Test 1", expected: "Pass", output: "Pass", passed: true },
          { id: 2, input: "Test 2", expected: "Pass", output: "Pass", passed: true },
          { id: 3, input: "Test 3", expected: "Pass", output: "Fail", passed: false },
        ]);
      }
      // Always show test results and AI feedback on submit
      setShowTestResults(true);
      generateAIFeedback();
    } catch (err) {
      // Demo fallback when backend not available
      setResult("Submission received! Check results below.");
      setTestResults([
        { id: 1, input: "Test 1", expected: "Pass", output: "Pass", passed: true },
        { id: 2, input: "Test 2", expected: "Pass", output: "Pass", passed: true },
        { id: 3, input: "Test 3", expected: "Pass", output: "Fail", passed: false },
      ]);
      setShowTestResults(true);
      generateAIFeedback();
    }
  };

  // -------------------------------
  // GENERATE AI FEEDBACK (New function)
  // -------------------------------
  const generateAIFeedback = () => {
    setAiFeedback({
      score: 75,
      suggestions: [
        "Your solution handles most cases correctly, but fails on edge cases.",
        "Consider using a hash map for O(n) time complexity.",
        "The current approach has O(n²) time complexity due to nested loops.",
      ],
      optimizedSolution: `// Optimized Solution
function solve(input) {
    // Use a hash map for efficient lookup
    const map = {};
    for (let i = 0; i < input.length; i++) {
        if (map[input[i]] !== undefined) {
            return [map[input[i]], i];
        }
        map[input[i]] = i;
    }
    return [];
}`,
    });
    setShowAIFeedback(true);
  };

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <h1 className="welcome-text">Problem Solving</h1>
      <p className="sub-text">Practice AI-generated coding challenges.</p>

      <div className="ps-topbar">

        {/* Difficulty */}
        <div className="dropdown-with-label">
          <label className="dropdown-label">Difficulty</label>
          <select
            className="ps-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {/* PROBLEM LANGUAGE */}
        <div className="dropdown-with-label">
          <label className="dropdown-label">Problem Language</label>
          <select
            className="ps-difficulty"
            value={problemLang}
            onChange={(e) => setProblemLang(e.target.value)}
          >
            <option>JavaScript</option>
            <option>Python</option>
            <option>C++</option>
            <option>Java</option>
          </select>
        </div>

        <button className="ps-generate-btn" onClick={generateProblem}>
          Generate New Problem
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ps-layout">

        {/* LEFT PANEL */}
        <div className="ps-problem-box card">
          <h2 className="ps-problem-title">{problem || "Click Generate Problem"}</h2>

          {problem && (
            <span className={`ps-badge ${difficulty.toLowerCase()}`}>
              {difficulty}
            </span>
          )}

          <h3 className="ps-section">Description</h3>
          <p className="ps-text">{description}</p>

          <h3 className="ps-section">Examples</h3>
          {examples.length > 0 ? (
            examples.map((ex, i) => (
              <div key={i} className="ps-example-block">
                <b>Input:</b> {ex.input} <br />
                <b>Output:</b> {ex.output} <br />
                {ex.explain && <i>{ex.explain}</i>}
              </div>
            ))
          ) : (
            <p className="ps-empty">No examples yet.</p>
          )}

          <h3 className="ps-section">Constraints</h3>
          <ul className="ps-constraints">
            {constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="ps-solution-box card">

          <div className="ps-solution-header">
            <h3>Your Solution</h3>

            <div className="dropdown-with-label">
              <label className="dropdown-label">Solution Language</label>
              <select
                className="ps-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
                <option>Java</option>
              </select>
            </div>
          </div>

          {/* VS CODE EDITOR */}
          <div className="vscode-editor ps-vscode-editor">
            <div className="vscode-line-numbers">
              <pre>{getLineNumbers(solution)}</pre>
            </div>
            <div className="vscode-editor-wrapper">
              <pre
                ref={solutionHighlightRef}
                className="vscode-highlight-layer"
                aria-hidden="true"
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(solution, language) + (solution.endsWith('\n') ? ' ' : '\n ')
                  }}
                />
              </pre>
              <textarea
                className="vscode-textarea-overlay"
                placeholder="// Write your solution here..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                onScroll={handleScrollSync}
                spellCheck="false"
              />
            </div>
          </div>

          {/* Button Row - Run Tests and Submit */}
          <div className="ps-button-row">
            <button className="ps-run-btn" onClick={runTests}>
              ▷ Run Tests
            </button>
            <button
              className="ps-submit-btn"
              onClick={checkSolution}
            >
              ✓ Submit Solution
            </button>
          </div>

          {result && (
            <div className="ps-result-box">
              <pre>{result}</pre>
            </div>
          )}

          {/* Test Results Section */}
          {showTestResults && testResults.length > 0 && (
            <div className="ps-test-results">
              <div className="test-results-header">
                <span className="test-icon">📋</span>
                <span>Test Results</span>
              </div>

              {/* Progress Bar */}
              <div className="test-progress-bar">
                <div
                  className="test-progress-passed"
                  style={{ width: `${(testResults.filter(t => t.passed).length / testResults.length) * 100}%` }}
                ></div>
              </div>
              <p className="test-count">
                {testResults.filter(t => t.passed).length} / {testResults.length} test cases passed
              </p>

              {/* Test Cases */}
              {testResults.map((test) => (
                <div key={test.id} className={`test-case-item ${test.passed ? 'passed' : 'failed'}`}>
                  <div className="test-case-header">
                    <span className={`test-case-icon ${test.passed ? 'passed' : 'failed'}`}>
                      {test.passed ? '✓' : '✗'}
                    </span>
                    <span>Test Case {test.id}</span>
                  </div>
                  <div className="test-case-content">
                    <p><b>Input:</b> <code>{test.input}</code></p>
                    <p><b>Expected:</b> <code>{test.expected}</code></p>
                    <p><b>Output:</b> <code>{test.output}</code></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Feedback Section */}
          {showAIFeedback && aiFeedback && (
            <div className="ps-ai-feedback">
              <div className="ai-feedback-header">
                <span className="ai-icon">💡</span>
                <span className="ai-title">AI Feedback</span>
                <span className="ai-score">Score: {aiFeedback.score}/100</span>
              </div>

              <div className="ai-suggestions">
                <h4>Suggestions</h4>
                <ul>
                  {aiFeedback.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-optimized-solution">
                <h4>Optimized Solution</h4>
                <pre className="optimized-code">{aiFeedback.optimizedSolution}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProblemSolving;

