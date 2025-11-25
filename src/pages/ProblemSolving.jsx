import React, { useState } from "react";
import "../App.css";

function ProblemSolving() {
  const [language, setLanguage] = useState("Python");
  const [solution, setSolution] = useState(
    `def two_sum(nums, target):\n    # Your code here\n    pass`
  );
  const [output, setOutput] = useState("");

  const runTests = () => {
    setOutput("🧪 Running tests...\n✅ All sample test cases passed!");
  };

  const submitSolution = () => {
    setOutput("🚀 Solution submitted successfully!\nScore: 250 points");
  };

  return (
    <div className="dashboard-container">

      {/* PAGE HEADER */}
      <h1 className="welcome-text">Problem Solving</h1>
      <p className="sub-text">Solve problems and practice coding skills.</p>

      {/* ------------ CONSTRAINTS BOX ------------- */}
      <div className="constraints-box">
        <h3>Constraints</h3>
        <ul>
          <li>2 ≤ nums.length ≤ 10⁴</li>
          <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
          <li>-10⁹ ≤ target ≤ 10⁹</li>
          <li>Only one valid answer exists.</li>
        </ul>
      </div>

      {/* ------------ SOLUTION SECTION ------------- */}
      <div className="solution-box">

        <div className="solution-header">
          <h3>Solution</h3>

          {/* Language Selector */}
          <select
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>Python</option>
            <option>JavaScript</option>
            <option>C++</option>
            <option>Java</option>
          </select>
        </div>

        {/* Code Editor */}
        <textarea
          className="solution-editor"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
        ></textarea>

        {/* Buttons */}
        <div className="solution-buttons">
          <button className="run-tests-btn" onClick={runTests}>
            ▶ Run Tests
          </button>

          <button className="submit-btn" onClick={submitSolution}>
            🚀 Submit Solution
          </button>
        </div>
      </div>

      {/* ------------ OUTPUT SECTION ------------- */}
      {output && (
        <div className="output-box">
          <pre>{output}</pre>
        </div>
      )}

    </div>
  );
}

export default ProblemSolving;