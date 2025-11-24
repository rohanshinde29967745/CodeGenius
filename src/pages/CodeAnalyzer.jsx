import React, { useState } from "react";
import "../App.css";

function CodeAnalyzer() {
  const [inputCode, setInputCode] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");

  const handleAnalyze = () => {
    if (!inputCode.trim()) {
      setAnalysisResult("⚠️ Please paste your code first.");
      return;
    }

    // Mock AI result
    setAnalysisResult(
      "🔍 Analysis Summary:\n\n• Code analyzed successfully.\n• No major issues found.\n• Complexity: O(n log n).\n• Consider optimizing recursive calls."
    );
  };

  return (
    <div className="dashboard-container">

      {/* Page Title */}
      <h1 className="welcome-text">Code Analyzer</h1>
      <p className="sub-text">
        Upload your code and get AI-powered insights, explanations, and optimizations.
      </p>

      {/* LAYOUT WRAPPER */}
      <div className="analyzer-layout">

        {/* -------- LEFT SIDE: INPUT CODE -------- */}
        <div className="code-input-section">

          <h3>Input Code</h3>

          {/* Upload Buttons */}
          <div className="upload-buttons">
            <button className="upload-btn">📁 Upload File</button>
            <button className="upload-btn">📸 Take Photo</button>
          </div>

          {/* Textarea */}
          <textarea
            className="code-area"
            placeholder="Paste your code here..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          ></textarea>

          {/* Analyze Button */}
          <button className="analyze-btn" onClick={handleAnalyze}>
            Analyze Code
          </button>
        </div>

        {/* -------- RIGHT SIDE: RESULT -------- */}
        <div className="analysis-results">
          <h3>Analysis Results</h3>

          <div className="analysis-box">
            {analysisResult ? (
              <pre>{analysisResult}</pre>
            ) : (
              <p className="placeholder-text">
                🔄 Run analysis to see results here
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CodeAnalyzer;
