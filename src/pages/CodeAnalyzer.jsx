import React, { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import { getCurrentUser, API_SERVER } from "../services/api";
import { copyWithToast, checkLanguageMismatch, detectLanguage } from "../utils/codeUtils";

// Styled Explanation Component - Line by line explanation
function ExplanationRenderer({ value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <div className="ca-empty-note">— Nothing to show —</div>;
  }

  // If it's an array of explanation items
  if (Array.isArray(value)) {
    return (
      <div className="ca-explanation-container">
        {value.map((item, i) => (
          <div key={i} className="ca-explanation-line-card">
            <span className="ca-line-badge">Line {i + 1}</span>
            <div className="ca-line-code-block">
              <code>{typeof item === "object" ? item.code || item.line || JSON.stringify(item) : String(item)}</code>
            </div>
            {item.explanation && (
              <p className="ca-line-explanation">{item.explanation}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // If it's a string, parse it into lines
  const lines = String(value).split("\n").filter(l => l.trim());
  return (
    <div className="ca-explanation-container">
      {lines.map((line, i) => (
        <div key={i} className="ca-explanation-line-card">
          <span className="ca-line-badge">Line {i + 1}</span>
          <p className="ca-line-explanation">{line}</p>
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
      <div className="ca-no-errors-container">
        <span className="ca-no-errors-icon">✅</span>
        <p>No errors or issues detected in your code!</p>
      </div>
    );
  }

  // If it's an array of error objects
  if (Array.isArray(value)) {
    return (
      <div className="ca-errors-container">
        {value.map((error, i) => (
          <div key={i} className="ca-error-card">
            <div className="ca-error-header">
              <span className="ca-error-icon">⚠️</span>
              <span className="ca-error-line-badge">Line {error.line || i + 1}</span>
              <span className={`ca-severity-badge ${error.severity || "medium"}`}>
                {error.severity || "medium"}
              </span>
            </div>
            <h4 className="ca-error-title">{error.title || error.type || "Potential Issue"}</h4>
            <p className="ca-error-description">{error.description || error.message || String(error)}</p>
            {error.fix && (
              <div className="ca-error-fix-box">
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
    <div className="ca-errors-container">
      <div className="ca-error-card">
        <div className="ca-error-header">
          <span className="ca-error-icon">⚠️</span>
          <span className="ca-severity-badge medium">info</span>
        </div>
        <p className="ca-error-description">{String(value)}</p>
      </div>
    </div>
  );
}

// Styled Complexity Component - Time and Space cards
function ComplexityRenderer({ value }) {
  if (!value) {
    return <div className="ca-empty-note">— Nothing to show —</div>;
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
    <div className="ca-complexity-container">
      <div className="ca-complexity-card time">
        <div className="ca-complexity-icon">
          <span>⏱️</span>
        </div>
        <div className="ca-complexity-content">
          <h4>Time Complexity</h4>
          <span className="ca-complexity-value">{timeComplexity}</span>
        </div>
      </div>

      <div className="ca-complexity-card space">
        <div className="ca-complexity-icon">
          <span>📊</span>
        </div>
        <div className="ca-complexity-content">
          <h4>Space Complexity</h4>
          <span className="ca-complexity-value">{spaceComplexity}</span>
        </div>
      </div>

      {explanation && (
        <div className="ca-complexity-explanation">
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
          containerRef.current.innerHTML = `<pre class="ca-flowchart-fallback">${displayCode}</pre>`;
        }
      }
    };

    renderDiagram();
  }, [value]);

  if (!value) {
    return <div className="ca-empty-note">— Nothing to show —</div>;
  }

  return (
    <div className="ca-flowchart-container">
      {error && <div className="ca-flowchart-error">{error}</div>}
      <div
        ref={containerRef}
        className="ca-flowchart-content mermaid-diagram"
      >
        <div className="ca-loading-message">Loading flowchart...</div>
      </div>
    </div>
  );
}

// Styled Optimized Code Component
function OptimizedRenderer({ value }) {
  if (!value) {
    return <div className="ca-empty-note">— Nothing to show —</div>;
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
    <div className="ca-optimized-container">
      <div className="ca-optimized-header">
        <span className="ca-optimized-icon">💡</span>
        <h4>Optimized Code</h4>
      </div>

      <div className="ca-optimized-code-block">
        <pre><code>{code}</code></pre>
      </div>

      {improvements.length > 0 && (
        <div className="ca-improvements-banner">
          <span className="ca-improvements-icon">✅</span>
          <div className="ca-improvements-content">
            <strong>Improvements Applied:</strong>
            <p>{improvements.join(", ")}</p>
          </div>
        </div>
      )}

      {typeof value === "string" && value.toLowerCase().includes("better") && (
        <div className="ca-improvements-banner">
          <span className="ca-improvements-icon">✅</span>
          <div className="ca-improvements-content">
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

  // Panel states
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [isResultsMaximized, setIsResultsMaximized] = useState(false);

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
  const detectLang = (code) => {
    if (!code || code.trim().length < 10) return null;

    const codeText = code.toLowerCase();

    // Python patterns
    const pythonPatterns = [
      /\bdef\s+\w+\s*\(/,
      /\bimport\s+\w+/,
      /\bfrom\s+\w+\s+import/,
      /\bprint\s*\(/,
      /:\s*$/m,
      /\bself\./,
      /\belif\b/,
    ];

    // Java patterns
    const javaPatterns = [
      /\bpublic\s+(static\s+)?class\b/,
      /\bprivate\s+\w+\s+\w+/,
      /\bSystem\.out\.print/,
      /\bvoid\s+main\s*\(/,
      /\bimport\s+java\./,
    ];

    // C++ patterns
    const cppPatterns = [
      /\b#include\s*</,
      /\bstd::/,
      /\bcout\s*<</,
      /\bcin\s*>>/,
      /\busing\s+namespace\s+std/,
      /\bvector\s*</,
    ];

    // JavaScript patterns
    const jsPatterns = [
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bfunction\s+\w+\s*\(/,
      /=>\s*{/,
      /\bconsole\.log\s*\(/,
      /\bmodule\.exports/,
      /\brequire\s*\(/,
    ];

    let pythonScore = pythonPatterns.filter(p => p.test(code)).length;
    let javaScore = javaPatterns.filter(p => p.test(code)).length;
    let cppScore = cppPatterns.filter(p => p.test(code)).length;
    let jsScore = jsPatterns.filter(p => p.test(code)).length;

    const scores = { Python: pythonScore, Java: javaScore, "C++": cppScore, JavaScript: jsScore };
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore >= 2) {
      return Object.keys(scores).find(k => scores[k] === maxScore);
    }
    return null;
  };

  // Check for language mismatch when code changes
  useEffect(() => {
    if (inputCode.trim().length > 30) {
      const detected = detectLang(inputCode);
      if (detected && detected !== language) {
        setLanguageMismatch({ detected, selected: language });
      } else {
        setLanguageMismatch(null);
      }
    } else {
      setLanguageMismatch(null);
    }
  }, [inputCode, language]);

  // Highlight code using Prism
  const highlightCode = (code, lang) => {
    const prismLang = prismLangMap[lang] || "javascript";
    try {
      return Prism.highlight(code || "", Prism.languages[prismLang] || Prism.languages.javascript, prismLang);
    } catch (e) {
      return code || "";
    }
  };

  // Generate line numbers
  const getLineNumbers = (code) => {
    if (!code) return "1";
    const lines = code.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };

  // Sync scroll
  const handleInputScroll = (e) => {
    if (inputHighlightRef.current) {
      inputHighlightRef.current.scrollTop = e.target.scrollTop;
      inputHighlightRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInputCode(reader.result);
    };
    reader.readAsText(file);
  };

  // Camera upload
  const handlePhotoUpload = (e) => {
    // Placeholder for OCR functionality
    alert("Photo upload feature coming soon!");
  };

  // Analyze code
  const handleAnalyze = async () => {
    if (!inputCode.trim()) {
      setError("Please enter some code to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisResult(null);

    try {
      const response = await fetch(`${API_SERVER}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputCode, language, userId: getCurrentUser()?.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get current tab content
  const getTabContent = () => {
    if (loading) return <div className="ca-loading-message">⏳ Analyzing your code...</div>;
    if (error) return <div className="ca-error-message">❌ {error}</div>;
    if (!analysisResult) return <div className="ca-empty-note">Paste your code and click "Analyze Code" to see results</div>;

    switch (activeTab) {
      case "explanation": return <ExplanationRenderer value={analysisResult.explanation} />;
      case "errors": return <ErrorsRenderer value={analysisResult.errors} />;
      case "complexity": return <ComplexityRenderer value={analysisResult.complexity} />;
      case "flowchart": return <FlowchartRenderer value={analysisResult.flowchart} />;
      case "optimized": return <OptimizedRenderer value={analysisResult.optimized} />;
      default: return <div className="ca-empty-note">Select a tab to view results</div>;
    }
  };

  // Toggle maximize functions
  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
    setIsResultsMaximized(false);
  };

  const toggleResultsMaximize = () => {
    setIsResultsMaximized(!isResultsMaximized);
    setIsEditorMaximized(false);
  };

  // Clear code
  const handleClear = () => {
    setInputCode("");
    setAnalysisResult(null);
    setError("");
    setLanguageMismatch(null);
  };

  return (
    <div className="ca-page problem-solving-page">
      {/* HEADER */}
      <div className="ps-header">
        <div className="ps-header-left">
          <h1 className="ps-page-title">Code Analyzer</h1>
          <p className="ps-page-subtitle">Get AI-powered insights, explanations, and optimizations</p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ps-main-layout">
        <div className="ps-panels-row">

          {/* LEFT PANEL - Code Editor */}
          <div className={`ps-editor-panel ${isEditorMaximized ? 'maximized' : ''} ${isResultsMaximized ? 'hidden' : ''}`}>
            {/* Editor Toolbar */}
            <div className="ps-editor-toolbar">
              <div className="ps-toolbar-left">
                <span className="ps-code-icon">&lt;/&gt;</span>
                <span className="ps-toolbar-title">Code Input</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="ca-lang-select"
                >
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>C++</option>
                  <option>Java</option>
                </select>
              </div>
              <div className="ps-toolbar-right">
                <button className="ps-toolbar-btn upload" onClick={() => fileInputRef.current.click()} title="Upload file">
                  <span>📁</span> Upload
                </button>
                <button
                  className="ps-toolbar-btn maximize"
                  onClick={toggleEditorMaximize}
                  title={isEditorMaximized ? "Minimize" : "Maximize"}
                >
                  {isEditorMaximized ? (
                    <><span>⊖</span> Minimize</>
                  ) : (
                    <><span>⊕</span> Maximize</>
                  )}
                </button>
              </div>
            </div>

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

            {/* Hidden file inputs */}
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

            {/* Code Editor */}
            <div className="ps-code-editor">
              <div className="ps-line-numbers">
                <pre>{getLineNumbers(inputCode)}</pre>
              </div>
              <div className="ps-editor-wrapper">
                <pre
                  ref={inputHighlightRef}
                  className="ps-highlight-layer"
                  aria-hidden="true"
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(inputCode, language) + (inputCode.endsWith('\n') ? ' ' : '\n ')
                    }}
                  />
                </pre>
                <textarea
                  className="ps-code-textarea"
                  placeholder="// Paste your code here to analyze..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onScroll={handleInputScroll}
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Footer with Clear and Analyze Buttons */}
            <div className="ca-analyze-footer">
              <button className="ca-clear-btn" onClick={handleClear} disabled={!inputCode && !analysisResult}>
                <span>🗑️</span> Clear All
              </button>
              <button className="ca-analyze-btn" onClick={handleAnalyze} disabled={loading || !inputCode.trim()}>
                <span className="btn-icon">▶</span>
                {loading ? "Analyzing..." : "Analyze Code"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Analysis Results */}
          <div className={`ps-description-panel ${isResultsMaximized ? 'maximized' : ''} ${isEditorMaximized ? 'hidden' : ''}`}>
            <div className="ps-panel-header">
              <div className="ps-tabs">
                <button className="ps-tab active">
                  <span className="tab-icon">✨</span>
                  AI Analysis
                </button>
              </div>
              <button
                className="ps-toolbar-btn maximize"
                onClick={toggleResultsMaximize}
                title={isResultsMaximized ? "Minimize" : "Maximize"}
              >
                {isResultsMaximized ? (
                  <><span>⊖</span> Minimize</>
                ) : (
                  <><span>⊕</span> Maximize</>
                )}
              </button>
            </div>

            {/* Tab Bar */}
            <div className="ca-tab-bar">
              {tabConfig.map((tab) => (
                <button
                  key={tab.key}
                  className={`ca-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results Content */}
            <div className="ps-panel-content ca-results-content">
              {getTabContent()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
