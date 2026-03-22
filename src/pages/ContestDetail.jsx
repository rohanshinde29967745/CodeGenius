// ContestDetail.jsx - Contest Details and Leaderboard Page (with Admin Dashboard)
import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { getCurrentUser } from "../services/api";

function ContestDetail({ contestId, setPage }) {
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [leaderboard, setLeaderboard] = useState([]);
    const [adminParticipants, setAdminParticipants] = useState([]);
    const [adminSubmissions, setAdminSubmissions] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [controlLoading, setControlLoading] = useState(false);
    const [controlMsg, setControlMsg] = useState("");
    const [extendMinutes, setExtendMinutes] = useState(15);
    const [confirmAction, setConfirmAction] = useState(null);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const statsInterval = useRef(null);
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === "Admin";

    // Manual problem creation state
    const [showAddProblem, setShowAddProblem] = useState(false);
    const [addProblemLoading, setAddProblemLoading] = useState(false);
    const [newProblem, setNewProblem] = useState({
        title: "", description: "", difficulty: "Medium",
        problem_type: "DSA", points: 200,
        examples: [{ input: "", output: "", explanation: "" }],
        constraints: [""]
    });


    useEffect(() => {
        if (contestId) {
            fetchContestDetails();
            fetchLeaderboard();
            if (isAdmin) {
                fetchAdminStats();
                // Auto-refresh admin stats every 30s
                statsInterval.current = setInterval(fetchAdminStats, 30000);
            }
        }
        return () => clearInterval(statsInterval.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contestId]);


    const fetchContestDetails = async () => {
        setLoading(true);
        try {
            const url = `http://localhost:4000/api/contests/${contestId}${currentUser?.id ? `?userId=${currentUser.id}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();
            console.log("FETCH CONTEST:", data);
            if (data.success) {
                setContest(data.contest);
            } else {
                console.error("Contest fetch failed:", data.error);
            }
        } catch (err) {
            console.error("Failed to fetch contest:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/leaderboard`);
            const data = await res.json();
            if (data.success) setLeaderboard(data.leaderboard || []);
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        }
    };

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/admin/stats`);
            const data = await res.json();
            if (data.success) setAdminStats(data.stats);
        } catch (err) {
            console.error("Failed to fetch admin stats:", err);
        }
    };

    const fetchAdminParticipants = async () => {
        setParticipantsLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/admin/participants?adminId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) setAdminParticipants(data.participants || []);
        } catch (err) {
            console.error("Failed to fetch participants:", err);
        } finally {
            setParticipantsLoading(false);
        }
    };

    const fetchAdminSubmissions = async () => {
        setSubmissionsLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/admin/submissions?adminId=${currentUser.id}&limit=100`);
            const data = await res.json();
            if (data.success) setAdminSubmissions(data.submissions || []);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleAdminControl = async (action) => {
        setControlLoading(true);
        setControlMsg("");
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/admin/control`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: currentUser.id, action, extraMinutes: extendMinutes })
            });
            const data = await res.json();
            if (data.success) {
                setControlMsg(`✅ ${data.message}`);
                fetchContestDetails();
                fetchAdminStats();
            } else {
                setControlMsg(`❌ ${data.error || "Action failed"}`);
            }
        } catch (err) {
            setControlMsg("❌ Failed to apply control");
        } finally {
            setControlLoading(false);
            setConfirmAction(null);
            setTimeout(() => setControlMsg(""), 4000);
        }
    };

    const handleRemoveParticipant = async (targetUserId, name) => {
        if (!window.confirm(`Remove ${name} from this contest?`)) return;
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/admin/remove-participant`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: currentUser.id, targetUserId })
            });
            const data = await res.json();
            if (data.success) {
                setAdminParticipants(prev => prev.filter(p => p.user_id !== targetUserId));
                fetchAdminStats();
            }
        } catch (err) {
            console.error("Failed to remove participant:", err);
        }
    };

    const handleAddProblem = async () => {
        if (!newProblem.title.trim() || !newProblem.description.trim()) {
            setControlMsg("❌ Title and description are required");
            return;
        }
        setAddProblemLoading(true);
        setControlMsg("");
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/problems`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newProblem,
                    constraints: newProblem.constraints.filter(c => c.trim()),
                    examples: newProblem.examples.filter(e => e.input || e.output),
                    test_cases: newProblem.examples
                        .filter(e => e.input || e.output)
                        .map(e => ({ input: e.input, output: e.output, is_hidden: false }))
                })
            });
            const data = await res.json();
            if (data.success) {
                setControlMsg(`✅ Problem "${newProblem.title}" added successfully!`);
                // Reset form
                setNewProblem({
                    title: "", description: "", difficulty: "Medium",
                    problem_type: "DSA", points: 200,
                    examples: [{ input: "", output: "", explanation: "" }],
                    constraints: [""]
                });
                setShowAddProblem(false);
                // Refresh contest to update problem list
                fetchContestDetails();
                fetchAdminStats();
                setTimeout(() => setControlMsg(""), 4000);
            } else {
                setControlMsg(`❌ ${data.error || "Failed to add problem"}`);
            }
        } catch (err) {
            setControlMsg("❌ Failed to add problem");
        } finally {
            setAddProblemLoading(false);
        }
    };

    const handleAddExample = () => {
        setNewProblem(prev => ({
            ...prev,
            examples: [...prev.examples, { input: "", output: "", explanation: "" }]
        }));
    };

    const handleRemoveExample = (idx) => {
        setNewProblem(prev => ({
            ...prev,
            examples: prev.examples.filter((_, i) => i !== idx)
        }));
    };

    const handleExampleChange = (idx, field, val) => {
        setNewProblem(prev => ({
            ...prev,
            examples: prev.examples.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex)
        }));
    };

    const handleAddConstraint = () => {
        setNewProblem(prev => ({ ...prev, constraints: [...prev.constraints, ""] }));
    };

    const handleConstraintChange = (idx, val) => {
        setNewProblem(prev => ({
            ...prev,
            constraints: prev.constraints.map((c, i) => i === idx ? val : c)
        }));
    };

    const handleRegister = async () => {
        if (!currentUser?.id) { alert("Please log in to register"); return; }
        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                // Immediately update local state so button changes to Registered
                setContest(prev => prev ? { ...prev, isRegistered: true } : prev);
                // Also re-fetch to get updated participantCount
                fetchContestDetails();
            } else if (data.error?.includes("already")) {
                // Already registered — just update state
                setContest(prev => prev ? { ...prev, isRegistered: true } : prev);
            } else {
                alert(data.error || "Failed to register");
            }
        } catch (err) {
            console.error("Registration failed:", err);
        }
    };


    const exportCSV = () => {
        const rows = [
            ["Rank", "Name", "Email", "Level", "Score", "Solved", "Submissions", "Joined"],
            ...adminParticipants.map(p => [
                p.rank, p.full_name, p.email, p.current_level,
                p.total_score, p.problems_solved, p.submission_count,
                new Date(p.joined_at).toLocaleString()
            ])
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contest_${contestId}_results.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getTimeStatus = () => {
        if (!contest) return null;
        const now = new Date();
        const start = new Date(contest.start_time);
        const end = new Date(contest.end_time);
        if (now < start) {
            const diff = start - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return { status: "upcoming", text: `Starts in ${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m` };
        } else if (now >= start && now < end) {
            const diff = end - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return { status: "live", text: `Ends in ${hours}h ${minutes}m` };
        } else {
            return { status: "finished", text: "Contest Ended" };
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="rank-badge">🥇</span>;
        if (rank === 2) return <span className="rank-badge">🥈</span>;
        if (rank === 3) return <span className="rank-badge">🥉</span>;
        return <span className="rank-number">#{rank}</span>;
    };

    const formatDateTime = (dateStr) =>
        new Date(dateStr).toLocaleString("en-US", {
            weekday: "long", year: "numeric", month: "long",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        });

    const formatTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    if (loading) {
        return (
            <div className="contest-detail-page loading">
                <div className="loading-spinner"></div>
                <span>Loading contest details...</span>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="contest-detail-page error">
                <span className="error-icon">❌</span>
                <h2>Contest not found</h2>
                <button onClick={() => setPage("contests")}>← Back to Contests</button>
            </div>
        );
    }

    const timeStatus = getTimeStatus();

    // Admin tabs include extra admin-only options
    const tabs = [
        { id: "overview", label: "Overview", icon: "📋" },
        { id: "problems", label: "Problems", icon: "📝" },
        { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
        ...(contest.status === "FINISHED" ? [{ id: "statistics", label: "Statistics", icon: "📊" }] : []),
        ...(isAdmin ? [
            { id: "participants", label: "Participants", icon: "👥", adminOnly: true },
            { id: "submissions_feed", label: "Submissions", icon: "📤", adminOnly: true },
            { id: "controls", label: "Controls", icon: "⚙️", adminOnly: true },
        ] : [])
    ];

    return (
        <div className="contest-detail-page">
            {/* Header */}
            <div className="contest-detail-header">
                <button className="back-btn" onClick={() => setPage("contests")}>
                    <span>←</span> Back to Contests
                </button>

                {/* Admin Live Stats Bar */}
                {isAdmin && adminStats && (
                    <div className="admin-live-bar">
                        <div className="admin-live-label">
                            <span className="admin-live-dot"></span>
                            Admin Dashboard
                        </div>
                        <div className="admin-live-stats">
                            <div className="admin-stat-pill">
                                <span className="asp-icon">👥</span>
                                <div>
                                    <span className="asp-val">{adminStats.participants?.total || 0}</span>
                                    <span className="asp-lbl">Registered</span>
                                </div>
                            </div>
                            <div className="admin-stat-pill">
                                <span className="asp-icon">⚡</span>
                                <div>
                                    <span className="asp-val">{adminStats.participants?.active || 0}</span>
                                    <span className="asp-lbl">Active</span>
                                </div>
                            </div>
                            <div className="admin-stat-pill">
                                <span className="asp-icon">📤</span>
                                <div>
                                    <span className="asp-val">{adminStats.submissions?.total || 0}</span>
                                    <span className="asp-lbl">Submissions</span>
                                </div>
                            </div>
                            <div className="admin-stat-pill accent-green">
                                <span className="asp-icon">✅</span>
                                <div>
                                    <span className="asp-val">{adminStats.submissions?.accepted || 0}</span>
                                    <span className="asp-lbl">Accepted</span>
                                </div>
                            </div>
                            <div className="admin-stat-pill accent-orange">
                                <span className="asp-icon">🔥</span>
                                <div>
                                    <span className="asp-val">{adminStats.submissions?.last5min || 0}</span>
                                    <span className="asp-lbl">Last 5m</span>
                                </div>
                            </div>
                            {adminStats.participants?.disqualified > 0 && (
                                <div className="admin-stat-pill accent-red">
                                    <span className="asp-icon">🚫</span>
                                    <div>
                                        <span className="asp-val">{adminStats.participants.disqualified}</span>
                                        <span className="asp-lbl">DQ'd</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="admin-refresh-btn" onClick={fetchAdminStats} title="Refresh stats">↻</button>
                    </div>
                )}

                <div className="contest-info-section">
                    <div className="contest-badges">
                        <span className={`status-badge ${timeStatus?.status}`}>
                            {timeStatus?.status === "live" && <span className="live-dot"></span>}
                            {contest.status}
                        </span>
                        <span className={`type-badge ${contest.contest_type?.toLowerCase()}`}>
                            {contest.contest_type === "ADMIN" ? "🏆 Official" : "👥 Community"}
                        </span>
                        {contest.visibility === "PRIVATE" && (
                            <span className="private-badge">🔒 Private</span>
                        )}
                    </div>

                    <h1 className="contest-title">{contest.title}</h1>

                    {contest.description && (
                        <p className="contest-description">{contest.description}</p>
                    )}

                    <div className="contest-meta-row">
                        <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <div className="meta-content">
                                <span className="meta-label">Start Time</span>
                                <span className="meta-value">{formatDateTime(contest.start_time)}</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">⏱️</span>
                            <div className="meta-content">
                                <span className="meta-label">Duration</span>
                                <span className="meta-value">{contest.duration_minutes} minutes</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">📝</span>
                            <div className="meta-content">
                                <span className="meta-label">Problems</span>
                                <span className="meta-value">{contest.problems?.length || contest.problem_count || 0}</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">👥</span>
                            <div className="meta-content">
                                <span className="meta-label">Participants</span>
                                <span className="meta-value">{contest.participantCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`time-countdown ${timeStatus?.status}`}>
                        <span className="countdown-icon">
                            {timeStatus?.status === "upcoming" ? "⏰" : timeStatus?.status === "live" ? "🔴" : "✅"}
                        </span>
                        <span className="countdown-text">{timeStatus?.text}</span>
                    </div>

                    <div className="contest-actions">
                        {contest.status === "UPCOMING" && !contest.isRegistered && (
                            <button className="register-btn primary" onClick={handleRegister}>
                                <span>📝</span> Register Now
                            </button>
                        )}
                        {contest.status === "UPCOMING" && contest.isRegistered && (
                            <div className="registered-badge"><span>✅</span> You're registered!</div>
                        )}
                        {contest.status === "LIVE" && contest.isRegistered && (
                            <button className="join-btn primary" onClick={() => setPage({ name: "contestArena", contestId: contest.id })}>
                                <span>🚀</span> Enter Contest Arena
                            </button>
                        )}
                        {contest.status === "LIVE" && !contest.isRegistered && !isAdmin && (
                            <button className="register-btn primary" onClick={handleRegister}>
                                <span>📝</span> Register & Join
                            </button>
                        )}
                        {contest.status === "FINISHED" && (
                            <button className="practice-btn" onClick={() => setPage({ name: "contestPractice", contestId: contest.id })}>
                                <span>🎯</span> Practice Mode
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="contest-detail-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`detail-tab ${activeTab === tab.id ? "active" : ""} ${tab.adminOnly ? "admin-tab" : ""}`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id === "participants") fetchAdminParticipants();
                            if (tab.id === "submissions_feed") fetchAdminSubmissions();
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                        {tab.adminOnly && <span className="admin-tab-badge">Admin</span>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="contest-detail-content">

                {/* Overview */}
                {activeTab === "overview" && (
                    <div className="overview-content">
                        <div className="info-cards">
                            <div className="info-card">
                                <h3>📋 Contest Rules</h3>
                                <ul>
                                    <li>You have {contest.duration_minutes} minutes to solve {contest.problems?.length || contest.problem_count} problems</li>
                                    <li>Each problem has a point value based on difficulty</li>
                                    <li>Penalty time is calculated for incorrect submissions</li>
                                    <li>Rankings are determined by total score, then by penalty time</li>
                                    <li>Do not switch tabs/windows during the contest</li>
                                </ul>
                            </div>
                            <div className="info-card">
                                <h3>🏅 Scoring</h3>
                                <div className="scoring-grid">
                                    <div className="score-item"><span className="diff easy">Easy</span><span className="points">100 pts</span></div>
                                    <div className="score-item"><span className="diff medium">Medium</span><span className="points">200 pts</span></div>
                                    <div className="score-item"><span className="diff hard">Hard</span><span className="points">300 pts</span></div>
                                </div>
                            </div>
                            <div className="info-card">
                                <h3>💻 Languages</h3>
                                <div className="languages-list">
                                    {(contest.languages || ["JavaScript", "Python", "C++", "Java"]).map((lang, i) => (
                                        <span key={i} className="lang-badge">{lang}</span>
                                    ))}
                                </div>
                            </div>
                            {contest.creator_name && (
                                <div className="info-card">
                                    <h3>👤 Created By</h3>
                                    <div className="creator-info">
                                        <span className="creator-avatar">{contest.creator_name.charAt(0)}</span>
                                        <div className="creator-details">
                                            <span className="creator-name">{contest.creator_name}</span>
                                            {contest.creator_level && (
                                                <span className={`creator-level ${contest.creator_level.toLowerCase()}`}>{contest.creator_level}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Problems */}
                {activeTab === "problems" && (
                    <div className="problems-content">
                        {contest.status === "UPCOMING" ? (
                            <div className="problems-hidden">
                                <span className="lock-icon">🔒</span>
                                <h3>Problems Hidden</h3>
                                <p>Problems will be revealed when the contest starts</p>
                            </div>
                        ) : (
                            <div className="problems-list">
                                {contest.problems?.map((problem, index) => (
                                    <div key={problem.id} className="problem-row"
                                        onClick={() => {
                                            if (contest.status === "LIVE") {
                                                setPage({ name: "contestArena", contestId: contest.id, problemId: problem.id });
                                            }
                                        }}>
                                        <span className="problem-index">#{index + 1}</span>
                                        <div className="problem-info">
                                            <h4 className="problem-title">{problem.title}</h4>
                                            {problem.description && (
                                                <p className="problem-preview">{problem.description.substring(0, 100)}...</p>
                                            )}
                                        </div>
                                        <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
                                        <span className="points-badge">{problem.points} pts</span>
                                        <div className="problem-stats">
                                            <span className="solve-count">✅ {problem.solve_count || 0} solved</span>
                                            <span className="attempt-count">📤 {problem.attempt_count || 0} attempts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard */}
                {activeTab === "leaderboard" && (
                    <div className="leaderboard-content">
                        {leaderboard.length === 0 ? (
                            <div className="empty-leaderboard">
                                <span className="empty-icon">🏆</span>
                                <h3>No submissions yet</h3>
                                <p>Be the first to submit a solution!</p>
                            </div>
                        ) : (
                            <div className="leaderboard-table">
                                <div className="leaderboard-header">
                                    <span className="col-rank">Rank</span>
                                    <span className="col-user">User</span>
                                    <span className="col-score">Score</span>
                                    <span className="col-solved">Solved</span>
                                    <span className="col-penalty">Penalty</span>
                                </div>
                                {leaderboard.map((entry, index) => (
                                    <div key={entry.user_id}
                                        className={`leaderboard-row ${currentUser?.id === entry.user_id ? "current-user" : ""} ${index < 3 ? "top-three" : ""}`}>
                                        <span className="col-rank">{getRankBadge(entry.rank || index + 1)}</span>
                                        <span className="col-user">
                                            <span className="user-avatar">{entry.full_name?.charAt(0) || "?"}</span>
                                            <span className="user-info">
                                                <span className="user-name">{entry.full_name}</span>
                                                <span className={`user-level ${entry.current_level?.toLowerCase()}`}>{entry.current_level}</span>
                                            </span>
                                        </span>
                                        <span className="col-score">{entry.total_score}</span>
                                        <span className="col-solved">{entry.problems_solved}/{contest.problems?.length || 5}</span>
                                        <span className="col-penalty">{entry.penalty_time}m</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Statistics */}
                {activeTab === "statistics" && contest.status === "FINISHED" && (
                    <div className="statistics-content">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value">{contest.participantCount || 0}</span>
                                <span className="stat-label">Total Participants</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{leaderboard.filter(e => e.problems_solved > 0).length}</span>
                                <span className="stat-label">Solved at least 1</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{leaderboard.filter(e => e.problems_solved === (contest.problems?.length || 5)).length}</span>
                                <span className="stat-label">Perfect Score</span>
                            </div>
                        </div>
                        <div className="problem-stats-section">
                            <h3>Problem Statistics</h3>
                            <div className="problem-stats-grid">
                                {contest.problems?.map((problem, index) => (
                                    <div key={problem.id} className="problem-stat-card">
                                        <div className="pstat-header">
                                            <span className="pstat-index">#{index + 1}</span>
                                            <span className="pstat-title">{problem.title}</span>
                                        </div>
                                        <div className="pstat-bar">
                                            <div className="pstat-fill" style={{
                                                width: `${contest.participantCount ? (problem.solve_count / contest.participantCount * 100) : 0}%`
                                            }}></div>
                                        </div>
                                        <div className="pstat-numbers">
                                            <span>{problem.solve_count || 0} solved</span>
                                            <span>{problem.attempt_count || 0} attempts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================= ADMIN TABS ========================= */}

                {/* Admin: Participants */}
                {activeTab === "participants" && isAdmin && (
                    <div className="admin-tab-content">
                        <div className="admin-section-header">
                            <div>
                                <h2 className="admin-section-title">👥 Participants Manager</h2>
                                <p className="admin-section-subtitle">
                                    {adminParticipants.length} registered • {adminParticipants.filter(p => p.problems_solved > 0).length} active
                                </p>
                            </div>
                            <div className="admin-section-actions">
                                <button className="adm-btn secondary" onClick={fetchAdminParticipants}>↻ Refresh</button>
                                {adminParticipants.length > 0 && (
                                    <button className="adm-btn primary" onClick={exportCSV}>📤 Export CSV</button>
                                )}
                            </div>
                        </div>

                        {participantsLoading ? (
                            <div className="admin-loading"><div className="loading-spinner"></div><span>Loading participants...</span></div>
                        ) : adminParticipants.length === 0 ? (
                            <div className="admin-empty"><span>👥</span><p>No participants yet. Click Refresh above.</p></div>
                        ) : (
                            <div className="admin-participants-table">
                                <div className="apt-header">
                                    <span>Rank</span><span>Participant</span><span>Level</span>
                                    <span>Score</span><span>Solved</span><span>Submissions</span>
                                    <span>Joined</span><span>Status</span><span>Action</span>
                                </div>
                                {adminParticipants.map((p) => (
                                    <div key={p.user_id} className={`apt-row ${p.is_disqualified ? "disqualified" : ""}`}>
                                        <span className="apt-rank">{getRankBadge(p.rank)}</span>
                                        <span className="apt-user">
                                            <span className="apt-avatar">{p.full_name?.charAt(0)}</span>
                                            <span className="apt-name-block">
                                                <span className="apt-name">{p.full_name}</span>
                                                <span className="apt-email">{p.email}</span>
                                            </span>
                                        </span>
                                        <span>
                                            <span className={`user-level ${p.current_level?.toLowerCase()}`}>{p.current_level}</span>
                                        </span>
                                        <span className="apt-score">{p.total_score || 0}</span>
                                        <span className="apt-solved">{p.problems_solved || 0}</span>
                                        <span className="apt-subs">{p.submission_count || 0}</span>
                                        <span className="apt-joined">{p.joined_at ? formatTimeAgo(p.joined_at) : "—"}</span>
                                        <span>
                                            {p.is_disqualified ? (
                                                <span className="status-pill red">🚫 DQ'd</span>
                                            ) : p.warnings > 0 ? (
                                                <span className="status-pill orange">⚠️ {p.warnings} warn</span>
                                            ) : (
                                                <span className="status-pill green">✅ OK</span>
                                            )}
                                        </span>
                                        <span>
                                            <button
                                                className="adm-remove-btn"
                                                onClick={() => handleRemoveParticipant(p.user_id, p.full_name)}
                                                title="Remove participant"
                                            >✕</button>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Admin: Submissions Feed */}
                {activeTab === "submissions_feed" && isAdmin && (
                    <div className="admin-tab-content">
                        <div className="admin-section-header">
                            <div>
                                <h2 className="admin-section-title">📤 Live Submissions Feed</h2>
                                <p className="admin-section-subtitle">All submissions across this contest</p>
                            </div>
                            <button className="adm-btn secondary" onClick={fetchAdminSubmissions}>↻ Refresh</button>
                        </div>

                        {submissionsLoading ? (
                            <div className="admin-loading"><div className="loading-spinner"></div><span>Loading submissions...</span></div>
                        ) : adminSubmissions.length === 0 ? (
                            <div className="admin-empty"><span>📤</span><p>No submissions yet. Click Refresh above.</p></div>
                        ) : (
                            <div className="submissions-feed">
                                {adminSubmissions.map((sub) => (
                                    <div key={sub.id} className={`submission-feed-row ${sub.is_accepted ? "accepted" : "rejected"}`}>
                                        <div className="sfr-status">
                                            {sub.is_accepted ? (
                                                <span className="sfr-badge green">✅ AC</span>
                                            ) : (
                                                <span className="sfr-badge red">❌ WA</span>
                                            )}
                                        </div>
                                        <div className="sfr-user">
                                            <span className="sfr-avatar">{sub.full_name?.charAt(0)}</span>
                                            <span className="sfr-name">{sub.full_name}</span>
                                        </div>
                                        <div className="sfr-problem">
                                            <span className="sfr-prob-title">{sub.problem_title}</span>
                                            <span className={`difficulty-badge ${sub.difficulty?.toLowerCase()}`}>{sub.difficulty}</span>
                                        </div>
                                        <div className="sfr-meta">
                                            <span className="sfr-lang">{sub.language}</span>
                                            <span className="sfr-tests">{sub.passed_tests}/{sub.total_tests} tests</span>
                                        </div>
                                        {sub.score > 0 && <span className="sfr-score">+{sub.score} pts</span>}
                                        <span className="sfr-time">{formatTimeAgo(sub.submitted_at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Admin: Controls */}
                {activeTab === "controls" && isAdmin && (
                    <div className="admin-tab-content">
                        <h2 className="admin-section-title">⚙️ Contest Controls</h2>
                        <p className="admin-section-subtitle">Manage the state and flow of this contest</p>

                        {controlMsg && (
                            <div className={`control-msg ${controlMsg.startsWith("✅") ? "success" : "error"}`}>
                                {controlMsg}
                            </div>
                        )}

                        <div className="controls-grid">
                            {/* Start Early */}
                            {contest.status === "UPCOMING" && (
                                <div className="control-card">
                                    <div className="control-card-icon">🟢</div>
                                    <h3>Start Early</h3>
                                    <p>Begin the contest immediately instead of waiting for the scheduled start time.</p>
                                    {confirmAction === "start_early" ? (
                                        <div className="confirm-block">
                                            <span>Are you sure?</span>
                                            <div className="confirm-btns">
                                                <button className="adm-btn danger" onClick={() => handleAdminControl("start_early")} disabled={controlLoading}>
                                                    {controlLoading ? "Starting..." : "Yes, Start Now"}
                                                </button>
                                                <button className="adm-btn secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="adm-btn success" onClick={() => setConfirmAction("start_early")}>
                                            🟢 Start Contest Now
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Extend Time */}
                            {contest.status === "LIVE" && (
                                <div className="control-card">
                                    <div className="control-card-icon">⏱️</div>
                                    <h3>Extend Time</h3>
                                    <p>Add extra minutes to the contest duration for all participants.</p>
                                    <div className="extend-input-row">
                                        <select
                                            value={extendMinutes}
                                            onChange={e => setExtendMinutes(parseInt(e.target.value))}
                                            className="extend-select"
                                        >
                                            <option value={5}>+5 minutes</option>
                                            <option value={10}>+10 minutes</option>
                                            <option value={15}>+15 minutes</option>
                                            <option value={30}>+30 minutes</option>
                                            <option value={60}>+60 minutes</option>
                                        </select>
                                    </div>
                                    {confirmAction === "extend" ? (
                                        <div className="confirm-block">
                                            <span>Extend by {extendMinutes} min?</span>
                                            <div className="confirm-btns">
                                                <button className="adm-btn warning" onClick={() => handleAdminControl("extend")} disabled={controlLoading}>
                                                    {controlLoading ? "Extending..." : "Yes, Extend"}
                                                </button>
                                                <button className="adm-btn secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="adm-btn warning" onClick={() => setConfirmAction("extend")}>
                                            ⏱️ Extend Duration
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* End Now */}
                            {contest.status === "LIVE" && (
                                <div className="control-card danger-card">
                                    <div className="control-card-icon">🔴</div>
                                    <h3>End Contest Now</h3>
                                    <p>Immediately end the contest and freeze the leaderboard. This cannot be undone.</p>
                                    {confirmAction === "end_now" ? (
                                        <div className="confirm-block">
                                            <span>⚠️ This will end the contest for everyone!</span>
                                            <div className="confirm-btns">
                                                <button className="adm-btn danger" onClick={() => handleAdminControl("end_now")} disabled={controlLoading}>
                                                    {controlLoading ? "Ending..." : "Yes, End Contest"}
                                                </button>
                                                <button className="adm-btn secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="adm-btn danger" onClick={() => setConfirmAction("end_now")}>
                                            🔴 End Contest Now
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Export Results */}
                            <div className="control-card">
                                <div className="control-card-icon">📤</div>
                                <h3>Export Results</h3>
                                <p>Download the full leaderboard and participant data as a CSV file.</p>
                                <button className="adm-btn primary" onClick={() => {
                                    if (adminParticipants.length === 0) {
                                        fetchAdminParticipants().then(() => setTimeout(exportCSV, 500));
                                    } else {
                                        exportCSV();
                                    }
                                }}>
                                    📤 Download CSV
                                </button>
                            </div>

                            {/* Add Problem Manually */}
                            <div className="control-card">
                                <div className="control-card-icon">📝</div>
                                <h3>Add Problem Manually</h3>
                                <p>Create a custom problem directly — set your own title, description, difficulty, and examples.</p>
                                {!showAddProblem ? (
                                    <button className="adm-btn primary" onClick={() => setShowAddProblem(true)}>
                                        ➕ Add New Problem
                                    </button>
                                ) : (
                                    <div className="add-problem-form">
                                        <div className="apf-row">
                                            <label>Title *</label>
                                            <input className="apf-input" value={newProblem.title}
                                                onChange={e => setNewProblem(p => ({ ...p, title: e.target.value }))}
                                                placeholder="e.g. Two Sum" />
                                        </div>
                                        <div className="apf-row">
                                            <label>Description *</label>
                                            <textarea className="apf-input apf-textarea" value={newProblem.description}
                                                onChange={e => setNewProblem(p => ({ ...p, description: e.target.value }))}
                                                placeholder="Describe the problem clearly..." rows={4} />
                                        </div>
                                        <div className="apf-row-3">
                                            <div>
                                                <label>Difficulty</label>
                                                <select className="apf-select" value={newProblem.difficulty}
                                                    onChange={e => setNewProblem(p => ({
                                                        ...p, difficulty: e.target.value,
                                                        points: e.target.value === "Easy" ? 100 : e.target.value === "Medium" ? 200 : 300
                                                    }))}>
                                                    <option>Easy</option>
                                                    <option>Medium</option>
                                                    <option>Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label>Type</label>
                                                <select className="apf-select" value={newProblem.problem_type}
                                                    onChange={e => setNewProblem(p => ({ ...p, problem_type: e.target.value }))}>
                                                    {["DSA", "Array", "String", "Dynamic Programming", "Graph", "Tree", "Math", "Sorting", "Searching", "Recursion"].map(t => (
                                                        <option key={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label>Points</label>
                                                <input className="apf-input" type="number" min={50} max={500} step={50}
                                                    value={newProblem.points}
                                                    onChange={e => setNewProblem(p => ({ ...p, points: parseInt(e.target.value) || 100 }))} />
                                            </div>
                                        </div>

                                        <div className="apf-section">
                                            <div className="apf-section-header">
                                                <label>Examples</label>
                                                <button className="apf-tiny-btn" onClick={handleAddExample}>+ Add</button>
                                            </div>
                                            {newProblem.examples.map((ex, idx) => (
                                                <div key={idx} className="apf-example">
                                                    <div className="apf-ex-row">
                                                        <span className="apf-ex-label">In</span>
                                                        <input className="apf-input" value={ex.input}
                                                            onChange={e => handleExampleChange(idx, "input", e.target.value)}
                                                            placeholder="Input" />
                                                    </div>
                                                    <div className="apf-ex-row">
                                                        <span className="apf-ex-label">Out</span>
                                                        <input className="apf-input" value={ex.output}
                                                            onChange={e => handleExampleChange(idx, "output", e.target.value)}
                                                            placeholder="Expected Output" />
                                                    </div>
                                                    {newProblem.examples.length > 1 && (
                                                        <button className="apf-remove-btn" onClick={() => handleRemoveExample(idx)}>✕</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="apf-section">
                                            <div className="apf-section-header">
                                                <label>Constraints</label>
                                                <button className="apf-tiny-btn" onClick={handleAddConstraint}>+ Add</button>
                                            </div>
                                            {newProblem.constraints.map((c, idx) => (
                                                <input key={idx} className="apf-input" value={c}
                                                    onChange={e => handleConstraintChange(idx, e.target.value)}
                                                    placeholder={`e.g. 1 ≤ n ≤ 10^5`} />
                                            ))}
                                        </div>

                                        <div className="apf-actions">
                                            <button className="adm-btn secondary" onClick={() => setShowAddProblem(false)}>Cancel</button>
                                            <button className="adm-btn primary" onClick={handleAddProblem} disabled={addProblemLoading}>
                                                {addProblemLoading ? "Adding..." : "✅ Save Problem"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Export Results */}
                            <div className="control-card">
                                <div className="control-card-icon">📤</div>
                                <h3>Export Results</h3>
                                <p>Download the full leaderboard and participant data as a CSV file.</p>
                                <button className="adm-btn primary" onClick={() => {
                                    if (adminParticipants.length === 0) {
                                        fetchAdminParticipants().then(() => setTimeout(exportCSV, 500));
                                    } else {
                                        exportCSV();
                                    }
                                }}>
                                    📤 Download CSV
                                </button>
                            </div>

                            {/* Contest Info */}
                            <div className="control-card info-card-admin">
                                <div className="control-card-icon">ℹ️</div>
                                <h3>Contest Info</h3>
                                <div className="control-info-grid">
                                    <span className="ci-label">Status</span>
                                    <span className={`status-badge ${timeStatus?.status}`}>{contest.status}</span>
                                    <span className="ci-label">Type</span>
                                    <span>{contest.contest_type === "ADMIN" ? "🏆 Official" : "👥 Community"}</span>
                                    <span className="ci-label">Duration</span>
                                    <span>{contest.duration_minutes} min</span>
                                    <span className="ci-label">Problems</span>
                                    <span>{contest.problems?.length || 0}</span>
                                    <span className="ci-label">Registered</span>
                                    <span>{contest.participantCount || 0} users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ContestDetail;
