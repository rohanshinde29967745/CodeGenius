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
import { copyWithToast, checkLanguageMismatch } from "../utils/codeUtils";

function CodeConverter() {
  const [inputLang, setInputLang] = useState("Python");
  const [outputLang, setOutputLang] = useState("JavaScript");
  const [inputCode, setInputCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageMismatch, setLanguageMismatch] = useState(null);

  // Panel states for maximize
  const [isInputMaximized, setIsInputMaximized] = useState(false);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);

  const inputHighlightRef = useRef(null);
  const outputHighlightRef = useRef(null);

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

  // Check for language mismatch when code changes
  useEffect(() => {
    if (inputCode.trim().length > 30) {
      const mismatchResult = checkLanguageMismatch(inputCode, inputLang);
      setLanguageMismatch(mismatchResult.mismatch ? mismatchResult : null);
    } else {
      setLanguageMismatch(null);
    }
  }, [inputCode, inputLang]);

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

  // Copy to clipboard with toast
  const handleCopy = (text) => {
    copyWithToast(text);
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

  // Clear all
  const handleClear = () => {
    setInputCode("");
    setConvertedCode("");
    setLanguageMismatch(null);
  };

  // Toggle maximize
  const toggleInputMaximize = () => {
    setIsInputMaximized(!isInputMaximized);
    setIsOutputMaximized(false);
  };

  const toggleOutputMaximize = () => {
    setIsOutputMaximized(!isOutputMaximized);
    setIsInputMaximized(false);
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
    <div className="cc-page problem-solving-page">
      {/* HEADER */}
      <div className="ps-header">
        <div className="ps-header-left">
          <h1 className="ps-page-title">Code Converter</h1>
          <p className="ps-page-subtitle">Convert code between programming languages using AI</p>
        </div>
        <div className="ps-header-right">
          <div className="cc-lang-selectors">
            <div className="cc-lang-group">
              <label>From</label>
              <select value={inputLang} onChange={(e) => setInputLang(e.target.value)} className="cc-lang-select">
                <option>Python</option>
                <option>JavaScript</option>
                <option>C++</option>
                <option>Java</option>
              </select>
            </div>
            <button className="cc-swap-btn" onClick={handleSwapLanguages} title="Swap languages">
              ⇄
            </button>
            <div className="cc-lang-group">
              <label>To</label>
              <select value={outputLang} onChange={(e) => setOutputLang(e.target.value)} className="cc-lang-select">
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
                <option>Java</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ps-main-layout">
        <div className="ps-panels-row">

          {/* LEFT PANEL - Input Code */}
          <div className={`ps-editor-panel ${isInputMaximized ? 'maximized' : ''} ${isOutputMaximized ? 'hidden' : ''}`}>
            {/* Toolbar */}
            <div className="ps-editor-toolbar">
              <div className="ps-toolbar-left">
                <span className="ps-code-icon">&lt;/&gt;</span>
                <span className="ps-toolbar-title">Input Code</span>
                <span className="cc-lang-badge">
                  {langIcons[inputLang]} {inputLang}
                </span>
              </div>
              <div className="ps-toolbar-right">
                <button className="ps-toolbar-btn" onClick={() => handleCopy(inputCode)} title="Copy">
                  <span>📋</span> Copy
                </button>
                <button
                  className="ps-toolbar-btn maximize"
                  onClick={toggleInputMaximize}
                  title={isInputMaximized ? "Minimize" : "Maximize"}
                >
                  {isInputMaximized ? (
                    <><span>⊖</span> Min</>
                  ) : (
                    <><span>⊕</span> Max</>
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
                <button onClick={() => setInputLang(languageMismatch.detected)}>
                  Switch to {languageMismatch.detected}
                </button>
              </div>
            )}

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
                      __html: highlightCode(inputCode, inputLang) + (inputCode.endsWith('\n') ? ' ' : '\n ')
                    }}
                  />
                </pre>
                <textarea
                  className="ps-code-textarea"
                  placeholder="// Paste your code here to convert..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onScroll={handleInputScroll}
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Footer with Clear and Convert Buttons */}
            <div className="cc-convert-footer">
              <button className="cc-clear-btn" onClick={handleClear} disabled={!inputCode && !convertedCode}>
                <span>🗑️</span> Clear
              </button>
              <button className="cc-convert-btn" onClick={handleConvert} disabled={loading || !inputCode.trim()}>
                <span className="btn-icon">🔄</span>
                {loading ? "Converting..." : "Convert Code"}
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Converted Code */}
          <div className={`ps-description-panel ${isOutputMaximized ? 'maximized' : ''} ${isInputMaximized ? 'hidden' : ''}`}>
            {/* Header */}
            <div className="ps-panel-header">
              <div className="ps-tabs">
                <button className="ps-tab active">
                  <span className="tab-icon">✨</span>
                  Converted Code
                </button>
              </div>
              <div className="cc-output-actions">
                <span className="cc-lang-badge output">
                  {langIcons[outputLang]}
                </span>
                <button className="ps-toolbar-btn" onClick={() => handleCopy(convertedCode)} disabled={!convertedCode} title="Copy">
                  <span>📋</span>
                </button>
                <button className="ps-toolbar-btn" onClick={handleDownload} disabled={!convertedCode} title="Download">
                  <span>⬇️</span>
                </button>
                <button
                  className="ps-toolbar-btn maximize"
                  onClick={toggleOutputMaximize}
                  title={isOutputMaximized ? "Minimize" : "Maximize"}
                >
                  {isOutputMaximized ? (
                    <><span>⊖</span></>
                  ) : (
                    <><span>⊕</span></>
                  )}
                </button>
              </div>
            </div>

            {/* Output Content */}
            <div className="cc-output-content">
              {loading ? (
                <div className="cc-loading">
                  <span className="loading-icon">⏳</span>
                  <p>Converting your code...</p>
                </div>
              ) : convertedCode ? (
                <div className="ps-code-editor cc-output-editor">
                  <div className="ps-line-numbers">
                    <pre>{getLineNumbers(convertedCode)}</pre>
                  </div>
                  <div className="ps-editor-wrapper">
                    <pre
                      ref={outputHighlightRef}
                      className="ps-highlight-layer"
                    >
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightCode(convertedCode, outputLang)
                        }}
                      />
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="cc-empty-state">
                  <span className="empty-icon">🔄</span>
                  <p>Converted code will appear here</p>
                  <small>Enter your code and click "Convert Code"</small>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CodeConverter;
