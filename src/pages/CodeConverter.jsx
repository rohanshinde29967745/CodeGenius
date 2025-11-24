import React, { useState } from "react";
import "../App.css";

function CodeConverter() {
  const [inputLang, setInputLang] = useState("Python");
  const [outputLang, setOutputLang] = useState("JavaScript");
  const [inputCode, setInputCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");

  const handleConvert = () => {
    if (!inputCode.trim()) {
      setConvertedCode("⚠️ Please paste your code first.");
      return;
    }

    // Fake conversion (later add backend or AI)
    setConvertedCode(
      `// Converted from ${inputLang} to ${outputLang}\n\nconsole.log("Example converted output");`
    );
  };

  return (
    <div className="dashboard-container">
      
      {/* PAGE TITLE */}
      <h1 className="welcome-text">Code Converter</h1>
      <p className="sub-text">Choose the source and target programming languages.</p>

      {/* LANGUAGE SELECTORS */}
      <div className="language-selector">
        <div className="lang-box">
          <label>From</label>
          <select
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
          >
            <option>Python</option>
            <option>JavaScript</option>
            <option>C++</option>
            <option>Java</option>
          </select>
        </div>

        <div className="lang-box">
          <label>To</label>
          <select
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

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="converter-layout">

        {/* LEFT SIDE — INPUT CODE */}
        <div className="code-input-section">
          <h3 className="section-title">Input Code  <span className="lang-tag">{inputLang}</span></h3>

          <textarea
            className="code-area"
            placeholder="Paste your code here..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          ></textarea>
        </div>

        {/* RIGHT SIDE — OUTPUT CODE */}
        <div className="analysis-results">
          <h3 className="section-title">Converted Code  <span className="lang-tag">{outputLang}</span></h3>

          <div className="analysis-box">
            {convertedCode ? (
              <pre>{convertedCode}</pre>
            ) : (
              <p className="placeholder-text">
                🔄 Converted code will appear here
              </p>
            )}
          </div>
        </div>

      </div>

      {/* CONVERT BUTTON */}
      <button className="analyze-btn convert-btn" onClick={handleConvert}>
        Convert Code
      </button>

    </div>
  );
}

export default CodeConverter;
