import React, { useState } from "react";
import "../App.css";

function RenderField({ value }) {
  // value may be: array, object, string
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
    // pretty print object with keys
    return (
      <div style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <strong>{k}:</strong> {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
          </div>
        ))}
      </div>
    );
  }

  // string (maybe multi-line)
  if (!value || String(value).trim() === "") return <div className="empty-note">— Nothing to show —</div>;

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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explanation");
  const [analysis, setAnalysis] = useState({
    explanation: [],
    errors: [],
    complexity: { time: "", space: "", notes: "" },
    flowchart: [],
    optimized: ""
  });

  const handleAnalyze = async () => {
    if (!inputCode.trim()) {
      alert("⚠️ Please paste your code first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputCode })
      });
      const data = await res.json();
      // set default safe structure if missing
      setAnalysis({
        explanation: data.explanation || [],
        errors: data.errors || [],
        complexity: data.complexity || { time: "", space: "", notes: "" },
        flowchart: data.flowchart || [],
        optimized: data.optimized || ""
      });
    } catch (err) {
      console.error(err);
      alert("❌ Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["explanation", "errors", "complexity", "flowchart", "optimized"];

  return (
    <div className="dashboard-container">
      <h1 className="welcome-text">Code Analyzer</h1>
      <p className="sub-text">Upload your code and get AI-powered insights.</p>

      <div className="analyzer-layout">
        <div className="code-input-section">
          <h3>Code Input</h3>
          <textarea
            className="code-area"
            placeholder="Paste your code here..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          />
          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Code"}
          </button>
        </div>

        <div className="analysis-results">
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

          <div className="tab-output" style={{ padding: 16 }}>
            <RenderField value={analysis[activeTab]} />
          </div>
        </div>
      </div>

      {/* design reference preview (optional) */}
      <div style={{ marginTop: 18, color: "#6b7280", display: "flex", gap: 8, alignItems: "center" }}>
        <small>Design reference:</small>
        <img alt="ref" src="/mnt/data/7d3e6fa5-f6cc-44cc-b1e8-72a06d8fe79b.png" style={{ width: 220, borderRadius: 6 }} />
      </div>
    </div>
  );
}