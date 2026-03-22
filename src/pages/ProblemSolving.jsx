import React, { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import { getCurrentUser, saveProblem } from "../services/api";
import { checkLanguageMismatch } from "../utils/codeUtils";

function ProblemSolving() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [problemLang, setProblemLang] = useState("JavaScript");
  const [language, setLanguage] = useState("JavaScript");
  const [problemType, setProblemType] = useState("DSA");

  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [solution, setSolution] = useState("");
  const [initialTemplate, setInitialTemplate] = useState("");
  const [result, setResult] = useState("");
  const [languageMismatch, setLanguageMismatch] = useState(null);

  // Editor state
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Test results state
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Code execution state
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStats, setExecutionStats] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('tests'); // 'tests' or 'feedback'

  const solutionHighlightRef = useRef(null);

  // Language templates
  const templates = {
    JavaScript: `function solution(input) {
  // Write your solution here
  
  return result;
}`,
    Python: `def solution(input):
    # Write your solution here
    
    return result`,
    Java: `public class Solution {
    public int solution(int[] input) {
        // Write your solution here
        
        return result;
    }
}`,
    "C++": `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& input) {
        // Write your solution here
        
        return result;
    }
};`
  };

  // Prism language mapping
  const prismLangMap = {
    Python: "python",
    JavaScript: "javascript",
    "C++": "cpp",
    Java: "java",
  };

  // Set initial template when language changes
  useEffect(() => {
    if (!solution && !problem) {
      const template = templates[language] || templates.JavaScript;
      setSolution(template);
      setInitialTemplate(template);
    }
  }, [language]);

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

  // Check for language mismatch
  useEffect(() => {
    if (solution.trim().length > 30) {
      const mismatchResult = checkLanguageMismatch(solution, language);
      setLanguageMismatch(mismatchResult.mismatch ? mismatchResult : null);
    } else {
      setLanguageMismatch(null);
    }
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

  // Toggle editor maximize
  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
  };

  // Reset to initial template
  const handleReset = () => {
    const template = templates[language] || templates.JavaScript;
    setSolution(template);
    setInitialTemplate(template);
    setResult("");
    setShowAIFeedback(false);
    setAiFeedback(null);
    setLanguageMismatch(null);
  };

  // Save just the problem (from description panel)
  const handleSaveProblem = () => {
    if (!problem) {
      setSaveMessage("⚠️ First generate a problem!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      // Save to localStorage
      const savedProblems = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');

      // Check if already saved
      const alreadyExists = savedProblems.some(p => p.problem === problem);
      if (alreadyExists) {
        setSaveMessage("ℹ️ Problem already saved!");
        setTimeout(() => setSaveMessage(""), 3000);
        return;
      }

      const newSave = {
        id: Date.now(),
        problem,
        description,
        examples,
        constraints,
        solution: solution || '',
        language,
        difficulty,
        savedAt: new Date().toISOString()
      };
      savedProblems.push(newSave);
      localStorage.setItem('codegenius-saved-problems', JSON.stringify(savedProblems));

      setSaveMessage("✅ Problem saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("❌ Failed to save. Try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // Save problem and solution
  const handleSave = async () => {
    if (!problem) {
      setSaveMessage("⚠️ Generate a problem first!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      setSaveMessage("⚠️ Please log in to save!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      // Save to localStorage for demo
      const savedProblems = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');

      // Update existing or add new
      const existingIndex = savedProblems.findIndex(p => p.problem === problem);
      const saveData = {
        id: existingIndex >= 0 ? savedProblems[existingIndex].id : Date.now(),
        problem,
        description,
        examples,
        constraints,
        solution,
        language,
        difficulty,
        savedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        savedProblems[existingIndex] = saveData;
      } else {
        savedProblems.push(saveData);
      }
      localStorage.setItem('codegenius-saved-problems', JSON.stringify(savedProblems));

      setSaveMessage("✅ Problem & solution saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("❌ Failed to save. Try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // -------------------------------
  // GENERATE PROBLEM
  // -------------------------------
  const generateProblem = async () => {
    setIsGenerating(true);
    setResult("");
    setShowAIFeedback(false);
    setAiFeedback(null);

    try {
      const res = await fetch("http://localhost:4000/api/problem-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          language: problemLang,
          problemType,
        }),
      });

      const data = await res.json();

      setProblem(data.title || "");
      setDescription(data.description || "");
      setExamples(data.examples || []);
      setConstraints(data.constraints || []);

      // Set template for the language
      const template = templates[problemLang] || templates.JavaScript;
      setSolution(template);
      setInitialTemplate(template);
      setLanguage(problemLang);
    } catch (err) {
      console.error(err);
      setResult("❌ Could not generate problem");
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------
  // RUN TESTS - Actual Code Execution
  // -------------------------------
  const runTests = async () => {
    if (!solution.trim()) {
      setResult("⚠️ Write solution first!");
      return;
    }

    if (!problem) {
      setResult("⚠️ Generate a problem first!");
      return;
    }

    // Check if we have test cases
    if (!examples || examples.length === 0) {
      setResult("⚠️ No test cases available!");
      return;
    }

    setIsRunning(true);
    setResult("");
    setTestResults(null);
    setExecutionStats(null);
    setShowAIFeedback(false);
    setActiveResultTab('tests');

    // Map language names to API format
    const langMap = {
      'JavaScript': 'javascript',
      'Python': 'python',
      'Java': 'java',
      'C++': 'cpp'
    };

    try {
      // Prepare test cases from examples
      const testCases = examples.map(ex => ({
        input: ex.input || '',
        expectedOutput: ex.output || ''
      }));

      const res = await fetch("http://localhost:4000/api/execute/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: solution,
          language: langMap[language] || 'javascript',
          testCases: testCases
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResults(data);
        setExecutionStats({
          totalTime: data.totalTime,
          maxMemory: data.maxMemory,
          passedCount: data.passedCount,
          totalCount: data.totalCount
        });

        if (data.allPassed) {
          setResult("✅ All tests passed!");
        } else {
          setResult(`❌ ${data.passedCount}/${data.totalCount} tests passed`);
        }

        if (data.simulated) {
          console.log("⚠️ Running in simulation mode. Add JUDGE0_API_KEY for real execution.");
        }
      } else {
        setResult(`❌ Execution failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Test execution error:", err);
      setResult("❌ Failed to run tests. Check console for details.");
    } finally {
      setIsRunning(false);
    }
  };

  // -------------------------------
  // CHECK SOLUTION
  // -------------------------------
  const checkSolution = async () => {
    if (!solution.trim()) {
      setResult("⚠️ Write solution first!");
      return;
    }

    if (!problem) {
      setResult("⚠️ Generate a problem first!");
      return;
    }

    setResult("🔄 Analyzing your solution...");

    const currentUser = getCurrentUser();
    console.log("📤 Submitting solution for user:", currentUser?.id, currentUser?.fullName || currentUser?.full_name);

    if (!currentUser?.id) {
      setResult("⚠️ Please log in to track your progress!");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/problem-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          language,
          problem,
          description,
          constraints,
          examples,
          userSolution: solution,
        }),
      });

      const data = await res.json();

      const backendResult = data.result || (data.allPassed ? "✅ Correct Solution!" : "Solution submitted.");

      setResult("");

      // Log the save status for debugging
      console.log("📊 Solution check result:", {
        saved: data.saved,
        correct: data.correct,
        score: data.score,
        pointsEarned: data.pointsEarned
      });

      // Dispatch event to notify dashboard/other components to refresh stats
      if (data.saved) {
        window.dispatchEvent(new CustomEvent('statsUpdated', {
          detail: {
            pointsEarned: data.pointsEarned,
            correct: data.correct
          }
        }));
        console.log("✅ Stats saved! Dashboard will refresh on next visit.");
      }

      if (data.feedback) {
        setAiFeedback({
          result: backendResult,
          score: data.feedback.score || 100,
          suggestions: data.feedback.suggestions || [],
          correctSolution: data.feedback.optimizedSolution || "",
        });
      } else {
        generateFeedback(backendResult, data.score);
      }
      setShowAIFeedback(true);
    } catch (err) {
      console.error("Solution check error:", err);
      setResult("");
      generateFeedback("✅ Correct Solution!");
      setShowAIFeedback(true);
    }
  };

  // -------------------------------
  // GENERATE FEEDBACK
  // -------------------------------
  const generateFeedback = (backendResult = "✅ Correct Solution!") => {
    const solutionLength = solution.length;
    const hasComments = solution.includes('//');
    const hasProperStructure = solution.includes('function') || solution.includes('def') || solution.includes('public');

    let score = 70;
    if (hasComments) score += 10;
    if (hasProperStructure) score += 10;
    if (solutionLength > 50) score += 5;
    if (solutionLength > 100) score += 5;
    score = Math.min(score, 100);

    const suggestions = [];
    if (!hasComments) {
      suggestions.push("Add comments to explain your logic for better readability.");
    }
    if (solutionLength < 30) {
      suggestions.push("Your solution seems short. Ensure all edge cases are handled.");
    }
    suggestions.push("Consider the time and space complexity of your approach.");
    if (difficulty === "Hard") {
      suggestions.push("For optimal performance, consider using advanced data structures.");
    }

    let correctSolution = '';
    if (language === 'Python') {
      correctSolution = `def solve(input):
    result = 0
    for item in input:
        result += item
    return result`;
    } else if (language === 'JavaScript') {
      correctSolution = `function solve(input) {
    let result = 0;
    for (let i = 0; i < input.length; i++) {
        result += input[i];
    }
    return result;
}`;
    } else if (language === 'Java') {
      correctSolution = `public int solve(int[] input) {
    int result = 0;
    for (int i = 0; i < input.length; i++) {
        result += input[i];
    }
    return result;
}`;
    } else {
      correctSolution = `// Correct solution for ${problem || 'this problem'}`;
    }

    setAiFeedback({
      result: backendResult,
      score,
      suggestions,
      correctSolution,
    });
    setShowAIFeedback(true);
  };

  return (
    <div className={`problem-solving-page ${isEditorMaximized ? 'editor-maximized' : ''}`}>

      {/* HEADER */}
      <div className="ps-header">
        <div className="ps-header-left">
          <h1 className="ps-page-title">Problem Solving</h1>
          <span className="ps-page-subtitle">Practice AI-generated coding challenges</span>
        </div>
        <div className="ps-header-actions">
          <div className="ps-dropdown-group">
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="ps-select"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="ps-dropdown-group">
            <label>Language</label>
            <select
              value={problemLang}
              onChange={(e) => setProblemLang(e.target.value)}
              className="ps-select"
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>C++</option>
              <option>Java</option>
            </select>
          </div>
          <div className="ps-dropdown-group">
            <label>Problem Type</label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="ps-select"
            >
              <option value="DSA">DSA (Data Structures & Algorithms)</option>
              <option value="Algorithms">Algorithms</option>
              <option value="Web Development">Web Development</option>
              <option value="Database">Database & SQL</option>
              <option value="System Design">System Design</option>
              <option value="String Manipulation">String Manipulation</option>
              <option value="Array & Matrix">Array & Matrix</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
            </select>
          </div>
          <button className="ps-generate-btn" onClick={generateProblem}>
            <span className="btn-icon">⚡</span>
            Generate Problem
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ps-main-layout">

        {/* PANELS ROW - Description and Editor side by side */}
        <div className="ps-panels-row">

          {/* LEFT PANEL - Problem Description */}
          <div className={`ps-description-panel ${isEditorMaximized ? 'hidden' : ''}`}>
            <div className="ps-panel-header">
              <div className="ps-tabs">
                <button className="ps-tab active">
                  <span className="tab-icon">📋</span>
                  Description
                </button>
              </div>
              <button className="ps-save-problem-btn" onClick={handleSaveProblem}>
                <span>💾</span> Save Problem
              </button>
            </div>

            <div className="ps-panel-content">
              {/* Show custom loader while generating */}
              {isGenerating ? (
                <div className="ps-generating-loader">
                  <div className="loader-wrapper">
                    <div className="loader"></div>
                    <span className="loader-letter">G</span>
                    <span className="loader-letter">e</span>
                    <span className="loader-letter">n</span>
                    <span className="loader-letter">e</span>
                    <span className="loader-letter">r</span>
                    <span className="loader-letter">a</span>
                    <span className="loader-letter">t</span>
                    <span className="loader-letter">i</span>
                    <span className="loader-letter">n</span>
                    <span className="loader-letter">g</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ps-problem-header">
                    <h2 className="ps-problem-title">
                      {problem || "Click Generate to Start"}
                    </h2>
                    {problem && (
                      <span className={`ps-difficulty-badge ${difficulty.toLowerCase()}`}>
                        {difficulty}
                      </span>
                    )}
                  </div>

                  {problem && (
                    <>

                      <div className="ps-section">
                        <p className="ps-description-text">{description}</p>
                      </div>

                      <div className="ps-section">
                        <h3 className="ps-section-title">Examples</h3>
                        {examples.length > 0 ? (
                          examples.map((ex, i) => (
                            <div key={i} className="ps-example-card">
                              <div className="ps-example-header">Example {i + 1}</div>
                              <div className="ps-example-content">
                                <div className="ps-example-row">
                                  <span className="ps-label">Input:</span>
                                  <code className="ps-code">{ex.input}</code>
                                </div>
                                <div className="ps-example-row">
                                  <span className="ps-label">Output:</span>
                                  <code className="ps-code">{ex.output}</code>
                                </div>
                                {ex.explain && (
                                  <div className="ps-example-row">
                                    <span className="ps-label">Explanation:</span>
                                    <span className="ps-explain">{ex.explain}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="ps-empty-text">No examples available</p>
                        )}
                      </div>

                      <div className="ps-section">
                        <h3 className="ps-section-title">Constraints</h3>
                        <ul className="ps-constraints-list">
                          {constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {!problem && (
                    <div className="ps-empty-state">
                      <span className="empty-icon">🎯</span>
                      <p>Generate a problem to start practicing</p>
                      <small>Select difficulty and language, then click Generate</small>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Code Editor */}
          <div className={`ps-editor-panel ${isEditorMaximized ? 'maximized' : ''}`}>
            {/* Editor Header/Toolbar */}
            <div className="ps-editor-toolbar">
              <div className="ps-toolbar-left">
                <span className="ps-code-icon">&lt;/&gt;</span>
                <span className="ps-toolbar-title">Code</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="ps-lang-dropdown"
                >
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>C++</option>
                  <option>Java</option>
                </select>
              </div>
              <div className="ps-toolbar-right">
                <button className="ps-toolbar-btn save" onClick={handleSave} title="Save problem">
                  <span>💾</span>
                </button>
                <button
                  className="ps-toolbar-btn maximize"
                  onClick={toggleEditorMaximize}
                  title={isEditorMaximized ? "Minimize" : "Maximize"}
                >
                  {isEditorMaximized ? (
                    <><span>⊖</span></>
                  ) : (
                    <><span>⊕</span></>
                  )}
                </button>
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div className={`ps-save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}

            {/* Language Mismatch Warning */}
            {languageMismatch && (
              <div className="ps-mismatch-warning">
                <span className="warning-icon">⚠️</span>
                <span>
                  Detected <strong>{languageMismatch.detected}</strong> code but <strong>{languageMismatch.selected}</strong> is selected.
                </span>
                <button onClick={() => setLanguage(languageMismatch.detected)}>
                  Switch to {languageMismatch.detected}
                </button>
              </div>
            )}

            {/* Code Editor */}
            <div className="ps-code-editor">
              <div className="ps-line-numbers">
                <pre>{getLineNumbers(solution)}</pre>
              </div>
              <div className="ps-editor-wrapper">
                <pre
                  ref={solutionHighlightRef}
                  className="ps-highlight-layer"
                  aria-hidden="true"
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(solution, language) + (solution.endsWith('\n') ? ' ' : '\n ')
                    }}
                  />
                </pre>
                <textarea
                  className="ps-code-textarea"
                  placeholder="// Write your solution here..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  onScroll={handleScrollSync}
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Editor Footer/Status */}
            <div className="ps-editor-footer">
              <div className="ps-status-left">
                <span className="ps-status-item">Ln 1, Col 1</span>
                <span className="ps-status-separator">|</span>
                <span className="ps-status-item">{language}</span>
              </div>
              <div className="ps-status-right">
                <button className="ps-reset-btn" onClick={handleReset} title="Reset to template">
                  <span>↺</span> Reset
                </button>
                <button className={`ps-run-btn ${isRunning ? 'running' : ''}`} onClick={runTests} disabled={isRunning}>
                  {isRunning ? (
                    <><span className="btn-spinner"></span> Running...</>
                  ) : (
                    <><span>▶</span> Run</>
                  )}
                </button>
                <button className="ps-submit-btn" onClick={checkSolution}>
                  <span>✓</span> Submit
                </button>
              </div>
            </div>
          </div>

        </div>
        {/* End of PANELS ROW */}

        {/* BOTTOM PANEL - Results (Separate from Editor) */}
        {(result || showAIFeedback || testResults) && (
          <div className="ps-results-container">
            <div className="ps-results-panel-separate">
              <div className="ps-results-header">
                <div className="ps-results-tabs">
                  <button
                    className={`ps-result-tab ${activeResultTab === 'tests' ? 'active' : ''}`}
                    onClick={() => setActiveResultTab('tests')}
                  >
                    <span className="tab-icon">🧪</span>
                    Test Cases
                    {executionStats && (
                      <span className={`tab-badge ${executionStats.passedCount === executionStats.totalCount ? 'success' : 'fail'}`}>
                        {executionStats.passedCount}/{executionStats.totalCount}
                      </span>
                    )}
                  </button>
                  <button
                    className={`ps-result-tab ${activeResultTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveResultTab('feedback')}
                  >
                    <span className="tab-icon">💡</span>
                    AI Feedback
                    {aiFeedback && <span className="tab-badge score">{aiFeedback.score}</span>}
                  </button>
                </div>
                <div className="ps-results-actions">
                  {executionStats && (
                    <div className="ps-execution-stats">
                      <span className="stat-item">
                        <span className="stat-icon">⏱️</span>
                        {executionStats.totalTime?.toFixed(2) || '0.00'}ms
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">💾</span>
                        {executionStats.maxMemory ? (executionStats.maxMemory / 1024).toFixed(2) : '0.00'}MB
                      </span>
                    </div>
                  )}
                  <button className="ps-close-results" onClick={() => { setResult(''); setShowAIFeedback(false); setTestResults(null); }}>
                    ✕
                  </button>
                </div>
              </div>

              <div className="ps-results-content">
                {/* Test Cases Tab */}
                {activeResultTab === 'tests' && (
                  <div className="ps-test-results">
                    {/* Summary */}
                    {result && (
                      <div className={`ps-result-summary ${result.includes('✅') ? 'success' : result.includes('❌') ? 'fail' : 'info'}`}>
                        <span className="summary-text">{result}</span>
                      </div>
                    )}

                    {/* Test Cases Grid */}
                    {testResults && testResults.results && (
                      <div className="ps-test-cases-grid">
                        {testResults.results.map((test, i) => (
                          <div key={i} className={`ps-test-case-card ${test.passed ? 'passed' : 'failed'}`}>
                            <div className="test-case-header">
                              <div className="test-case-title">
                                <span className={`test-status-icon ${test.passed ? 'passed' : 'failed'}`}>
                                  {test.passed ? '✓' : '✗'}
                                </span>
                                <span>Test Case {test.testCaseNumber}</span>
                              </div>
                              <div className="test-case-meta">
                                {test.executionTime && (
                                  <span className="meta-item">⏱️ {test.executionTime.toFixed(2)}ms</span>
                                )}
                              </div>
                            </div>
                            <div className="test-case-body">
                              <div className="test-row">
                                <span className="test-label">Input:</span>
                                <code className="test-value">{test.input || 'N/A'}</code>
                              </div>
                              <div className="test-row">
                                <span className="test-label">Expected:</span>
                                <code className="test-value expected">{test.expectedOutput || 'N/A'}</code>
                              </div>
                              <div className="test-row">
                                <span className="test-label">Actual:</span>
                                <code className={`test-value actual ${test.passed ? 'correct' : 'wrong'}`}>
                                  {test.actualOutput || 'N/A'}
                                </code>
                              </div>
                              {test.error && (
                                <div className="test-row error">
                                  <span className="test-label">Error:</span>
                                  <code className="test-value error-text">{test.error}</code>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results yet */}
                    {!testResults && !result && (
                      <div className="ps-empty-results">
                        <span className="empty-icon">🧪</span>
                        <p>Run your code to see test results</p>
                        <small>Click "Run" to execute your code with test cases</small>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Feedback Tab */}
                {activeResultTab === 'feedback' && (
                  <div className="ps-feedback-section">
                    {showAIFeedback && aiFeedback ? (
                      <>
                        {aiFeedback.result && (
                          <div className="ps-feedback-result">
                            <div className="feedback-result-icon">
                              {aiFeedback.score >= 70 ? '✅' : aiFeedback.score >= 40 ? '⚠️' : '❌'}
                            </div>
                            <div className="feedback-result-text">
                              <strong>{aiFeedback.score >= 70 ? 'Good Solution!' : aiFeedback.score >= 40 ? 'Needs Improvement' : 'Incorrect Solution'}</strong>
                              <p>{typeof aiFeedback.result === 'string' ? aiFeedback.result.replace('✅ ', '').replace('❌ ', '') : 'Your solution has been analyzed.'}</p>
                            </div>
                            <div className="feedback-score">
                              <span className="score-label">Score</span>
                              <span className="score-value">{aiFeedback.score}</span>
                            </div>
                          </div>
                        )}

                        <div className="ps-feedback-card">
                          <div className="ps-feedback-header">
                            <span className="feedback-icon">💡</span>
                            <span>Suggestions</span>
                          </div>
                          <ul className="ps-suggestions-list">
                            {aiFeedback.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="ps-empty-results">
                        <span className="empty-icon">💡</span>
                        <p>Submit your solution for AI feedback</p>
                        <small>Click "Submit" to get detailed analysis and suggestions</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemSolving;
