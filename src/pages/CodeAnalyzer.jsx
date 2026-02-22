import React, { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import { getCurrentUser } from "../services/api";
import { copyWithToast, checkLanguageMismatch, detectLanguage } from "../utils/codeUtils";

// Styled Explanation Component - Line by line explanation
function ExplanationRenderer({ value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <div className="empty-note">— Nothing to show —</div>;
  }

  // If it's an array of explanation items
  if (Array.isArray(value)) {
    return (
      <div className="explanation-container">
        {value.map((item, i) => (
          <div key={i} className="explanation-line-card">
            <span className="line-badge">Line {i + 1}</span>
            <div className="line-code-block">
              <code>{typeof item === "object" ? item.code || item.line || JSON.stringify(item) : String(item)}</code>
            </div>
            {item.explanation && (
              <p className="line-explanation">{item.explanation}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // If it's a string, parse it into lines
  const lines = String(value).split("\n").filter(l => l.trim());
  return (
    <div className="explanation-container">
      {lines.map((line, i) => (
        <div key={i} className="explanation-line-card">
          <span className="line-badge">Line {i + 1}</span>
          <p className="line-explanation">{line}</p>
        </div>
      ))}
    </div>
  );
}

// Styled Errors Component - With severity badges
function ErrorsRenderer({ value }) {
  if (!value || (Array.isArray(value) && value.length === 0) ||
    (typeof value === "string" && (value.includes("No errors") || value.includes("no errors")))) {
    return (
      <div className="no-errors-container">
        <span className="no-errors-icon">✅</span>
        <p>No errors or issues detected in your code!</p>
      </div>
    );
  }

  // If it's an array of error objects
  if (Array.isArray(value)) {
    return (
      <div className="errors-container">
        {value.map((error, i) => (
          <div key={i} className="error-card">
            <div className="error-header">
              <span className="error-icon">⚠️</span>
              <span className="error-line-badge">Line {error.line || i + 1}</span>
              <span className={`severity-badge ${error.severity || "medium"}`}>
                {error.severity || "medium"}
              </span>
            </div>
            <h4 className="error-title">{error.title || error.type || "Potential Issue"}</h4>
            <p className="error-description">{error.description || error.message || String(error)}</p>
            {error.fix && (
              <div className="error-fix-box">
                <code>✓ {error.fix}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // If it's a string, display as single error
  return (
    <div className="errors-container">
      <div className="error-card">
        <div className="error-header">
          <span className="error-icon">⚠️</span>
          <span className="severity-badge medium">info</span>
        </div>
        <p className="error-description">{String(value)}</p>
      </div>
    </div>
  );
}

// Styled Complexity Component - Time and Space cards
function ComplexityRenderer({ value }) {
  if (!value) {
    return <div className="empty-note">— Nothing to show —</div>;
  }

  // Parse complexity data
  let timeComplexity = "N/A";
  let spaceComplexity = "N/A";
  let explanation = "";

  if (typeof value === "object") {
    timeComplexity = value.time || value.timeComplexity || value.Time || "N/A";
    spaceComplexity = value.space || value.spaceComplexity || value.Space || "N/A";
    explanation = value.explanation || value.description || "";
  } else if (typeof value === "string") {
    // Try to parse from string
    const timeMatch = value.match(/time[:\s]*O\([^)]+\)/i);
    const spaceMatch = value.match(/space[:\s]*O\([^)]+\)/i);
    if (timeMatch) timeComplexity = timeMatch[0].replace(/time[:\s]*/i, "");
    if (spaceMatch) spaceComplexity = spaceMatch[0].replace(/space[:\s]*/i, "");
    explanation = value;
  }

  return (
    <div className="complexity-container">
      <div className="complexity-card time">
        <div className="complexity-icon">
          <span>⏱️</span>
        </div>
        <div className="complexity-content">
          <h4>Time Complexity</h4>
          <span className="complexity-value">{timeComplexity}</span>
        </div>
      </div>

      <div className="complexity-card space">
        <div className="complexity-icon">
          <span>📊</span>
        </div>
        <div className="complexity-content">
          <h4>Space Complexity</h4>
          <span className="complexity-value">{spaceComplexity}</span>
        </div>
      </div>

      {explanation && (
        <div className="complexity-explanation">
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

// Styled Flowchart Component - Renders Mermaid diagrams
function FlowchartRenderer({ value }) {
  const containerRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        // Dynamic import of mermaid
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.body.classList.contains('dark-theme') ? 'dark' : 'default',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          securityLevel: 'loose'
        });

        // Clean up the Mermaid code
        let mermaidCode = typeof value === "string" ? value : String(value);

        // Remove markdown code blocks if present
        mermaidCode = mermaidCode.replace(/```mermaid\n?/gi, '').replace(/```\n?/g, '');

        // Remove trailing semicolons from lines (Mermaid doesn't need them)
        mermaidCode = mermaidCode.split('\n').map(line => line.replace(/;+\s*$/, '')).join('\n');

        // Fix common issues with quotes in node labels
        mermaidCode = mermaidCode.replace(/\[([^\]]*)"([^\]"]*)"\s*([^\]]*)\]/g, '[$1$2$3]');

        // Ensure proper arrow syntax (remove extra spaces)
        mermaidCode = mermaidCode.replace(/--\s*>\s*/g, '-->');

        // Escape special characters in labels
        mermaidCode = mermaidCode.replace(/\[([^\]]*)\]/g, (match, content) => {
          // Remove problematic characters from labels
          const cleaned = content.replace(/[";]/g, '').trim();
          return `[${cleaned}]`;
        });

        // Ensure it starts with a valid graph declaration
        if (!mermaidCode.trim().startsWith('graph') && !mermaidCode.trim().startsWith('flowchart')) {
          mermaidCode = 'graph TD\n' + mermaidCode;
        }

        console.log("Cleaned Mermaid code:", mermaidCode);

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Render the diagram
        const { svg } = await mermaid.render('flowchart-' + Date.now(), mermaidCode);
        containerRef.current.innerHTML = svg;
        setRendered(true);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Could not render flowchart diagram');
        // Fallback to showing formatted code
        if (containerRef.current) {
          let displayCode = typeof value === "string" ? value : JSON.stringify(value, null, 2);
          // Format for display
          displayCode = displayCode.replace(/```mermaid\n?/gi, '').replace(/```\n?/g, '');
          containerRef.current.innerHTML = `<pre class="flowchart-fallback">${displayCode}</pre>`;
        }
      }
    };

    renderDiagram();
  }, [value]);

  if (!value) {
    return <div className="empty-note">— Nothing to show —</div>;
  }

  return (
    <div className="flowchart-container">
      {error && <div className="flowchart-error">{error}</div>}
      <div
        ref={containerRef}
        className="flowchart-content mermaid-diagram"
      >
        <div className="loading-message">Loading flowchart...</div>
      </div>
    </div>
  );
}

// Styled Optimized Code Component
function OptimizedRenderer({ value }) {
  if (!value) {
    return <div className="empty-note">— Nothing to show —</div>;
  }

  let code = "";
  let improvements = [];

  if (typeof value === "object") {
    code = value.code || value.optimizedCode || JSON.stringify(value, null, 2);
    improvements = value.improvements || value.changes || [];
  } else {
    code = String(value);
  }

  return (
    <div className="optimized-container">
      <div className="optimized-header">
        <span className="optimized-icon">💡</span>
        <h4>Optimized Code</h4>
      </div>

      <div className="optimized-code-block">
        <pre><code>{code}</code></pre>
      </div>

      {improvements.length > 0 && (
        <div className="improvements-banner">
          <span className="improvements-icon">✅</span>
          <div className="improvements-content">
            <strong>Improvements Applied:</strong>
            <p>{improvements.join(", ")}</p>
          </div>
        </div>
      )}

      {typeof value === "string" && value.toLowerCase().includes("better") && (
        <div className="improvements-banner">
          <span className="improvements-icon">✅</span>
          <div className="improvements-content">
            <strong>Improvements Applied:</strong>
            <p>Better variable names, overflow prevention, added documentation</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodeAnalyzer() {
  const [inputCode, setInputCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explanation");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const [languageMismatch, setLanguageMismatch] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const inputHighlightRef = useRef(null);

  // Tab configuration with icons matching reference design
  const tabConfig = [
    { key: "explanation", label: "Explain", icon: "💡" },
    { key: "errors", label: "Errors", icon: "⚠️" },
    { key: "complexity", label: "Complexity", icon: "⚡" },
    { key: "flowchart", label: "Flow", icon: "📊" },
    { key: "optimized", label: "Optimize", icon: "📈" },
  ];

  // Language icons mapping
  const langIcons = {
    Python: "🐍",
    JavaScript: "🟨",
    "C++": "⚡",
    Java: "☕",
  };

  // Prism language mapping
  const prismLangMap = {
    Python: "python",
    JavaScript: "javascript",
    "C++": "cpp",
    Java: "java",
  };

  // Auto-detect language from code
  const detectLanguage = (code) => {
    if (!code || code.trim().length < 10) return null;

    const codeText = code.toLowerCase();

    // Python patterns
    const pythonPatterns = [
      /\bdef\s+\w+\s*\(/,          // def function_name(
      /\bimport\s+\w+/,            // import module
      /\bfrom\s+\w+\s+import/,     // from x import
      /\bprint\s*\(/,              // print(
      /:\s*$/m,                    // colon at end of line
      /\bself\./,                  // self.
      /\belif\b/,                  // elif
      /\b__\w+__\b/,               // __name__, __init__
    ];

    // Java patterns
    const javaPatterns = [
      /\bpublic\s+(static\s+)?class\b/,   // public class
      /\bpublic\s+static\s+void\s+main\b/, // main method
      /\bSystem\.out\.print/,              // System.out.print
      /\bprivate\s+\w+\s+\w+\s*;/,         // private int x;
      /\bnew\s+\w+\s*\(/,                  // new Object(
      /\bextends\s+\w+/,                   // extends Class
      /\bimplements\s+\w+/,                // implements Interface
    ];

    // C++ patterns
    const cppPatterns = [
      /\#include\s*<\w+>/,              // #include <iostream>
      /\bstd::/,                        // std::
      /\bcout\s*<</,                    // cout <<
      /\bcin\s*>>/,                     // cin >>
      /\bint\s+main\s*\(/,              // int main(
      /\busing\s+namespace\s+std/,      // using namespace std
      /\bvector\s*</,                   // vector<
      /\b->\b/,                         // pointer arrow
    ];

    // JavaScript patterns
    const jsPatterns = [
      /\bconst\s+\w+\s*=/,           // const x =
      /\blet\s+\w+\s*=/,             // let x =
      /\bvar\s+\w+\s*=/,             // var x =
      /\bfunction\s+\w+\s*\(/,       // function name(
      /=>\s*{/,                      // arrow function
      /\bconsole\.(log|warn|error)\s*\(/, // console.log
      /\bdocument\./,                // document.
      /\bwindow\./,                  // window.
      /\basync\s+function/,          // async function
      /\bawait\s+/,                  // await
      /\brequire\s*\(/,              // require(
      /\bexport\s+(default\s+)?/,    // export
    ];

    // Count matches for each language
    let pythonScore = 0, javaScore = 0, cppScore = 0, jsScore = 0;

    pythonPatterns.forEach(p => { if (p.test(code)) pythonScore++; });
    javaPatterns.forEach(p => { if (p.test(code)) javaScore++; });
    cppPatterns.forEach(p => { if (p.test(code)) cppScore++; });
    jsPatterns.forEach(p => { if (p.test(code)) jsScore++; });

    // Find the highest score
    const scores = { Python: pythonScore, Java: javaScore, "C++": cppScore, JavaScript: jsScore };
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) return null;

    for (const [lang, score] of Object.entries(scores)) {
      if (score === maxScore) return lang;
    }

    return null;
  };

  // Check for language mismatch when code changes (show warning instead of auto-switch)
  useEffect(() => {
    if (inputCode.trim().length > 30) {
      const mismatchResult = checkLanguageMismatch(inputCode, language);
      setLanguageMismatch(mismatchResult.mismatch ? mismatchResult : null);
    } else {
      setLanguageMismatch(null);
    }
  }, [inputCode, language]);

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
  }, [inputCode, language]);

  // Generate line numbers
  const getLineNumbers = (code) => {
    if (!code) return "1";
    const lines = code.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };

  // Sync scroll
  const handleInputScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (inputHighlightRef.current) {
      inputHighlightRef.current.scrollTop = scrollTop;
    }
  };

  /* ================= FILE UPLOAD ================= */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setInputCode(reader.result);
    reader.readAsText(file);
  };

  /* ================= CAMERA UPLOAD ================= */
  const handlePhotoUpload = (e) => {
    alert("📸 Photo captured.\n(For demo: OCR integration can be added later)");
  };

  /* ================= ANALYZE ================= */
  const handleAnalyze = async () => {
    if (!inputCode.trim()) {
      alert("⚠️ Please paste or upload code first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisResult(null);

    const currentUser = getCurrentUser();

    try {
      const response = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputCode,
          userId: currentUser?.id,
          language
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze code. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Get current tab content
  const getTabContent = () => {
    if (!analysisResult) return null;

    switch (activeTab) {
      case "explanation":
        return analysisResult.explanation;
      case "errors":
        return analysisResult.errors;
      case "complexity":
        return analysisResult.complexity;
      case "flowchart":
        return analysisResult.flowchart;
      case "optimized":
        return analysisResult.optimized;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container code-analyzer-page">
      <h1 className="welcome-text page-title-left">Code Analyzer</h1>
      <p className="sub-text page-subtitle">
        Upload your code and get AI-powered insights, explanations, and optimizations.
      </p>

      <div className="analyzer-grid">

        {/* LEFT CARD */}
        <div className="analyzer-card">
          <div className="analyzer-card-header">
            <div className="analyzer-card-title">
              <span className="code-icon">&lt;/&gt;</span>
              <span>Code Input</span>
              <span className="analyzer-lang-badge">
                {langIcons[language]} {language}
              </span>
            </div>
            <div className="dropdown-with-label">
              <label className="dropdown-label">Language</label>
              <select
                className="analyzer-lang-select"
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

          {/* Language Mismatch Warning */}
          {languageMismatch && (
            <div className="language-mismatch-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                It looks like you're writing <span className="warning-highlight">{languageMismatch.detected}</span> code,
                but <span className="warning-highlight">{languageMismatch.selected}</span> is selected.
              </span>
              <button
                className="fix-btn"
                onClick={() => setLanguage(languageMismatch.detected)}
              >
                Switch to {languageMismatch.detected}
              </button>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="upload-buttons">
            <button
              className="action-btn"
              onClick={() => fileInputRef.current.click()}
            >
              ⬆ Upload File
            </button>

            <button
              className="action-btn"
              onClick={() => cameraInputRef.current.click()}
            >
              📷 Take Photo
            </button>

            <button
              className="action-btn clear-btn"
              onClick={() => {
                setInputCode("");
                setAnalysisResult(null);
                setError("");
                setLanguageMismatch(null);
              }}
              disabled={!inputCode}
            >
              🗑️ Clear
            </button>
          </div>

          {/* HIDDEN INPUTS */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".js,.py,.java,.cpp,.txt"
            onChange={handleFileUpload}
          />

          <input
            type="file"
            ref={cameraInputRef}
            style={{ display: "none" }}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
          />

          {/* VS CODE EDITOR */}
          <div className="vscode-editor analyzer-editor">
            <div className="vscode-line-numbers">
              <pre>{getLineNumbers(inputCode)}</pre>
            </div>
            <div className="vscode-editor-wrapper">
              <pre
                ref={inputHighlightRef}
                className="vscode-highlight-layer"
                aria-hidden="true"
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(inputCode, language) + (inputCode.endsWith('\n') ? ' ' : '\n ')
                  }}
                />
              </pre>
              <textarea
                className="vscode-textarea-overlay"
                placeholder="Paste your code here..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onScroll={handleInputScroll}
                spellCheck="false"
              />
            </div>
          </div>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "▶ Analyze Code"}
          </button>
        </div>

        {/* RIGHT CARD - ANALYSIS RESULTS */}
        <div className="analyzer-card analyzer-results-card">
          <div className="analysis-header">
            <span className="analysis-header-icon">✨</span>
            <h3>AI Analysis Results</h3>
          </div>

          <div className="analysis-tab-bar">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                className={`analysis-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="analysis-box">
            {loading && <div className="loading-message">⏳ Analyzing your code...</div>}
            {error && <div className="error-message">❌ {error}</div>}
            {!loading && !error && !analysisResult && (
              <div className="empty-note">Paste your code and click "Analyze Code" to see results</div>
            )}
            {!loading && !error && analysisResult && (
              <>
                {activeTab === "explanation" && <ExplanationRenderer value={analysisResult.explanation} />}
                {activeTab === "errors" && <ErrorsRenderer value={analysisResult.errors} />}
                {activeTab === "complexity" && <ComplexityRenderer value={analysisResult.complexity} />}
                {activeTab === "flowchart" && <FlowchartRenderer value={analysisResult.flowchart} />}
                {activeTab === "optimized" && <OptimizedRenderer value={analysisResult.optimized} />}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

