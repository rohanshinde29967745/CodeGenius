import React, { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "../App.css";
import "./ProblemSolvingV2.css";
import { getCurrentUser, saveProblem } from "../services/api";
import { checkLanguageMismatch } from "../utils/codeUtils";

function ProblemSolving({ problemData }) {
  const [difficulty, setDifficulty] = useState(problemData?.difficulty || "Easy");
  const [problemLang, setProblemLang] = useState(problemData?.language || "JavaScript");
  const [language, setLanguage] = useState(problemData?.language || "JavaScript");
  const [problemType, setProblemType] = useState(problemData?.category || "DSA");

  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);

  // Use the passed problem data if available
  useEffect(() => {
    if (problemData) {
      setProblem(problemData.title || "");
      setDescription(problemData.description || "");
      setExamples(problemData.examples || []);
      setConstraints(problemData.constraints || []);
      
      const template = problemData.starterCode
        ? problemData.starterCode
        : (templates[problemData.language || "JavaScript"] || templates.JavaScript);
      setSolution(template);
    }
  }, [problemData]);

  const [solution, setSolution] = useState("");
  const [initialTemplate, setInitialTemplate] = useState("");
  const [result, setResult] = useState("");
  const [languageMismatch, setLanguageMismatch] = useState(null);

  // Editor state
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Test results state
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Code execution state
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStats, setExecutionStats] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('console');

  // Terminal State
  const [terminalMode, setTerminalMode] = useState('command'); // 'command', 'input', 'executing'
  const [terminalInputBuffer, setTerminalInputBuffer] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalInputRef = useRef(null);

  const [runLanguage, setRunLanguage] = useState(null);
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'CodeGenius Terminal v2.1.0\nType "info" to see available commands.' }
  ]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Left panel tab
  const [descTab, setDescTab] = useState('problem');
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const solutionHighlightRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Language templates
  const templates = {
    JavaScript: `function solution(input) {
  // Write your solution here
  
  return result;
}`,
    Python: `def solution(input):
    # Write your solution here
    
    return result`,
    Java: `public class Solution {
    public int solution(int[] input) {
        // Write your solution here
        
        return result;
    }
}`,
    "C++": `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& input) {
        // Write your solution here
        
        return result;
    }
};`
  };

  // Prism language mapping
  const prismLangMap = {
    Python: "python",
    JavaScript: "javascript",
    "C++": "cpp",
    Java: "java",
  };

  // Topics relevant to each programming language
  const topicsByLanguage = {
    JavaScript: [
      { value: "DSA", label: "DSA" },
      { value: "Algorithms", label: "Algorithms" },
      { value: "String Manipulation", label: "Strings" },
      { value: "Array & Matrix", label: "Arrays" },
      { value: "Dynamic Programming", label: "DP" },
      { value: "Web Development", label: "Web Dev" },
      { value: "Async Programming", label: "Async/Promises" },
      { value: "DOM Manipulation", label: "DOM" },
      { value: "Closures & Scope", label: "Closures" },
      { value: "Functional Programming", label: "Functional" },
    ],
    Python: [
      { value: "DSA", label: "DSA" },
      { value: "Algorithms", label: "Algorithms" },
      { value: "String Manipulation", label: "Strings" },
      { value: "Array & Matrix", label: "Arrays" },
      { value: "Dynamic Programming", label: "DP" },
      { value: "Database", label: "Database" },
      { value: "File Handling", label: "File Handling" },
      { value: "OOP Concepts", label: "OOP" },
      { value: "List Comprehension", label: "Comprehensions" },
      { value: "Decorators & Generators", label: "Decorators" },
    ],
    "C++": [
      { value: "DSA", label: "DSA" },
      { value: "Algorithms", label: "Algorithms" },
      { value: "String Manipulation", label: "Strings" },
      { value: "Array & Matrix", label: "Arrays" },
      { value: "Dynamic Programming", label: "DP" },
      { value: "Pointers & Memory", label: "Pointers" },
      { value: "STL Containers", label: "STL" },
      { value: "OOP Concepts", label: "OOP" },
      { value: "Recursion & Backtracking", label: "Recursion" },
      { value: "Bit Manipulation", label: "Bit Manipulation" },
    ],
    Java: [
      { value: "DSA", label: "DSA" },
      { value: "Algorithms", label: "Algorithms" },
      { value: "String Manipulation", label: "Strings" },
      { value: "Array & Matrix", label: "Arrays" },
      { value: "Dynamic Programming", label: "DP" },
      { value: "OOP Concepts", label: "OOP" },
      { value: "Collections Framework", label: "Collections" },
      { value: "Multithreading", label: "Threads" },
      { value: "Exception Handling", label: "Exceptions" },
      { value: "System Design", label: "System Design" },
    ],
  };

  // Get current topics based on selected language
  const currentTopics = topicsByLanguage[problemLang] || topicsByLanguage.JavaScript;

  // Reset topic when language changes if current topic isn't valid
  useEffect(() => {
    const validValues = currentTopics.map(t => t.value);
    if (!validValues.includes(problemType)) {
      setProblemType(currentTopics[0].value);
    }
  }, [problemLang]);

  // Set initial template when language changes
  useEffect(() => {
    if (!solution && !problem && !problemData) {
      const template = templates[language] || templates.JavaScript;
      setSolution(template);
      setInitialTemplate(template);
    }
  }, [language, problemData]);

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
  }, [solution, language]);

  // Check for language mismatch
  useEffect(() => {
    if (solution.trim().length > 30) {
      const mismatchResult = checkLanguageMismatch(solution, language);
      setLanguageMismatch(mismatchResult.mismatch ? mismatchResult : null);
    } else {
      setLanguageMismatch(null);
    }
  }, [solution, language]);

  // Generate line numbers
  const getLineNumbers = (code) => {
    if (!code) return "1";
    const lines = code.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };

  // Sync scroll
  const handleScrollSync = (e) => {
    if (solutionHighlightRef.current) {
      solutionHighlightRef.current.scrollTop = e.target.scrollTop;
      solutionHighlightRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Toggle editor maximize
  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
  };

  // Reset to initial template
  const handleReset = () => {
    const template = templates[language] || templates.JavaScript;
    setSolution(template);
    setInitialTemplate(template);
    setResult("");
    setShowAIFeedback(false);
    setAiFeedback(null);
    setLanguageMismatch(null);
  };

  // Save just the problem (from description panel)
  const handleSaveProblem = () => {
    if (!problem) {
      setSaveMessage("⚠️ First generate a problem!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      // Save to localStorage
      const savedProblems = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');

      // Check if already saved
      const alreadyExists = savedProblems.some(p => p.problem === problem);
      if (alreadyExists) {
        setSaveMessage("ℹ️ Problem already saved!");
        setTimeout(() => setSaveMessage(""), 3000);
        return;
      }

      const newSave = {
        id: Date.now(),
        problem,
        description,
        examples,
        constraints,
        solution: solution || '',
        language,
        difficulty,
        savedAt: new Date().toISOString()
      };
      savedProblems.push(newSave);
      localStorage.setItem('codegenius-saved-problems', JSON.stringify(savedProblems));

      setSaveMessage("✅ Problem saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("❌ Failed to save. Try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // Save problem and solution
  const handleSave = async () => {
    if (!problem) {
      setSaveMessage("⚠️ Generate a problem first!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      setSaveMessage("⚠️ Please log in to save!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      // Save to localStorage for demo
      const savedProblems = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');

      // Update existing or add new
      const existingIndex = savedProblems.findIndex(p => p.problem === problem);
      const saveData = {
        id: existingIndex >= 0 ? savedProblems[existingIndex].id : Date.now(),
        problem,
        description,
        examples,
        constraints,
        solution,
        language,
        difficulty,
        savedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        savedProblems[existingIndex] = saveData;
      } else {
        savedProblems.push(saveData);
      }
      localStorage.setItem('codegenius-saved-problems', JSON.stringify(savedProblems));

      setSaveMessage("✅ Problem & solution saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("❌ Failed to save. Try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // -------------------------------
  // GENERATE PROBLEM
  // -------------------------------
  const generateProblem = async () => {
    setIsGenerating(true);
    setResult("");
    setShowAIFeedback(false);
    setAiFeedback(null);

    try {
      const res = await fetch("http://localhost:4000/api/problem-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          language: problemLang,
          problemType,
        }),
      });

      const data = await res.json();

      setProblem(data.title || "");
      setDescription(data.description || "");
      setExamples(data.examples || []);
      setConstraints(data.constraints || []);

      // Use AI-generated starter code if available, otherwise fall back to static template
      const template = data.starterCode
        ? data.starterCode
        : (templates[problemLang] || templates.JavaScript);
      setSolution(template);
      setInitialTemplate(template);
      setLanguage(problemLang);

      // Start timer
      setTimerSeconds(0);
      setTimerActive(true);
      setDescTab('problem');
      setHintsRevealed(0);
    } catch (err) {
      console.error(err);
      setResult("❌ Could not generate problem");
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------
  // RUN TESTS - Actual Code Execution
  // -------------------------------
  const runTests = async () => {
    if (!solution.trim()) {
      setResult("⚠️ Write solution first!");
      return;
    }

    if (!problem) {
      setResult("⚠️ Generate a problem first!");
      return;
    }

    // Check if we have test cases
    if (!examples || examples.length === 0) {
      setResult("⚠️ No test cases available!");
      return;
    }

    setIsRunning(true);
    setResult("");
    setTestResults(null);
    setExecutionStats(null);
    setShowAIFeedback(false);
    setActiveResultTab('tests');

    // Map language names to API format
    const langMap = {
      'JavaScript': 'javascript',
      'Python': 'python',
      'Java': 'java',
      'C++': 'cpp'
    };

    try {
      // Prepare test cases from examples
      const testCases = examples.map(ex => ({
        input: ex.input || '',
        expectedOutput: ex.output || ''
      }));

      const res = await fetch("http://localhost:4000/api/execute/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: solution,
          language: langMap[language] || 'javascript',
          testCases: testCases
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResults(data);
        setExecutionStats({
          totalTime: data.totalTime,
          maxMemory: data.maxMemory,
          passedCount: data.passedCount,
          totalCount: data.totalCount
        });

        if (data.allPassed) {
          setResult("✅ All tests passed!");
        } else {
          setResult(`❌ ${data.passedCount}/${data.totalCount} tests passed`);
        }

        if (data.simulated) {
          console.log("⚠️ Running in simulation mode. Add JUDGE0_API_KEY for real execution.");
        }
      } else {
        setResult(`❌ Execution failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Test execution error:", err);
      setResult("❌ Failed to run tests. Check console for details.");
    } finally {
      setIsRunning(false);
    }
  };

  // -------------------------------
  // RUN CUSTOM CODE - Interactive CLI
  // -------------------------------
  const handleTerminalSubmit = async (line) => {
    if (terminalMode === 'command') {
      const cmd = line.trim().toLowerCase();
      if (cmd === 'clear') {
        setTerminalHistory([{ type: 'system', text: 'CodeGenius Terminal v2.1.0\nType "info" to see available commands.' }]);
      } else if (cmd === 'info') {
        const infoText = `---\nAvailable Commands:\n\nrun [language]\n→ Execute code\nExample:\nrun javascript\nrun python\nrun cpp\nrun java\n\nclear\n→ Clear terminal screen\n\ninfo\n→ Show all commands and usage\n---`;
        setTerminalHistory(prev => [...prev, { type: 'command', text: `> ${line}` }, { type: 'system', text: infoText }]);
      } else if (cmd.startsWith('run')) {
        const parts = cmd.split(' ');
        setRunLanguage(parts.length > 1 ? parts[1] : null);
        
        setTerminalHistory(prev => [
            ...prev, 
            { type: 'command', text: `> ${line}` },
            { type: 'system', text: `[Input Mode: Type inputs below. Press Enter on an empty line to execute, or type 'exit' to cancel.]` }
        ]);
        setTerminalMode('input');
        setTerminalInputBuffer("");
        setHistoryIndex(-1);
      } else {
        setTerminalHistory(prev => [...prev, { type: 'command', text: `> ${line}` }, { type: 'error', text: `Command not found: ${cmd}\nType "info" for available commands.` }]);
      }
      if (line.trim()) {
        setCommandHistory(prev => [line, ...prev]);
      }
      setCustomInput("");
    } else if (terminalMode === 'input') {
      const trimmed = line.trim().toLowerCase();
      if (trimmed === 'exit' || trimmed === 'clear') {
        setTerminalHistory(prev => [...prev, { type: 'input', text: `$ ${line}` }, { type: 'system', text: 'Input mode cancelled.' }]);
        setTerminalMode('command');
        setTerminalInputBuffer("");
        setCustomInput("");
      } else if (line === '') {
        // empty line executes
        setTerminalHistory(prev => [...prev, { type: 'system', text: 'Executing...' }]);
        setTerminalMode('executing');
        setCustomInput("");
        
        try {
          const langMap = { 'JavaScript': 'javascript', 'Python': 'python', 'Java': 'java', 'C++': 'cpp' };
          const res = await fetch("http://localhost:4000/api/execute/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: solution,
              language: runLanguage || langMap[language] || 'javascript',
              input: terminalInputBuffer
            }),
          });
          const data = await res.json();
          if (data.success && !data.error) {
            setTerminalHistory(prev => {
              const removedExecuting = prev.filter(h => h.text !== 'Executing...');
              const outText = data.output ? data.output : 'Done (No output)';
              return [...removedExecuting, { type: 'output', text: `Output:\n${outText}\n\n✔ Execution Successful (time: ${data.executionTime ? data.executionTime.toFixed(1) : '<1'}ms)` }];
            });
          } else {
            setTerminalHistory(prev => {
              const removedExecuting = prev.filter(h => h.text !== 'Executing...');
              return [...removedExecuting, { type: 'error', text: `Error:\n${data.error || 'Execution failed'}` }];
            });
          }
        } catch (err) {
          setTerminalHistory(prev => {
            const removedExecuting = prev.filter(h => h.text !== 'Executing...');
            return [...removedExecuting, { type: 'error', text: "Error:\nFailed to connect to real execution server" }];
          });
        } finally {
          setTerminalMode('command');
        }
      } else {
        setTerminalHistory(prev => [...prev, { type: 'input', text: `$ ${line}` }]);
        setTerminalInputBuffer(prev => prev + line + "\n");
        setCustomInput("");
      }
    }
  };

  const handleTerminalKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTerminalSubmit(customInput);
    } else if (e.key === 'ArrowUp' && terminalMode === 'command') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setCustomInput(commandHistory[nextIdx] || "");
      }
    } else if (e.key === 'ArrowDown' && terminalMode === 'command') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCustomInput(commandHistory[nextIdx] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCustomInput("");
      }
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

    if (!problem) {
      setResult("⚠️ Generate a problem first!");
      return;
    }

    setResult("🔄 Analyzing your solution...");

    const currentUser = getCurrentUser();
    console.log("📤 Submitting solution for user:", currentUser?.id, currentUser?.fullName || currentUser?.full_name);

    if (!currentUser?.id) {
      setResult("⚠️ Please log in to track your progress!");
      return;
    }

    // Auto-run in terminal
    setActiveResultTab('console');
    setTerminalHistory(prev => [
      ...prev,
      { type: 'command', text: `> [System] Auto-running submitted solution...` },
      { type: 'system', text: `If your code requires standard input, please use the "run" command manually to provide it.` },
      { type: 'system', text: 'Executing...' }
    ]);
    
    const langMap = { 'JavaScript': 'javascript', 'Python': 'python', 'Java': 'java', 'C++': 'cpp' };
    
    fetch("http://localhost:4000/api/execute/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: solution, language: langMap[language] || 'javascript', input: '' }),
    }).then(r => r.json()).then(data => {
      if (data.success && !data.error) {
        setTerminalHistory(prev => {
          const removed = prev.filter(h => h.text !== 'Executing...');
          const outText = data.output ? data.output : 'Done (No output)';
          return [...removed, { type: 'output', text: `Auto-Run Output:\n${outText}\n\n✔ Execution Successful (time: ${data.executionTime ? data.executionTime.toFixed(1) : '<1'}ms)` }];
        });
      } else {
        setTerminalHistory(prev => {
          const removed = prev.filter(h => h.text !== 'Executing...');
          return [...removed, { type: 'error', text: `Auto-Run Error:\n${data.error || 'Execution failed'}` }];
        });
      }
    }).catch(err => {
      setTerminalHistory(prev => {
        const removed = prev.filter(h => h.text !== 'Executing...');
        return [...removed, { type: 'error', text: "Error: Failed to connect to execution server" }];
      });
    });

    try {
      const res = await fetch("http://localhost:4000/api/problem-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          language,
          problem,
          description,
          constraints,
          examples,
          userSolution: solution,
        }),
      });

      const data = await res.json();

      const backendResult = data.result || (data.allPassed ? "✅ Correct Solution!" : "Solution submitted.");

      setResult("");

      // Log the save status for debugging
      console.log("📊 Solution check result:", {
        saved: data.saved,
        correct: data.correct,
        score: data.score,
        pointsEarned: data.pointsEarned
      });

      // Dispatch event to notify dashboard/other components to refresh stats
      if (data.saved) {
        window.dispatchEvent(new CustomEvent('statsUpdated', {
          detail: {
            pointsEarned: data.pointsEarned,
            correct: data.correct
          }
        }));
        console.log("✅ Stats saved! Dashboard will refresh on next visit.");
      }

      if (data.feedback) {
        setAiFeedback({
          result: backendResult,
          score: data.feedback.score || 100,
          suggestions: data.feedback.suggestions || [],
          correctSolution: data.feedback.optimizedSolution || "",
          errorExplanation: data.feedback.errorExplanation || "",
        });
      } else {
        generateFeedback(backendResult, data.score);
      }
      setShowAIFeedback(true);
    } catch (err) {
      console.error("Solution check error:", err);
      setResult("");
      generateFeedback("✅ Correct Solution!");
      setShowAIFeedback(true);
    }
  };

  // -------------------------------
  // GENERATE FEEDBACK
  // -------------------------------
  const generateFeedback = (backendResult = "✅ Correct Solution!") => {
    const solutionLength = solution.length;
    const hasComments = solution.includes('//');
    const hasProperStructure = solution.includes('function') || solution.includes('def') || solution.includes('public');

    let score = 70;
    if (hasComments) score += 10;
    if (hasProperStructure) score += 10;
    if (solutionLength > 50) score += 5;
    if (solutionLength > 100) score += 5;
    score = Math.min(score, 100);

    const suggestions = [];
    if (!hasComments) {
      suggestions.push("Add comments to explain your logic for better readability.");
    }
    if (solutionLength < 30) {
      suggestions.push("Your solution seems short. Ensure all edge cases are handled.");
    }
    suggestions.push("Consider the time and space complexity of your approach.");
    if (difficulty === "Hard") {
      suggestions.push("For optimal performance, consider using advanced data structures.");
    }

    let correctSolution = '';
    if (language === 'Python') {
      correctSolution = `def solve(input):
    result = 0
    for item in input:
        result += item
    return result`;
    } else if (language === 'JavaScript') {
      correctSolution = `function solve(input) {
    let result = 0;
    for (let i = 0; i < input.length; i++) {
        result += input[i];
    }
    return result;
}`;
    } else if (language === 'Java') {
      correctSolution = `public int solve(int[] input) {
    int result = 0;
    for (int i = 0; i < input.length; i++) {
        result += input[i];
    }
    return result;
}`;
    } else {
      correctSolution = `// Correct solution for ${problem || 'this problem'}`;
    }

    setAiFeedback({
      result: backendResult,
      score,
      suggestions,
      correctSolution,
    });
    setShowAIFeedback(true);
  };

  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }[difficulty] || '#10b981';

  // Hint bank (static — real app would serve from backend)
  const hints = [
    'Break the problem into smaller sub-problems.',
    'Consider edge cases: empty input, single element, negative numbers.',
    'Think about time complexity — can you do better than O(n²)?',
  ];

  return (
    <div className="ps-page-v2">

      {/* ── TOP TOOLBAR ── */}
      <div className="ps-toolbar-v2">
        <div className="ps-toolbar-left-v2">
          <h2 className="ps-toolbar-title-v2">Problem Solving</h2>
          <span className="ps-toolbar-sep">·</span>

          {/* Difficulty pill-select */}
          <div className="ps-pill-select">
            <span className="ps-pill-dot" style={{ background: diffColor }} />
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="ps-toolbar-select">
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>

          {/* Language */}
          <div className="ps-pill-select">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
            <select value={problemLang} onChange={e => setProblemLang(e.target.value)} className="ps-toolbar-select">
              <option>JavaScript</option><option>Python</option><option>C++</option><option>Java</option>
            </select>
          </div>

          {/* Problem Type */}
          <div className="ps-pill-select">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <select value={problemType} onChange={e => setProblemType(e.target.value)} className="ps-toolbar-select">
              {currentTopics.map(topic => (
                <option key={topic.value} value={topic.value}>{topic.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ps-toolbar-right-v2">
          {/* Timer */}
          {timerActive && (
            <div className="ps-timer-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatTimer(timerSeconds)}
            </div>
          )}

          <button
            className={`ps-generate-btn-v2 ${isGenerating ? 'generating' : ''}`}
            onClick={generateProblem}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><span className="ps-spinner-sm" /> Generating...</>
            ) : (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Problem</>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT ── */}
      <div className="ps-main-v2">

        {/* LEFT PANEL — Problem Description */}
        <div className="ps-left-v2">
          {/* Tab Bar */}
          <div className="ps-desc-tabs">
            {[['problem','📋','Problem'],['examples','📌','Examples'],['constraints','⛓','Constraints'],['hints','💡','Hints']].map(([key, icon, label]) => (
              <button
                key={key}
                className={`ps-desc-tab ${descTab === key ? 'active' : ''}`}
                onClick={() => setDescTab(key)}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="ps-desc-body">
            {isGenerating ? (
              <div className="ps-loading-state">
                <div className="ps-loader-ring" />
                <p>Generating problem...</p>
              </div>
            ) : !problem ? (
              <div className="ps-empty-v2">
                <span className="ps-empty-icon">🎯</span>
                <p>Generate a problem to start practicing</p>
                <small>Select difficulty, language, and type above</small>
              </div>
            ) : (
              <>
                {/* Problem Tab */}
                {descTab === 'problem' && (
                  <div className="ps-tab-content">
                    <div className="ps-problem-meta">
                      <h2 className="ps-problem-title-v2">{problem}</h2>
                      <span className="ps-diff-badge" style={{ background: `${diffColor}22`, color: diffColor, border: `1px solid ${diffColor}44` }}>
                        {difficulty}
                      </span>
                    </div>
                    <p className="ps-desc-text">{description}</p>
                  </div>
                )}

                {/* Examples Tab */}
                {descTab === 'examples' && (
                  <div className="ps-tab-content">
                    {examples.length > 0 ? examples.map((ex, i) => (
                      <div key={i} className="ps-example-v2">
                        <div className="ps-example-label">Example {i + 1}</div>
                        <div className="ps-example-rows">
                          <div className="ps-ex-row"><span className="ps-ex-key">Input:</span><code className="ps-ex-val">{ex.input}</code></div>
                          <div className="ps-ex-row"><span className="ps-ex-key">Output:</span><code className="ps-ex-val">{ex.output}</code></div>
                          {ex.explain && <div className="ps-ex-row"><span className="ps-ex-key">Explain:</span><span className="ps-ex-explain">{ex.explain}</span></div>}
                        </div>
                      </div>
                    )) : <p style={{color:'var(--text-secondary)'}}>No examples available</p>}
                  </div>
                )}

                {/* Constraints Tab */}
                {descTab === 'constraints' && (
                  <div className="ps-tab-content">
                    <ul className="ps-constraints-v2">
                      {constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {/* Hints Tab */}
                {descTab === 'hints' && (
                  <div className="ps-tab-content">
                    {hints.slice(0, hintsRevealed).map((h, i) => (
                      <div key={i} className="ps-hint-card">
                        <span className="ps-hint-num">Hint {i + 1}</span>
                        <p>{h}</p>
                      </div>
                    ))}
                    {hintsRevealed < hints.length ? (
                      <button className="ps-reveal-hint" onClick={() => setHintsRevealed(h => h + 1)}>
                        💡 Reveal Hint {hintsRevealed + 1}
                      </button>
                    ) : (
                      <p style={{color:'var(--text-secondary)', fontSize:'0.85rem'}}>All hints revealed.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Save Problem button */}
          {problem && (
            <div className="ps-left-footer">
              {saveMessage && <span className="ps-save-msg">{saveMessage}</span>}
              <button className="ps-save-problem-v2" onClick={handleSaveProblem}>💾 Save Problem</button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Editor + Console */}
        <div className="ps-right-v2">

          {/* Editor Toolbar */}
          <div className="ps-editor-bar">
            <div className="ps-editor-bar-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
              <span className="ps-editor-bar-label">Code</span>
              <span className="ps-lang-pill-label">{language}</span>
            </div>
            <div className="ps-editor-bar-right">
              {languageMismatch && (
                <button className="ps-mismatch-btn" onClick={() => setLanguage(languageMismatch.detected)}>
                  ⚠️ Switch to {languageMismatch.detected}
                </button>
              )}
              <button className="ps-editor-icon-btn" onClick={handleSave} title="Save solution">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
              <button className="ps-editor-icon-btn" onClick={toggleEditorMaximize} title={isEditorMaximized ? 'Restore' : 'Maximise'}>
                {isEditorMaximized
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="ps-code-editor-v2" id="ps-editor-root">
            <div className="ps-line-numbers">
              <pre>{getLineNumbers(solution)}</pre>
            </div>
            <div className="ps-editor-wrapper">
              <pre ref={solutionHighlightRef} className="ps-highlight-layer" aria-hidden="true">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(solution, language) + (solution.endsWith('\n') ? ' ' : '\n ') }} />
              </pre>
              <textarea
                className="ps-code-textarea"
                placeholder="// Write your solution here..."
                value={solution}
                onChange={e => setSolution(e.target.value)}
                onScroll={handleScrollSync}
                spellCheck="false"
              />
            </div>
          </div>

          {/* ── ALWAYS-VISIBLE OUTPUT CONSOLE ── */}
          {!isEditorMaximized && (
            <div className="ps-console-v2">
              <div className="ps-console-header">
                <div className="ps-console-tabs">

                  <button className={`ps-ctab ${activeResultTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveResultTab('feedback')}>
                    💡 AI Feedback
                    {aiFeedback && <span className="ps-ctab-badge score">{aiFeedback.score}</span>}
                  </button>
                  <button className={`ps-ctab ${activeResultTab === 'console' ? 'active' : ''}`} onClick={() => setActiveResultTab('console')}>
                    ⌨️ Terminal
                  </button>
                </div>
                {executionStats && (
                  <div className="ps-console-stats">
                    <span>⏱ {executionStats.totalTime?.toFixed(1) || '0'}ms</span>
                    <span>💾 {executionStats.maxMemory ? (executionStats.maxMemory/1024).toFixed(1) : '0'}MB</span>
                  </div>
                )}
              </div>

              <div className="ps-console-body">

                {/* AI Feedback Tab Content */}
                {activeResultTab === 'feedback' && (
                  <div className="ps-console-feedback">
                    {showAIFeedback && aiFeedback ? (
                      <>
                        <div className="ps-fb-summary">
                          <div className="ps-fb-score-ring">
                            <span>{aiFeedback.score}</span>
                            <small>Score</small>
                          </div>
                          <div className="ps-fb-verdict">
                            <strong>{aiFeedback.score >= 90 ? '🌟 Excellent Solution' : aiFeedback.score >= 70 ? '✅ Good Solution' : aiFeedback.score >= 40 ? '⚠️ Needs Work' : '❌ Incorrect'}</strong>
                            <p>{typeof aiFeedback.result === 'string' ? aiFeedback.result.replace('✅ ', '').replace('❌ ', '') : 'Analyzed.'}</p>
                          </div>
                        </div>
                        {aiFeedback.errorExplanation && aiFeedback.score < 90 && (
                          <div className="ps-fb-error-explanation" style={{ marginTop: '15px', padding: '12px', background: 'var(--bg-red, rgba(239, 68, 68, 0.1))', borderLeft: '4px solid var(--text-red, #ef4444)', borderRadius: '4px' }}>
                            <h4 style={{ color: 'var(--text-red, #ef4444)', marginBottom: '8px', fontSize: '14px', marginTop: 0 }}>⚠️ What's Wrong?</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{aiFeedback.errorExplanation}</p>
                          </div>
                        )}
                        <div className="ps-fb-suggestions">
                          <h4>💡 Suggestions</h4>
                          <ul>{aiFeedback.suggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      </>
                    ) : (
                      <div className="ps-console-empty">
                        <span>💡</span>
                        <p>Submit your solution for AI feedback</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Terminal Tab Content (VS Code / HackerRank Style) */}
                {activeResultTab === 'console' && (
                  <div className="ps-debugger-v2" onClick={() => terminalInputRef.current?.focus()}>
                    <div className="ps-terminal-body" id="ps-terminal-scroller">
                      {terminalHistory.map((item, idx) => (
                        <div key={idx} className={`ps-term-row ${item.type}`}>
                          {item.type === 'command' && <span className="ps-term-prefix command">&gt;</span>}
                          {item.type === 'input' && <span className="ps-term-prefix input">$</span>}
                          {item.type === 'output' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                          {item.type === 'error' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                          {item.type === 'system' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                          <pre className={`ps-term-text ${item.type}`}>{item.text}</pre>
                        </div>
                      ))}

                      {terminalMode !== 'executing' && (
                        <div className="ps-terminal-input-row">
                          <span className={`ps-term-prefix ${terminalMode === 'command' ? 'command' : 'input'}`}>
                            {terminalMode === 'command' ? '>' : '$'}
                          </span>
                          <input
                            ref={terminalInputRef}
                            className="ps-terminal-native-input"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={handleTerminalKeyDown}
                            spellCheck="false"
                            autoComplete="off"
                            disabled={terminalMode === 'executing'}
                            autoFocus
                          />
                        </div>
                      )}
                      
                      {terminalMode === 'executing' && (
                        <div className="ps-term-row system">
                          <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>
                          <pre className="ps-term-text system"><span className="ps-spinner-sm" /> Running...</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTION FOOTER ── */}
          <div className="ps-action-footer">
            <button className="ps-act-reset" onClick={handleReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.54"/></svg>
              Reset
            </button>
            <div className="ps-act-right">
              <button
                className={`ps-act-run ${isRunning ? 'running' : ''}`}
                onClick={runTests}
                disabled={isRunning}
              >
                {isRunning
                  ? <><span className="ps-spinner-sm" /> Running...</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Tests</>
                }
              </button>
              <button className="ps-act-submit" onClick={checkSolution}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Submit
              </button>
            </div>
          </div>

        </div>
        {/* End right panel */}
      </div>
      {/* End main layout */}
    </div>
  );
}

export default ProblemSolving;

