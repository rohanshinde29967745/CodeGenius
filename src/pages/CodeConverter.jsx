import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import { getCurrentUser } from "../services/api";

function CodeConverter() {
  const [inputLang, setInputLang] = useState("Python");
  const [outputLang, setOutputLang] = useState("JavaScript");
  const [inputCode, setInputCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const inputHighlightRef = useRef(null);

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
  const highlightCode = (code, language) => {
    if (!code) return "";
    const prismLang = prismLangMap[language] || "javascript";
    try {
      return Prism.highlight(code, Prism.languages[prismLang], prismLang);
    } catch (e) {
      return code;
    }
  };

  // Re-highlight when code changes
  useEffect(() => {
    Prism.highlightAll();
  }, [convertedCode, outputLang, inputCode, inputLang]);

  // Generate line numbers
  const getLineNumbers = (code) => {
    if (!code) return "1";
    const lines = code.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };

  // Swap languages
  const handleSwapLanguages = () => {
    const tempLang = inputLang;
    setInputLang(outputLang);
    setOutputLang(tempLang);
  };

  // Copy to clipboard
  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };

  // Download code
  const handleDownload = () => {
    if (convertedCode) {
      const extensions = {
        Python: ".py",
        JavaScript: ".js",
        "C++": ".cpp",
        Java: ".java",
      };
      const blob = new Blob([convertedCode], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_code${extensions[outputLang] || ".txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Sync scroll
  const handleInputScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (inputHighlightRef.current) {
      inputHighlightRef.current.scrollTop = scrollTop;
    }
  };

  // BACKEND CALL
  const handleConvert = async () => {
    if (!inputCode.trim()) {
      setConvertedCode("⚠️ Please paste your code first.");
      return;
    }

    setLoading(true);
    setConvertedCode("🔄 Converting using Gemini Flash 2.5...");

    const currentUser = getCurrentUser();

    try {
      const response = await fetch("http://localhost:4000/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputLang,
          outputLang,
          inputCode,
          userId: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.convertedCode) {
        setConvertedCode(data.convertedCode);
      } else {
        setConvertedCode("❌ Error: No output received from backend.");
      }
    } catch (error) {
      setConvertedCode("❌ Backend Error: Unable to connect to server.");
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="dashboard-container converter-page">
      {/* PAGE TITLE */}
      <h1 className="welcome-text">Code Converter</h1>
      <p className="sub-text">Convert code between programming languages using AI.</p>

      {/* LANGUAGE SELECTORS ROW */}
      <div className="converter-lang-row" style={{ marginTop: '24px' }}>
        <div className="converter-lang-group">
          <label className="dropdown-label">Source Language</label>
          <div className="converter-select-wrapper">
            <span className="converter-lang-icon">{langIcons[inputLang]}</span>
            <select
              className="converter-select"
              value={inputLang}
              onChange={(e) => setInputLang(e.target.value)}
            >
              <option>Python</option>
              <option>JavaScript</option>
              <option>C++</option>
              <option>Java</option>
            </select>
          </div>
        </div>

        <button className="converter-swap-btn" onClick={handleSwapLanguages}>
          ⇄
        </button>

        <div className="converter-lang-group">
          <label className="dropdown-label">Target Language</label>
          <div className="converter-select-wrapper">
            <span className="converter-lang-icon">{langIcons[outputLang]}</span>
            <select
              className="converter-select"
              value={outputLang}
              onChange={(e) => setOutputLang(e.target.value)}
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>C++</option>
              <option>Java</option>
            </select>
          </div>
        </div>
      </div>

      {/* TWO PANEL LAYOUT */}
      <div className="converter-panels">
        {/* LEFT PANEL: INPUT */}
        <div className="converter-panel vscode-panel">
          <div className="converter-panel-header vscode-header">
            <div className="converter-panel-title">
              <span className="converter-code-icon">&lt;&gt;</span>
              <span>Input Code</span>
              <span className="converter-lang-badge input-badge">
                {langIcons[inputLang]} {inputLang}
              </span>
            </div>
            <button className="converter-action-btn" title="Copy" onClick={() => handleCopy(inputCode)}>
              <span className="btn-icon">📋</span>
              <span className="btn-text">Copy</span>
            </button>
          </div>
          <div className="vscode-editor">
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
                    __html: highlightCode(inputCode, inputLang) + (inputCode.endsWith('\n') ? ' ' : '\n ')
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
        </div>

        {/* RIGHT PANEL: OUTPUT */}
        <div className="converter-panel vscode-panel">
          <div className="converter-panel-header vscode-header">
            <div className="converter-panel-title">
              <span className="converter-code-icon">&lt;&gt;</span>
              <span>Converted Code</span>
              <span className="converter-lang-badge output-badge">
                {langIcons[outputLang]} {outputLang}
              </span>
            </div>
            <div className="converter-action-btns">
              <button className="converter-action-btn" title="Copy" onClick={() => handleCopy(convertedCode)}>
                <span className="btn-icon">📋</span>
                <span className="btn-text">Copy</span>
              </button>
              <button className="converter-action-btn" title="Download" onClick={handleDownload}>
                <span className="btn-icon">⬇️</span>
                <span className="btn-text">Download</span>
              </button>
            </div>
          </div>
          <div className="vscode-editor output-editor">
            {convertedCode ? (
              <>
                <div className="vscode-line-numbers">
                  <pre>{getLineNumbers(convertedCode)}</pre>
                </div>
                <div className="vscode-editor-wrapper">
                  <pre className="vscode-highlight-layer">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(convertedCode, outputLang)
                      }}
                    />
                  </pre>
                </div>
              </>
            ) : (
              <div className="converter-placeholder">
                <span className="placeholder-icon">🔄</span>
                <p>Converted code will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONVERT BUTTON */}
      <div className="converter-btn-wrapper">
        <button
          className="converter-main-btn"
          onClick={handleConvert}
          disabled={loading}
        >
          <span>🔄</span>
          {loading ? "Converting..." : "Convert Code"}
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default CodeConverter;

