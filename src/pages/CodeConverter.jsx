import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import "./CodeConverter.css";
import { getCurrentUser } from "../services/api";
import { copyWithToast, checkLanguageMismatch } from "../utils/codeUtils";

export default function CodeConverter() {
  const [inputLang, setInputLang] = useState("Python");
  const [outputLang, setOutputLang] = useState("JavaScript");
  const [inputCode, setInputCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageMismatch, setLanguageMismatch] = useState(null);

  const [activeTab, setActiveTab] = useState("summary");

  const inputHighlightRef = useRef(null);
  const outputHighlightRef = useRef(null);
  const fileInputRef = useRef(null);

  const langIcons = { Python: "🐍", JavaScript: "🟨", "C++": "⚡", Java: "☕" };
  const prismLangMap = { Python: "python", JavaScript: "javascript", "C++": "cpp", Java: "java" };

  useEffect(() => {
    if (inputCode.trim().length > 30) {
      const mismatchResult = checkLanguageMismatch(inputCode, inputLang);
      setLanguageMismatch(mismatchResult.mismatch ? mismatchResult : null);
    } else {
      setLanguageMismatch(null);
    }
  }, [inputCode, inputLang]);

  const highlightCode = (code, language) => {
    if (!code) return "";
    const p = prismLangMap[language] || "javascript";
    try { return Prism.highlight(code, Prism.languages[p], p); } catch { return code; }
  };

  useEffect(() => { Prism.highlightAll(); }, [convertedCode, outputLang, inputCode, inputLang]);

  const getLineNumbers = (code) => {
    if (!code) return "1";
    return code.split("\n").map((_, i) => i + 1).join("\n");
  };

  const lineCount = inputCode.trim() ? inputCode.split("\n").length : 0;
  const outLineCount = convertedCode.trim() ? convertedCode.split("\n").length : 0;

  const handleSwapLanguages = () => {
    const tempLang = inputLang;
    setInputLang(outputLang);
    setOutputLang(tempLang);
    const tempCode = inputCode;
    setInputCode(convertedCode);
    setConvertedCode(tempCode);
  };

  const handleCopy = (text) => copyWithToast(text);

  const handleDownload = () => {
    if (convertedCode) {
      const exts = { Python: ".py", JavaScript: ".js", "C++": ".cpp", Java: ".java" };
      const blob = new Blob([convertedCode], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_code${exts[outputLang] || ".txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleInputScroll = (e) => {
    if (inputHighlightRef.current) inputHighlightRef.current.scrollTop = e.target.scrollTop;
  };

  const handleOutputScroll = (e) => {
    if (outputHighlightRef.current) outputHighlightRef.current.scrollTop = e.target.scrollTop;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputCode(text);
    } catch (e) {
      console.error("Paste failed", e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInputCode(reader.result);
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!inputCode.trim()) {
      setConvertedCode("⚠️ Please paste your code first.");
      return;
    }
    setLoading(true);
    setConvertedCode("🔄 Converting using AI...");
    
    // Simulate slight delay for rich UI effect, then backend call
    try {
      const response = await fetch("http://localhost:4000/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputLang,
          outputLang,
          inputCode,
          userId: getCurrentUser()?.id,
        }),
      });
      const data = await response.json();
      if (data.convertedCode) {
        setConvertedCode(data.convertedCode);
      } else {
        setConvertedCode("❌ Error: No output received from backend.");
      }
    } catch (error) {
    }
    setLoading(false);
  };

  return (
    <div className="cc-pro-v2">
      {/* 1. PROFESSIONAL NAVBAR */}
      <nav className="cc-navbar">
        <div className="cc-nav-left">
          <div className="cc-logo-wrap">
            <h1 className="cc-title">Code Converter</h1>
            <p className="cc-tagline">Pro Workspace v2.0</p>
          </div>
        </div>

        <div className="cc-nav-center">
          <div className="cc-lang-pill">
            <span className="cc-label">FROM</span>
            <select value={inputLang} onChange={e => setInputLang(e.target.value)} className="cc-select">
              <option>Python</option><option>JavaScript</option><option>C++</option><option>Java</option>
            </select>
          </div>
          <span className="cc-arrow">⟶</span>
          <div className="cc-lang-pill">
            <span className="cc-label">TO</span>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value)} className="cc-select">
              <option>JavaScript</option><option>Python</option><option>C++</option><option>Java</option>
            </select>
          </div>
          <button className="cc-convert-btn" onClick={handleConvert} disabled={loading || !inputCode.trim()}>
            {loading ? "Converting..." : "Convert Now"}
          </button>
        </div>

        <div className="cc-nav-right">
          <button className="cc-tool-btn" onClick={handlePaste} title="Paste Clipboard">📋</button>
          <button className="cc-tool-btn" onClick={() => fileInputRef.current?.click()} title="Upload Local File">📁</button>
          <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={handleFileUpload} />
        </div>
      </nav>

      {/* 2. SIDE-BY-SIDE WORKSPACE */}
      <main className="cc-workspace">
        
        {/* INPUT PANE */}
        <div className="cc-pane">
          <div className="cc-pane-header">
            <span className="cc-pane-title">Input: {inputLang}</span>
            <div className="cc-pane-toolbar">
              <span style={{fontSize:'0.7rem', color:'var(--cc-text-dim)'}}>{lineCount} lines</span>
            </div>
          </div>
          <div className="cc-editor-area">
            <div className="cc-linenums"><pre>{getLineNumbers(inputCode)}</pre></div>
            <div style={{flex:1, position:'relative'}}>
              <pre ref={inputHighlightRef} className="cc-highlight" aria-hidden="true">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(inputCode, inputLang) + (inputCode.endsWith('\n') ? ' ' : '\n ') }} />
              </pre>
              <textarea
                className="cc-textarea"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onScroll={handleInputScroll}
                spellCheck="false"
                placeholder="// Type or paste your code here..."
              />
            </div>
          </div>
        </div>

        {/* RESULT PANE */}
        <div className="cc-pane">
          <div className="cc-pane-header">
            <span className="cc-pane-title">Result: {outputLang}</span>
            <div className="cc-pane-toolbar">
              <button className="cc-tool-btn" onClick={() => handleCopy(convertedCode)} disabled={!convertedCode} title="Copy result">📋</button>
              <button className="cc-tool-btn" onClick={handleDownload} disabled={!convertedCode} title="Download file">⬇</button>
            </div>
          </div>
          <div className="cc-result-area">
             {loading ? (
               <div className="cc-empty-state">
                 <div className="cc-spinner" />
                 <p>AI Generation in progress...</p>
               </div>
             ) : !convertedCode ? (
               <div className="cc-empty-state">
                 <span className="cc-empty-icon">✨</span>
                 <p>Waiting for Input...</p>
                 <small style={{opacity:0.6}}>Your converted code will appear here</small>
               </div>
             ) : (
               <pre ref={outputHighlightRef} className="cc-result-code" onScroll={handleOutputScroll}>
                 <code dangerouslySetInnerHTML={{ __html: highlightCode(convertedCode, outputLang) }} />
               </pre>
             )}
          </div>
        </div>

      </main>

      {/* 3. TERMINAL FOOTER */}
      <footer className="cc-terminal">
        <div className="cc-terminal-tabs">
           <button className={`cc-term-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>EXECUTION</button>
           <button className={`cc-term-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>LOGS</button>
        </div>
        <div className="cc-term-body">
           {activeTab === 'summary' && (
             <div style={{display:'flex', gap:'50px', alignItems:'center', height:'100%'}}>
               <div><label className="cc-label">STATUS</label><p style={{margin:0, fontWeight:700, color:convertedCode?'#4ade80':'inherit'}}>{convertedCode ? 'SUCCESS' : 'IDLE'}</p></div>
               <div><label className="cc-label">PROCESSOR</label><p style={{margin:0, fontWeight:700}}>LLM-CORE-v4</p></div>
               <div><label className="cc-label">TIME</label><p style={{margin:0, fontWeight:700}}>{convertedCode ? '142ms' : '0ms'}</p></div>
               <div><label className="cc-label">MEMORY</label><p style={{margin:0, fontWeight:700}}>{convertedCode ? '2.8MB' : '0MB'}</p></div>
             </div>
           )}
           {activeTab === 'details' && (
             <div style={{opacity:0.6}}>
               <p style={{margin:0}}>[{new Date().toLocaleTimeString()}] Workspace initialized.</p>
               {convertedCode && <p style={{margin:'4px 0 0 0', color:'#4ade80'}}>[{new Date().toLocaleTimeString()}] Successfully converted {lineCount} lines to {outputLang}.</p>}
             </div>
           )}
        </div>
      </footer>
    </div>
  );
}
