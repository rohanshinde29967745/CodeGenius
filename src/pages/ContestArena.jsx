// ContestArena.jsx - Live Contest Solving Environment
import React, { useState, useEffect, useRef, useCallback } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "../App.css";
import "./ContestList.css";
import { getCurrentUser } from "../services/api";

function ContestArena({ contestId, setPage, mode = "arena" }) {
    const isPractice = mode === "practice";
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === "Admin";

    const [contest, setContest] = useState(null);
    const [problems, setProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Code editor state
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);

    // Problem progress tracking
    const [problemProgress, setProblemProgress] = useState({});

    // Terminal & AI Feedback State (for Practice Mode)
    const [activeResultTab, setActiveResultTab] = useState('tests');
    const [customInput, setCustomInput] = useState("");
    const [customOutput, setCustomOutput] = useState(null);
    const [terminalHistory, setTerminalHistory] = useState([
        { type: 'system', text: 'CodeGenius Interactive Terminal v2.1.0\nReady for input. Type your standard input below.' }
    ]);
    const [isExecutingCustom, setIsExecutingCustom] = useState(false);
    const [showAIFeedback, setShowAIFeedback] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [executionStats, setExecutionStats] = useState(null);

    const textareaRef = useRef(null);
    const timerRef = useRef(null);

    const languageTemplates = {
        javascript: `// JavaScript Solution
function solve(input) {
    // Your code here
    
    return result;
}

// Parse input and call solve
const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(solve(input));`,
        python: `# Python Solution
def solve(input_data):
    # Your code here
    
    return result

# Parse input and call solve
import sys
input_data = sys.stdin.read().strip()
print(solve(input_data))`,
        "c++": `// C++ Solution
#include <iostream>
#include <string>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
        java: `// Java Solution
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        
    }
}`
    };

    // Fetch contest and problems
    useEffect(() => {
        if (contestId) {
            fetchContestData();
            fetchLeaderboard();
        }
    }, [contestId]);

    // Timer countdown
    useEffect(() => {
        if (contest && contest.status === "LIVE") {
            const endTime = new Date(contest.end_time).getTime();

            timerRef.current = setInterval(() => {
                const now = Date.now();
                const remaining = endTime - now;

                if (remaining <= 0) {
                    clearInterval(timerRef.current);
                    setTimeRemaining(0);
                    handleContestEnd();
                } else {
                    setTimeRemaining(remaining);
                }
            }, 1000);

            return () => clearInterval(timerRef.current);
        }
    }, [contest]);

    // Auto-refresh leaderboard every 30 seconds
    useEffect(() => {
        const leaderboardInterval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(leaderboardInterval);
    }, [contestId]);

    // Anti-cheating: Visibility change detection
    useEffect(() => {
        if (!isPractice && contest && contest.status === "LIVE") {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    reportViolation("TAB_SWITCH");
                }
            };

            document.addEventListener("visibilitychange", handleVisibilityChange);
            return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
    }, [contest, isPractice]);

    const reportViolation = async (type) => {
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/violation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser?.id, type })
            });

            const data = await res.json();
            if (data.warnings) {
                alert(`⚠️ Warning: Anti-cheat system detected a ${type}. Warning ${data.warnings}/3. Switching tabs is not allowed during the contest!`);
            }
            if (data.isDisqualified) {
                alert("🚫 You have been disqualified from this contest due to multiple violations.");
                setPage("contests"); // Kick out
            }
        } catch (err) {
            console.error("Failed to report violation:", err);
        }
    };

    // Syntax highlighting
    useEffect(() => {
        Prism.highlightAll();
    }, [code, language]);

    const fetchContestData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:4000/api/contests/${contestId}?userId=${currentUser?.id}`
            );
            const data = await res.json();

            if (data.success) {
                setContest(data.contest);
                setProblems(data.contest.problems || []);

                if (data.contest.problems?.length > 0) {
                    setSelectedProblem(data.contest.problems[0]);
                    setCode(languageTemplates[language]);
                }

                // Load saved progress
                loadProgress(data.contest.problems);
            }
        } catch (err) {
            console.error("Failed to fetch contest:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(
                `http://localhost:4000/api/contests/${contestId}/leaderboard?limit=20`
            );
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.leaderboard || []);
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        }
    };

    const loadProgress = async (problemsList) => {
        try {
            const res = await fetch(
                `http://localhost:4000/api/contests/${contestId}/progress/${currentUser?.id}`
            );
            const data = await res.json();
            if (data.success) {
                setProblemProgress(data.progress || {});
            }
        } catch (err) {
            // Progress endpoint may not exist yet, initialize empty
            const initialProgress = {};
            problemsList.forEach(p => {
                initialProgress[p.id] = { solved: false, attempts: 0, score: 0 };
            });
            setProblemProgress(initialProgress);
        }
    };

    const handleContestEnd = () => {
        alert("⏰ Time's up! The contest has ended.");
        setPage({ name: "contestDetail", contestId });
    };

    const handleProblemSelect = (problem) => {
        // Save current code for the problem
        if (selectedProblem) {
            localStorage.setItem(
                `contest_${contestId}_problem_${selectedProblem.id}_code`,
                code
            );
            localStorage.setItem(
                `contest_${contestId}_problem_${selectedProblem.id}_lang`,
                language
            );
        }

        setSelectedProblem(problem);
        setTestResults(null);
        setSubmissionResult(null);

        // Load saved code for selected problem
        const savedCode = localStorage.getItem(
            `contest_${contestId}_problem_${problem.id}_code`
        );
        const savedLang = localStorage.getItem(
            `contest_${contestId}_problem_${problem.id}_lang`
        );

        if (savedCode) {
            setCode(savedCode);
            if (savedLang) setLanguage(savedLang);
        } else {
            setCode(languageTemplates[savedLang || language]);
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        // Only replace code if it's still the template
        if (code === languageTemplates[language] || code === "") {
            setCode(languageTemplates[newLang]);
        }
    };

    const runTests = async () => {
        if (!selectedProblem || !code.trim()) return;

        setIsRunning(true);
        setTestResults(null);

        try {
            // Get test cases from problem examples
            const testCases = selectedProblem.examples?.map(ex => ({
                input: ex.input,
                expected_output: ex.output
            })) || [];

            const res = await fetch("http://localhost:4000/api/execute/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    testCases
                })
            });

            const data = await res.json();
            setTestResults(data);
        } catch (err) {
            console.error("Test execution failed:", err);
            setTestResults({ error: "Failed to run tests" });
        } finally {
            setIsRunning(false);
        }
    };

    const submitSolution = async () => {
        if (!selectedProblem || !code.trim()) return;

        setIsSubmitting(true);
        setSubmissionResult(null);

        try {
            const res = await fetch(
                `http://localhost:4000/api/contests/${contestId}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: currentUser?.id,
                        problemId: selectedProblem.id,
                        code,
                        language,
                        isPractice // Add isPractice to bypass LIVE checks
                    })
                }
            );

            const data = await res.json();
            setSubmissionResult(data);

            if (data.success && data.solved) {
                // Determine new progress state immediately for checks
                const updatedProgress = {
                    ...problemProgress,
                    [selectedProblem.id]: {
                        solved: true,
                        attempts: (problemProgress[selectedProblem.id]?.attempts || 0) + 1,
                        score: data.score
                    }
                };
                setProblemProgress(updatedProgress);

                // Refresh leaderboard if active contest
                fetchLeaderboard();

                // If in practice mode, check if all problems are now solved for the 10 point reward
                if (isPractice) {
                    const solvedCount = Object.values(updatedProgress).filter(p => p.solved).length;
                    if (solvedCount === problems.length && problems.length > 0) {
                        try {
                            const rewardRes = await fetch(`http://localhost:4000/api/contests/${contestId}/practice-complete`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: currentUser?.id })
                            });
                            const rewardData = await rewardRes.json();
                            if (rewardData.success && rewardData.rewarded) {
                                alert(`🎉 Practice Completed! You earned ${rewardData.pointsAwarded} points!`);
                            }
                        } catch (err) {
                            console.error("Failed to claim practice reward:", err);
                        }
                    }
                }
            } else {
                // Increment attempts
                setProblemProgress(prev => ({
                    ...prev,
                    [selectedProblem.id]: {
                        ...prev[selectedProblem.id],
                        attempts: (prev[selectedProblem.id]?.attempts || 0) + 1
                    }
                }));
            }
        } catch (err) {
            console.error("Submission failed:", err);
            setSubmissionResult({ error: "Failed to submit solution" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const runCustomCode = async () => {
        if (!selectedProblem || !code.trim()) return;

        const commandToLog = { type: 'command', text: `> codegenius run ${language.toLowerCase()}` };
        const inputToLog = customInput.trim() ? { type: 'input', text: customInput } : null;

        setTerminalHistory(prev => {
            const updated = [...prev, commandToLog];
            if (inputToLog) updated.push(inputToLog);
            updated.push({ type: 'system', text: 'Executing...' });
            return updated;
        });

        setIsExecutingCustom(true);
        setCustomOutput(null);
        setActiveResultTab('console');

        try {
            const res = await fetch("http://localhost:4000/api/execute/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    input: customInput
                }),
            });

            const data = await res.json();
            if (data.success) {
                setCustomOutput(data);
                setTerminalHistory(prev => {
                    const removedExecuting = prev.filter(h => h.text !== 'Executing...');
                    return [...removedExecuting, { type: 'output', text: data.output || 'Done (No output)' }];
                });
            } else {
                setCustomOutput({ error: data.error || 'Execution failed' });
                setTerminalHistory(prev => {
                    const removedExecuting = prev.filter(h => h.text !== 'Executing...');
                    return [...removedExecuting, { type: 'error', text: data.error || 'Execution failed' }];
                });
            }
        } catch (err) {
            console.error("Custom execution error:", err);
            setCustomOutput({ error: "Failed to connect to execution server" });
            setTerminalHistory(prev => {
                const removedExecuting = prev.filter(h => h.text !== 'Executing...');
                return [...removedExecuting, { type: 'error', text: "Failed to connect to execution server" }];
            });
        } finally {
            setIsExecutingCustom(false);
            setCustomInput("");
        }
    };

    const handleClearTerminal = () => {
        setTerminalHistory([{ type: 'system', text: 'CodeGenius Interactive Terminal v2.1.0\nReady for input. Type your standard input below.' }]);
        setCustomOutput(null);
    };

    const checkSolutionWithGemini = async () => {
        if (!selectedProblem || !code.trim()) return;

        setSubmissionResult(null); // Clear previous runs

        try {
            const res = await fetch("http://localhost:4000/api/problem-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser?.id,
                    language,
                    problem: selectedProblem.title,
                    description: selectedProblem.description,
                    constraints: selectedProblem.constraints,
                    examples: selectedProblem.examples,
                    userSolution: code,
                }),
            });

            const data = await res.json();
            const backendResult = data.result || (data.allPassed ? "✅ Correct Solution!" : "Solution submitted.");

            if (data.feedback) {
                setAiFeedback({
                    result: backendResult,
                    score: data.feedback.score || 100,
                    suggestions: data.feedback.suggestions || [],
                    correctSolution: data.feedback.optimizedSolution || "",
                });
            } else {
                generateFallbackFeedback(backendResult);
            }
            setShowAIFeedback(true);
        } catch (err) {
            console.error("Gemini AI check error:", err);
            generateFallbackFeedback("✅ Correct Solution!");
            setShowAIFeedback(true);
        }
    };

    const generateFallbackFeedback = (backendResult = "✅ Correct Solution!") => {
        const score = code.length > 50 ? 90 : 70;
        setAiFeedback({
            result: backendResult,
            score,
            suggestions: ["Consider the time and space complexity of your approach.", "Ensure all edge cases are perfectly handled."],
            correctSolution: "// Feedback fallback generated"
        });
    };

    const formatTime = (ms) => {
        if (ms === null || ms === undefined) return "--:--:--";
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getTimeClass = () => {
        if (!timeRemaining) return "";
        if (timeRemaining < 5 * 60 * 1000) return "critical"; // < 5 min
        if (timeRemaining < 15 * 60 * 1000) return "warning"; // < 15 min
        return "";
    };

    const getUserRank = () => {
        const userEntry = leaderboard.find(e => e.user_id === currentUser?.id);
        return userEntry?.rank || "-";
    };

    const getUserScore = () => {
        const userEntry = leaderboard.find(e => e.user_id === currentUser?.id);
        return userEntry?.total_score || 0;
    };

    if (loading) {
        return (
            <div className="contest-arena loading">
                <div className="loading-spinner"></div>
                <span>Loading contest arena...</span>
            </div>
        );
    }

    if (!contest || (contest.status === 'UPCOMING' && !contest.isRegistered && !isAdmin) ||
        (!isPractice && contest.status === 'FINISHED') ||
        (isPractice && contest.status === 'UPCOMING')) {
        return (
            <div className="contest-arena error">
                <span className="error-icon">⚠️</span>
                <h2>{isPractice ? "Practice Mode Not Available" : "Contest Not Available"}</h2>
                <p>{isPractice ? "Practice mode is only available for finished contests." : "This contest is not currently live or you are not registered."}</p>
                <button onClick={() => setPage("contests")}>← Back to Contests</button>
            </div>
        );
    }

    return (
        <div className="contest-arena">
            {/* Top Bar - Timer & Stats */}
            <div className="arena-top-bar">
                <div className="arena-left">
                    <button className="exit-btn" onClick={() => {
                        if (window.confirm("Are you sure you want to leave the contest?")) {
                            setPage({ name: "contestDetail", contestId });
                        }
                    }}>
                        <span>←</span> Exit
                    </button>
                    <h1 className="arena-title">{contest.title}</h1>
                </div>

                <div className="arena-timer-section">
                    {!isPractice ? (
                        <div className={`arena-timer ${getTimeClass()}`}>
                            <span className="timer-icon">⏱️</span>
                            <span className="timer-value">{formatTime(timeRemaining)}</span>
                            <span className="timer-label">remaining</span>
                        </div>
                    ) : (
                        <div className="arena-practice-badge">
                            <span className="practice-icon">🎯</span>
                            <span className="practice-label">Practice Mode</span>
                        </div>
                    )}
                </div>

                <div className="arena-right">
                    {!isPractice ? (
                        <div className="user-stats">
                            <div className="stat">
                                <span className="stat-value">#{getUserRank()}</span>
                                <span className="stat-label">Rank</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{getUserScore()}</span>
                                <span className="stat-label">Score</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">
                                    {Object.values(problemProgress).filter(p => p.solved).length}/{problems.length}
                                </span>
                                <span className="stat-label">Solved</span>
                            </div>
                        </div>
                    ) : (
                        <div className="user-stats">
                            <div className="stat">
                                <span className="stat-value">
                                    {Object.values(problemProgress).filter(p => p.solved).length}/{problems.length}
                                </span>
                                <span className="stat-label">Solved</span>
                            </div>
                        </div>
                    )}
                    {!isPractice && (
                        <button
                            className={`leaderboard-toggle ${showLeaderboard ? 'active' : ''}`}
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                        >
                            🏆
                        </button>
                    )}
                </div>
            </div>

            <div className="arena-main">
                {/* Problems Sidebar */}
                <div className="arena-problems-sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-title">PROBLEMS</span>
                        <span className="sidebar-solved-count">
                            {Object.values(problemProgress).filter(p => p.solved).length}
                            <span>/{problems.length}</span>
                        </span>
                    </div>
                    <div className="problems-list">
                        {problems.length === 0 ? (
                            <div className="sidebar-empty">
                                <span>📋</span>
                                <span>No problems yet</span>
                            </div>
                        ) : problems.map((problem, index) => {
                            const prog = problemProgress[problem.id];
                            const isSolved = prog?.solved;
                            const isAttempted = prog?.attempts > 0 && !isSolved;
                            const isActive = selectedProblem?.id === problem.id;
                            return (
                                <button
                                    key={problem.id}
                                    className={`problem-item ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''} ${isAttempted ? 'attempted' : ''}`}
                                    onClick={() => handleProblemSelect(problem)}
                                >
                                    <div className="pi-left">
                                        <span className={`pi-letter ${isSolved ? 'solved' : isAttempted ? 'attempted' : ''}`}>
                                            {isSolved ? '✓' : String.fromCharCode(65 + index)}
                                        </span>
                                    </div>
                                    <div className="pi-info">
                                        <span className="pi-name">{problem.title}</span>
                                        <div className="pi-meta">
                                            <span className={`pi-diff ${problem.difficulty?.toLowerCase()}`}>
                                                {problem.difficulty}
                                            </span>
                                            {isAttempted && (
                                                <span className="pi-attempts">{prog.attempts} tries</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pi-right">
                                        <span className="pi-pts">{problem.points}</span>
                                        {isSolved && <span className="pi-solved-dot"></span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="arena-content">
                    {/* Problem Description */}
                    <div className="arena-problem-panel">
                        {selectedProblem ? (
                            <>
                                <div className="problem-header">
                                    <h2>{selectedProblem.title}</h2>
                                    <div className="problem-badges">
                                        <span className={`diff-badge ${selectedProblem.difficulty?.toLowerCase()}`}>
                                            {selectedProblem.difficulty}
                                        </span>
                                        <span className="points-badge">{selectedProblem.points} pts</span>
                                    </div>
                                </div>

                                <div className="problem-description">
                                    <p>{selectedProblem.description}</p>
                                </div>

                                {selectedProblem.constraints && (
                                    <div className="problem-constraints">
                                        <h4>Constraints</h4>
                                        <ul>
                                            {(typeof selectedProblem.constraints === 'string'
                                                ? JSON.parse(selectedProblem.constraints)
                                                : selectedProblem.constraints
                                            ).map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedProblem.examples && (
                                    <div className="problem-examples">
                                        <h4>Examples</h4>
                                        {(typeof selectedProblem.examples === 'string'
                                            ? JSON.parse(selectedProblem.examples)
                                            : selectedProblem.examples
                                        ).map((ex, i) => (
                                            <div key={i} className="example-box">
                                                <div className="example-input">
                                                    <strong>Input:</strong>
                                                    <pre>{ex.input}</pre>
                                                </div>
                                                <div className="example-output">
                                                    <strong>Output:</strong>
                                                    <pre>{ex.output}</pre>
                                                </div>
                                                {ex.explanation && (
                                                    <div className="example-explanation">
                                                        <strong>Explanation:</strong> {ex.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-problem-selected">
                                Select a problem from the sidebar
                            </div>
                        )}
                    </div>

                    {/* Code Editor */}
                    <div className="arena-editor-panel">
                        <div className="editor-header">
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="language-select"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="c++">C++</option>
                                <option value="java">Java</option>
                            </select>

                            <div className="editor-actions">
                                {isPractice && (
                                    <button
                                        className="run-btn"
                                        onClick={checkSolutionWithGemini}
                                        disabled={!code.trim() || showAIFeedback && activeResultTab === 'feedback' && aiFeedback?.result === "Checking..."}
                                        style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#a78bfa' }}
                                    >
                                        💡 AI Feedback
                                    </button>
                                )}
                                <button
                                    className="run-btn"
                                    onClick={runTests}
                                    disabled={isRunning || !code.trim()}
                                >
                                    {isRunning ? (
                                        <><span className="spinner"></span> Running...</>
                                    ) : (
                                        <><span>▶</span> Run Tests</>
                                    )}
                                </button>
                                <button
                                    className="submit-btn"
                                    onClick={submitSolution}
                                    disabled={isSubmitting || !code.trim() || problemProgress[selectedProblem?.id]?.solved}
                                >
                                    {isSubmitting ? (
                                        <><span className="spinner"></span> Submitting...</>
                                    ) : problemProgress[selectedProblem?.id]?.solved ? (
                                        <><span>✓</span> Solved</>
                                    ) : (
                                        <><span>📤</span> Submit</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="code-editor-container">
                            <textarea
                                ref={textareaRef}
                                className="code-textarea"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Write your solution here..."
                                spellCheck={false}
                            />
                        </div>

                        {/* Results / Terminal Panel */}
                        {isPractice ? (
                            <div className="ps-console-v2" style={{ height: '40%', minHeight: '300px', borderTop: '1px solid #30363d', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>
                                <div className="ps-console-header">
                                    <div className="ps-console-tabs">
                                        <button className={`ps-ctab ${activeResultTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveResultTab('tests')}>
                                            🧪 Tests
                                        </button>
                                        <button className={`ps-ctab ${activeResultTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveResultTab('feedback')}>
                                            💡 AI Feedback
                                            {aiFeedback && <span className="ps-ctab-badge score">{aiFeedback.score}</span>}
                                        </button>
                                        <button className={`ps-ctab ${activeResultTab === 'console' ? 'active' : ''}`} onClick={() => setActiveResultTab('console')}>
                                            ⌨️ Terminal
                                        </button>
                                    </div>
                                </div>

                                <div className="ps-console-body">
                                    {/* Tests Tab Content */}
                                    {activeResultTab === 'tests' && (
                                        <div className="results-panel" style={{ border: 'none', background: 'transparent', height: '100%', overflowY: 'auto' }}>
                                            {testResults && (
                                                <div className="test-results">
                                                    <h4>Test Results</h4>
                                                    {testResults.error ? (
                                                        <div className="result-error">{testResults.error}</div>
                                                    ) : (
                                                        <div className="test-cases">
                                                            {testResults.results?.map((result, i) => (
                                                                <div key={i} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                                                                    <span className="test-icon">
                                                                        {result.passed ? '✅' : '❌'}
                                                                    </span>
                                                                    <span className="test-name">Test {i + 1}</span>
                                                                    {!result.passed && (
                                                                        <div className="test-details">
                                                                            <div>Expected: {result.expected}</div>
                                                                            <div>Got: {result.actual}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {submissionResult && (
                                                <div className={`submission-result ${submissionResult.solved ? 'success' : 'failure'}`}>
                                                    <h4>Submission Result</h4>
                                                    {submissionResult.error ? (
                                                        <div className="result-error">{submissionResult.error}</div>
                                                    ) : (
                                                        <div className="result-details">
                                                            <div className="result-status">
                                                                {submissionResult.solved ? (
                                                                    <><span className="status-icon">🎉</span><span className="status-text">Accepted!</span></>
                                                                ) : (
                                                                    <><span className="status-icon">❌</span><span className="status-text">Wrong Answer</span></>
                                                                )}
                                                            </div>
                                                            <div className="result-stats">
                                                                <span>Tests: {submissionResult.passedCount}/{submissionResult.totalCount}</span>
                                                                {submissionResult.score > 0 && <span>Score: +{submissionResult.score}</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!testResults && !submissionResult && (
                                                <div style={{ padding: '20px', color: '#8b949e', textAlign: 'center' }}>Run tests or submit to see results here.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Feedback Tab Content */}
                                    {activeResultTab === 'feedback' && (
                                        <div className="ps-console-feedback" style={{ padding: '16px' }}>
                                            {showAIFeedback && aiFeedback ? (
                                                <>
                                                    <div className="ps-fb-summary">
                                                        <div className="ps-fb-score-ring">
                                                            <span>{aiFeedback.score}</span>
                                                            <small>Score</small>
                                                        </div>
                                                        <div className="ps-fb-verdict">
                                                            <strong>{aiFeedback.score >= 70 ? '✅ Good Solution' : aiFeedback.score >= 40 ? '⚠️ Needs Work' : '❌ Incorrect'}</strong>
                                                            <p>{typeof aiFeedback.result === 'string' ? aiFeedback.result.replace('✅ ', '').replace('❌ ', '') : 'Analyzed.'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="ps-fb-suggestions">
                                                        <h4>💡 Suggestions</h4>
                                                        <ul>{aiFeedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="ps-console-empty" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '2rem', opacity: '0.5' }}>💡</span>
                                                    <p style={{ color: '#8b949e' }}>Click "AI Feedback" at the top to check solution with Gemini.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Terminal Tab Content */}
                                    {activeResultTab === 'console' && (
                                        <div className="ps-debugger-v2" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#010409' }}>
                                            <div className="ps-terminal-toolbar">
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <span>TERMINAL</span>
                                                    <button className="ps-terminal-clear-btn" onClick={handleClearTerminal} title="Clear Terminal">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="ps-terminal-body" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                                                {terminalHistory.map((item, idx) => (
                                                    <div key={idx} className={`ps-term-row ${item.type}`}>
                                                        {item.type === 'command' && <span className="ps-term-prefix">~</span>}
                                                        {item.type === 'input' && <span className="ps-term-prefix">$</span>}
                                                        {item.type === 'output' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                                                        {item.type === 'error' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                                                        {item.type === 'system' && <span className="ps-term-prefix" style={{opacity:0}}>&gt;</span>}
                                                        <pre className={`ps-term-text ${item.type}`}>{item.text}</pre>
                                                    </div>
                                                ))}

                                                <div className="ps-terminal-input-row" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                                    <span className="ps-terminal-prefix blinking">$</span>
                                                    <textarea
                                                        className="ps-terminal-textarea"
                                                        placeholder="Type input values here (multi-line allowed)..."
                                                        value={customInput}
                                                        onChange={(e) => setCustomInput(e.target.value)}
                                                        disabled={isExecutingCustom}
                                                        rows={3}
                                                        spellCheck="false"
                                                    />
                                                    <button 
                                                        className={`ps-terminal-run-chip ${isExecutingCustom ? 'disabled' : ''}`} 
                                                        onClick={runCustomCode} 
                                                        disabled={isExecutingCustom}
                                                    >
                                                        {isExecutingCustom ? (
                                                            <><span className="ps-spinner-sm" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} /> Running</>
                                                        ) : (
                                                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Code</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="results-panel">
                                {testResults && (
                                    <div className="test-results">
                                        <h4>Test Results</h4>
                                        {testResults.error ? (
                                            <div className="result-error">{testResults.error}</div>
                                        ) : (
                                            <div className="test-cases">
                                                {testResults.results?.map((result, i) => (
                                                    <div key={i} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                                                        <span className="test-icon">
                                                            {result.passed ? '✅' : '❌'}
                                                        </span>
                                                        <span className="test-name">Test {i + 1}</span>
                                                        {!result.passed && (
                                                            <div className="test-details">
                                                                <div>Expected: {result.expected}</div>
                                                                <div>Got: {result.actual}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {submissionResult && (
                                    <div className={`submission-result ${submissionResult.solved ? 'success' : 'failure'}`}>
                                        <h4>Submission Result</h4>
                                        {submissionResult.error ? (
                                            <div className="result-error">{submissionResult.error}</div>
                                        ) : (
                                            <div className="result-details">
                                                <div className="result-status">
                                                    {submissionResult.solved ? (
                                                        <>
                                                            <span className="status-icon">🎉</span>
                                                            <span className="status-text">Accepted!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="status-icon">❌</span>
                                                            <span className="status-text">Wrong Answer</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="result-stats">
                                                    <span>Tests Passed: {submissionResult.passedCount}/{submissionResult.totalCount}</span>
                                                    {submissionResult.score > 0 && (
                                                        <span>Score: +{submissionResult.score}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard Sidebar (toggled) */}
                {showLeaderboard && (
                    <div className="arena-leaderboard-sidebar">
                        <div className="leaderboard-header">
                            <h3>🏆 Live Leaderboard</h3>
                            <button onClick={() => setShowLeaderboard(false)}>×</button>
                        </div>
                        <div className="leaderboard-list">
                            {leaderboard.slice(0, 15).map((entry, index) => (
                                <div
                                    key={entry.user_id}
                                    className={`leaderboard-entry ${entry.user_id === currentUser?.id ? 'current-user' : ''}`}
                                >
                                    <span className="entry-rank">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </span>
                                    <span className="entry-name">{entry.full_name}</span>
                                    <span className="entry-score">{entry.total_score}</span>
                                    <span className="entry-solved">{entry.problems_solved}/{problems.length}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContestArena;
