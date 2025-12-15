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

function RenderField({ value }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <div className="empty-note">— Nothing to show —</div>;
    return (
      <ol style={{ paddingLeft: 18 }}>
        {value.map((item, i) => (
          <li key={i} style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
          </li>
        ))}
      </ol>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <strong>{k}:</strong>{" "}
            {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
          </div>
        ))}
      </div>
    );
  }

  if (!value || String(value).trim() === "")
    return <div className="empty-note">— Nothing to show —</div>;

  return (
    <div style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}>
      {String(value).split("\n").map((line, i) => (
        <div key={i} style={{ marginBottom: 6 }}>{line}</div>
      ))}
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

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const inputHighlightRef = useRef(null);

  const tabs = ["explanation", "errors", "complexity", "flowchart", "optimized"];

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
      <h1 className="welcome-text">Code Analyzer</h1>
      <p className="sub-text">
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

        {/* RIGHT CARD */}
        <div className="analyzer-card">
          <h3 className="card-title">Analysis Results</h3>
          <p className="card-sub">AI-powered insights about your code</p>

          <div className="tab-bar">
            {tabs.map((t) => (
              <button
                key={t}
                className={`tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
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
              <RenderField value={getTabContent()} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

