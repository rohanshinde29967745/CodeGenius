// ContestList.jsx - Weekly Contests List Page
import React, { useState, useEffect } from "react";
import "../App.css";
import { getCurrentUser } from "../services/api";

function ContestList({ setPage }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // all, upcoming, live, past
    const [cardStatus, setCardStatus] = useState(null);
    const [showCardModal, setShowCardModal] = useState(false);
    const currentUser = getCurrentUser();

    useEffect(() => {
        fetchContests();
        if (currentUser?.id) {
            checkCardEligibility();
        }
    }, [activeTab]);

    const fetchContests = async () => {
        setLoading(true);
        try {
            let url = "http://localhost:4000/api/contests";
            const params = new URLSearchParams();

            if (activeTab === "upcoming") params.append("status", "UPCOMING");
            else if (activeTab === "live") params.append("status", "LIVE");
            else if (activeTab === "past") params.append("status", "FINISHED");

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setContests(data.contests || []);
            }
        } catch (err) {
            console.error("Failed to fetch contests:", err);
        } finally {
            setLoading(false);
        }
    };

    const checkCardEligibility = async () => {
        try {
            const res = await fetch(`http://localhost:4000/api/contests/check-card/${currentUser.id}`);
            const data = await res.json();
            setCardStatus(data);
        } catch (err) {
            console.error("Failed to check card:", err);
        }
    };

    const claimCard = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/contests/claim-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                setCardStatus({ ...cardStatus, hasActiveCard: true, expiresAt: data.card.expiresAt });
                setShowCardModal(false);
                alert(data.message);
            } else {
                alert(data.error || "Failed to claim card");
            }
        } catch (err) {
            console.error("Failed to claim card:", err);
        }
    };

    const handleRegister = async (contestId) => {
        if (!currentUser?.id) {
            alert("Please log in to register");
            return;
        }

        try {
            const res = await fetch(`http://localhost:4000/api/contests/${contestId}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                fetchContests(); // Refresh list
                alert("Successfully registered!");
            } else {
                alert(data.error || "Failed to register");
            }
        } catch (err) {
            console.error("Registration failed:", err);
        }
    };

    const getTimeRemaining = (startTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = start - now;

        if (diff <= 0) return "Started";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "LIVE": return "status-live";
            case "UPCOMING": return "status-upcoming";
            case "FINISHED": return "status-finished";
            default: return "";
        }
    };

    const getDifficultyBadge = (mix) => {
        if (!mix) return null;
        const parts = mix.split(",");
        return (
            <div className="contest-difficulty-badges">
                {parts.map((p, i) => {
                    const [count, level] = p.trim().split("-");
                    return (
                        <span key={i} className={`diff-badge ${level?.toLowerCase()}`}>
                            {count} {level}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="contest-list-page">
            {/* Header */}
            <div className="contest-header">
                <div className="contest-header-left">
                    <h1 className="contest-page-title">
                        <span className="title-icon">🏆</span>
                        Weekly Contests
                    </h1>
                    <p className="contest-subtitle">
                        Compete with developers worldwide and earn badges
                    </p>
                </div>
                <div className="contest-header-right">
                    {/* Contest Creation Card Status */}
                    {currentUser && (
                        <div className="contest-card-status">
                            {currentUser.role === "Admin" ? (
                                <div className="card-active admin-card">
                                    <span className="card-icon">🏆</span>
                                    <div className="card-info">
                                        <span className="card-label">Admin Control</span>
                                        <span className="card-expires">Official Host Access</span>
                                    </div>
                                    <button
                                        className="create-contest-btn admin-theme"
                                        onClick={() => setPage("createContest")}
                                    >
                                        <span>+</span> Create Official Contest
                                    </button>
                                </div>
                            ) : cardStatus?.hasActiveCard ? (
                                <div className="card-active">
                                    <span className="card-icon">🎴</span>
                                    <div className="card-info">
                                        <span className="card-label">Creation Card Active</span>
                                        <span className="card-expires">
                                            Expires: {new Date(cardStatus.expiresAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <button
                                        className="create-contest-btn"
                                        onClick={() => setPage("createContest")}
                                    >
                                        <span>+</span> Create Contest
                                    </button>
                                </div>
                            ) : cardStatus?.eligible ? (
                                <button
                                    className="claim-card-btn"
                                    onClick={() => setShowCardModal(true)}
                                >
                                    <span className="card-icon">🎴</span>
                                    Claim Creation Card
                                </button>
                            ) : (
                                <div className="card-locked-v2" onClick={() => alert("To host contests, you must reach Silver Level and solve 20 Medium problems. \n\nYou are halfway there! Keep solving!")}>
                                    <div className="card-locked-header">
                                        <div className="card-unlock-percent">
                                            {Math.round(Math.min(100, ((cardStatus?.mediumSolved || 0) / 20) * 100))}%
                                        </div>
                                        <div className="card-locked-text">
                                            <span className="locked-title">Unlock Hosting</span>
                                            <span className="locked-subtitle">Progress to Creation Card</span>
                                        </div>
                                    </div>

                                    <div className="card-progress-section">
                                        <div className="progress-labels">
                                            <span>Medium Efficiency</span>
                                            <span className="count-badge">{cardStatus?.mediumSolved || 0} / 20 Solved</span>
                                        </div>
                                        <div className="card-progress-bg">
                                            <div
                                                className="card-progress-fill"
                                                style={{ width: `${Math.min(100, ((cardStatus?.mediumSolved || 0) / 20) * 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="level-requirement">
                                            <span className={`requirement-dot ${cardStatus?.levelMet ? 'met' : ''}`}></span>
                                            <span className="requirement-text">
                                                {cardStatus?.levelMet ? "✓ Silver Level Achieved" : "Reach Silver Level Requirements"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reward Preview if > 50% */}
                                    {((cardStatus?.mediumSolved || 0) / 20) >= 0.5 && (
                                        <div className="card-preview-glimpse">
                                            <small>Reward Preview Unlocked</small>
                                            <span className="glimpse-icon">🎴</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="contest-tabs">
                <button
                    className={`contest-tab ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                >
                    <span className="tab-icon">📋</span> All Contests
                </button>
                <button
                    className={`contest-tab ${activeTab === "live" ? "active" : ""}`}
                    onClick={() => setActiveTab("live")}
                >
                    <span className="tab-icon live-dot">🔴</span> Live Now
                </button>
                <button
                    className={`contest-tab ${activeTab === "upcoming" ? "active" : ""}`}
                    onClick={() => setActiveTab("upcoming")}
                >
                    <span className="tab-icon">⏰</span> Upcoming
                </button>
                <button
                    className={`contest-tab ${activeTab === "past" ? "active" : ""}`}
                    onClick={() => setActiveTab("past")}
                >
                    <span className="tab-icon">📜</span> Past Contests
                </button>
            </div>

            {/* Contest Grid */}
            <div className="contest-grid">
                {loading ? (
                    <div className="contest-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading contests...</span>
                    </div>
                ) : contests.length === 0 ? (
                    <div className="contest-empty">
                        <span className="empty-icon">🏟️</span>
                        <h3>No contests found</h3>
                        <p>Check back later for upcoming contests!</p>
                    </div>
                ) : (
                    contests.map(contest => (
                        <div
                            key={contest.id}
                            className={`contest-card ${contest.status?.toLowerCase()}`}
                            onClick={() => setPage({ name: "contestDetail", contestId: contest.id })}
                        >
                            {/* Status Badge */}
                            <div className={`contest-status-badge ${getStatusClass(contest.status)}`}>
                                {contest.status === "LIVE" && <span className="live-indicator"></span>}
                                {contest.status}
                            </div>

                            {/* Contest Type Badge */}
                            <div className={`contest-type-badge ${contest.contest_type?.toLowerCase()}`}>
                                {contest.contest_type === "ADMIN" ? "🏆 Official" : "👥 Community"}
                            </div>

                            {/* Contest Info */}
                            <div className="contest-card-content">
                                <h3 className="contest-title">{contest.title}</h3>

                                {contest.description && (
                                    <p className="contest-description">
                                        {contest.description.substring(0, 100)}...
                                    </p>
                                )}

                                {/* Contest Meta */}
                                <div className="contest-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span>{formatDateTime(contest.start_time)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">⏱️</span>
                                        <span>{contest.duration_minutes || 90} min</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">📝</span>
                                        <span>{contest.problem_count || 5} Problems</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">👥</span>
                                        <span>{contest.participant_count || 0} Registered</span>
                                    </div>
                                </div>

                                {/* Difficulty Mix */}
                                {contest.difficulty_mix && getDifficultyBadge(contest.difficulty_mix)}

                                {/* Languages */}
                                {contest.languages && (
                                    <div className="contest-languages">
                                        {contest.languages.map((lang, i) => (
                                            <span key={i} className="lang-tag">{lang}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Creator Info */}
                                {contest.creator_name && (
                                    <div className="contest-creator">
                                        <span className="creator-label">By:</span>
                                        <span className="creator-name">{contest.creator_name}</span>
                                        {contest.creator_level && (
                                            <span className={`creator-level ${contest.creator_level.toLowerCase()}`}>
                                                {contest.creator_level}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="contest-card-footer">
                                {contest.status === "UPCOMING" && (
                                    <>
                                        <div className="time-remaining">
                                            <span className="time-label">Starts in:</span>
                                            <span className="time-value">{getTimeRemaining(contest.start_time)}</span>
                                        </div>
                                        <button
                                            className="register-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegister(contest.id);
                                            }}
                                        >
                                            Register
                                        </button>
                                    </>
                                )}
                                {contest.status === "LIVE" && (
                                    <button
                                        className="join-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPage({ name: "contestArena", contestId: contest.id });
                                        }}
                                    >
                                        <span>🚀</span> Join Contest
                                    </button>
                                )}
                                {contest.status === "FINISHED" && (
                                    <div className="contest-finished-actions">
                                        <button
                                            className="view-results-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPage({ name: "contestDetail", contestId: contest.id });
                                            }}
                                        >
                                            View Results
                                        </button>
                                        <button
                                            className="practice-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPage({ name: "contestPractice", contestId: contest.id });
                                            }}
                                        >
                                            Practice
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Claim Card Modal */}
            {showCardModal && (
                <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
                    <div className="claim-card-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowCardModal(false)}>×</button>

                        <div className="card-modal-content">
                            <div className="card-visual">
                                <div className="creation-card">
                                    <div className="card-glow"></div>
                                    <div className="card-inner">
                                        <span className="card-emoji">🎴</span>
                                        <h3>Contest Creation Card</h3>
                                        <div className="card-validity">
                                            Valid for {cardStatus?.validityHours || 6} hours
                                        </div>
                                        <div className="card-level">
                                            {cardStatus?.userLevel || "Silver"}+ Level
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-modal-info">
                                <h2>🎉 Congratulations!</h2>
                                <p>You're eligible to claim a Contest Creation Card!</p>

                                <div className="eligibility-details">
                                    <div className="eligibility-item">
                                        <span className="check">✅</span>
                                        <span>{cardStatus?.mediumSolved || 20}+ Medium problems solved</span>
                                    </div>
                                    <div className="eligibility-item">
                                        <span className="check">✅</span>
                                        <span>{cardStatus?.userLevel} level achieved</span>
                                    </div>
                                </div>

                                <div className="card-benefits">
                                    <h4>With this card you can:</h4>
                                    <ul>
                                        <li>Create your own contests</li>
                                        <li>Invite friends or make it global</li>
                                        <li>Auto-generate problems with AI</li>
                                        <li>Earn special badges</li>
                                    </ul>
                                </div>

                                <button className="claim-btn" onClick={claimCard}>
                                    <span>🎴</span> Claim Card Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContestList;
