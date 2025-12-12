import React, { useState } from "react";
import "../App.css";

function ProblemSolving() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [problemLang, setProblemLang] = useState("JavaScript"); // NEW
  const [language, setLanguage] = useState("JavaScript");

  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState("");

  // -------------------------------
  // GENERATE PROBLEM
  // -------------------------------
  const generateProblem = async () => {
    setResult("Generating problem...");

    try {
      const res = await fetch("http://localhost:4000/api/problem-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          language: problemLang, // NEW
        }),
      });

      const data = await res.json();

      setProblem(data.title || "");
      setDescription(data.description || "");
      setExamples(data.examples || []);
      setConstraints(data.constraints || []);

      setSolution("");
      setResult("");
    } catch (err) {
      console.error(err);
      setResult("❌ Could not generate problem");
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

    try {
      const res = await fetch("http://localhost:4000/api/problem-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          problem,
          description,
          constraints,
          examples,
          userSolution: solution,
        }),
      });

      const data = await res.json();
      setResult(data.result || "No response");
    } catch (err) {
      setResult("❌ Error checking solution");
    }
  };

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <h1 className="welcome-text">Problem Solving</h1>
      <p className="sub-text">Practice AI-generated coding challenges.</p>

      <div className="ps-topbar">

        {/* Difficulty */}
        <select
          className="ps-difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        {/* PROBLEM LANGUAGE (NEW) */}
        <select
          className="ps-difficulty"
          value={problemLang}
          onChange={(e) => setProblemLang(e.target.value)}
        >
          <option>JavaScript</option>
          <option>Python</option>
          <option>C++</option>
          <option>Java</option>
        </select>

        <button className="ps-generate-btn" onClick={generateProblem}>
          Generate New Problem
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ps-layout">

        {/* LEFT PANEL */}
        <div className="ps-problem-box card">
          <h2 className="ps-problem-title">{problem || "Click Generate Problem"}</h2>

          {problem && (
            <span className={`ps-badge ${difficulty.toLowerCase()}`}>
              {difficulty}
            </span>
          )}

          <h3 className="ps-section">Description</h3>
          <p className="ps-text">{description}</p>

          <h3 className="ps-section">Examples</h3>
          {examples.length > 0 ? (
            examples.map((ex, i) => (
              <div key={i} className="ps-example-block">
                <b>Input:</b> {ex.input} <br />
                <b>Output:</b> {ex.output} <br />
                {ex.explain && <i>{ex.explain}</i>}
              </div>
            ))
          ) : (
            <p className="ps-empty">No examples yet.</p>
          )}

          <h3 className="ps-section">Constraints</h3>
          <ul className="ps-constraints">
            {constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="ps-solution-box card">

          <div className="ps-solution-header">
            <h3>Your Solution</h3>

            <select
              className="ps-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>C++</option>
              <option>Java</option>
            </select>
          </div>

          <textarea
            className="ps-editor"
            placeholder="// Write your solution here..."
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
          />

          <button className="ps-submit-btn" onClick={checkSolution}>
            Submit Solution
          </button>

          {result && (
            <div className="ps-result-box">
              <pre>{result}</pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProblemSolving;
