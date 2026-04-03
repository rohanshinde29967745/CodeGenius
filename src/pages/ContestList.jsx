import React, { useState, useEffect } from "react";
import "../App.css"; // Keep original globals
import "./ContestList.css"; // The new scoped CSS
import { getCurrentUser } from "../services/api";

function ContestList({ setPage }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("live"); // live (active), upcoming, past
    const [cardStatus, setCardStatus] = useState(null);
    const [showCardModal, setShowCardModal] = useState(false);
    const [featuredContest, setFeaturedContest] = useState(null);
    const currentUser = getCurrentUser();

    useEffect(() => {
        fetchFeaturedContest();
    }, []);

    const fetchFeaturedContest = async () => {
        try {
            // Priority 1: Check Live
            let res = await fetch("http://localhost:4000/api/contests?status=LIVE");
            let data = await res.json();
            if (data.success && data.contests && data.contests.length > 0) {
                setFeaturedContest(data.contests[0]);
                return;
            }
            // Priority 2: Check Upcoming
            res = await fetch("http://localhost:4000/api/contests?status=UPCOMING");
            data = await res.json();
            if (data.success && data.contests && data.contests.length > 0) {
                const sorted = data.contests.sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
                setFeaturedContest(sorted[0]);
                return;
            }
            setFeaturedContest(null);
        } catch(err) {
            console.error("Failed to fetch featured:", err);
        }
    };

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
                fetchContests();
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

        if (days > 0) return `Starts in ${days} days`;
        if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
        return `Starts in ${minutes}m`;
    };

    // Helper functions for the UI
    const getOverallDifficulty = (mix) => {
        if (!mix) return { label: "Medium", stars: "★★☆", color: "yellow" };
        if (mix.includes("Hard")) return { label: "Hard", stars: "★★★", color: "red" };
        if (mix.includes("Medium")) return { label: "Medium", stars: "★★☆", color: "yellow" };
        return { label: "Easy", stars: "★☆☆", color: "green" };
    };

    return (
        <div className="wc-page">
            
            {/* 1. HEADER SECTION */}
            <div className="wc-header">
                <div className="wc-header-left">
                    <h1 className="wc-title">Weekly Contests</h1>
                    <p className="wc-subtitle">Compete in weekly programming contests to test and improve your coding skills!</p>
                </div>
                
                {/* Embedded Card Status Logic (Restyled cleanly) */}
                <div className="wc-header-right">
                    {currentUser && (
                        <div className="wc-creator-status">
                            {currentUser.role === "Admin" ? (
                                <button className="wc-create-btn admin" onClick={() => setPage("createContest")}>
                                    🏆 Create Official Contest
                                </button>
                            ) : cardStatus?.hasActiveCard ? (
                                <button className="wc-create-btn" onClick={() => setPage("createContest")}>
                                    🎴 Create Contest (Active)
                                </button>
                            ) : cardStatus?.eligible ? (
                                <button className="wc-create-btn claim" onClick={() => setShowCardModal(true)}>
                                    🎴 Claim Creation Card
                                </button>
                            ) : (
                                <div className="wc-locked-status" onClick={() => alert("To host contests, you must reach Silver Level and solve 20 Medium problems. Keep solving!")}>
                                    <div className="wc-locked-info">
                                        <span>Unlock Hosting</span>
                                        <div className="wc-locked-bar">
                                            <div className="wc-locked-fill" style={{ width: `${Math.min(100, ((cardStatus?.mediumSolved || 0) / 20) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <span className="wc-locked-pct">{Math.round(Math.min(100, ((cardStatus?.mediumSolved || 0) / 20) * 100))}%</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. HERO SECTION (Dynamic Featured Contest) */}
            <div className="wc-hero">
                {featuredContest ? (
                    <>
                        <div className="wc-hero-left">
                            <div className="wc-hero-icon">🏆</div>
                            <div className="wc-hero-text">
                                <h2>{featuredContest.title}</h2>
                                <p>{featuredContest.description ? (featuredContest.description.length > 150 ? featuredContest.description.substring(0, 150) + "..." : featuredContest.description) : "Compete in weekly programming contests to test and improve your coding skills. Join, solve problems, and climb the leaderboard!"}</p>
                            </div>
                        </div>
                        <div className="wc-hero-right">
                            <div className="wc-hero-card">
                                <div className="wc-hc-top">
                                    <div className="wc-hc-title">
                                        <h3>🏆 {featuredContest.title}</h3>
                                    </div>
                                    <div className="wc-hc-timer">
                                        {featuredContest.status === "LIVE" ? (
                                            <><span className="wc-dot live"></span> Live Now</>
                                        ) : (
                                            <><span className="wc-dot" style={{backgroundColor: '#eab308', boxShadow: '0 0 8px #eab308'}}></span> {getTimeRemaining(featuredContest.start_time).replace('Starts in ', '')}</>
                                        )}
                                    </div>
                                </div>
                                <div className="wc-hc-stats">
                                    <div className="wc-hc-stat">
                                        <span className="wc-icon">👥</span> {featuredContest.participant_count || "4,211"} competing
                                    </div>
                                    <div className="wc-hc-stat">
                                        <span className="wc-icon">⭐</span> {getOverallDifficulty(featuredContest.difficulty_mix).label}: <span className="wc-stars">{getOverallDifficulty(featuredContest.difficulty_mix).stars}</span>
                                    </div>
                                    <div className="wc-hc-stat">
                                        <span className="wc-icon">ℹ️</span> Status: <strong>{featuredContest.status === "LIVE" ? "Live" : "Upcoming"}</strong>
                                    </div>
                                </div>
                                <div className="wc-hc-buttons">
                                    {featuredContest.status === "LIVE" ? (
                                        <button className="wc-btn-primary" onClick={() => setPage({ name: "contestArena", contestId: featuredContest.id })}>Join Contest</button>
                                    ) : (
                                        <button className="wc-btn-primary" onClick={() => handleRegister(featuredContest.id)}>Register Now</button>
                                    )}
                                    <button className="wc-btn-secondary" onClick={() => setPage({ name: "contestDetail", contestId: featuredContest.id })}>View Details</button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="wc-hero-left">
                            <div className="wc-hero-icon">🌟</div>
                            <div className="wc-hero-text">
                                <h2>No Active Contests</h2>
                                <p>There are no live or upcoming official contests right now. Keep an eye out for updates, or try creating your own community contest!</p>
                            </div>
                        </div>
                        <div className="wc-hero-right">
                            <div className="wc-hero-card" style={{opacity: 0.8}}>
                                <div className="wc-hc-top">
                                    <div className="wc-hc-title">
                                        <h3 style={{color: '#94a3b8'}}>Next Contest TBA</h3>
                                    </div>
                                </div>
                                <div className="wc-hc-stats">
                                    <div className="wc-hc-stat" style={{color: '#64748b', fontSize: '1rem'}}>
                                        Check back soon for the next weekly competitive programming challenge.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 3. TABS SECTION */}
            <div className="wc-tabs-container">
                <div className="wc-tabs">
                    <button className={`wc-tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
                        <span className="wc-tab-icon">🏆</span> Active
                    </button>
                    <button className={`wc-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
                        <span className="wc-tab-icon">⏰</span> Upcoming
                    </button>
                    <button className={`wc-tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
                        <span className="wc-tab-icon">📜</span> Past
                    </button>
                </div>
            </div>

            {/* 4. CONTEST CARDS SECTION */}
            <div className="wc-grid">
                {loading ? (
                    <div className="wc-loading">⏳ Loading contests...</div>
                ) : contests.length === 0 ? (
                    <div className="wc-empty">No contests found for this category.</div>
                ) : (
                    contests.map(contest => {
                        const status = contest.status || "FINISHED";
                        const isLive = status === "LIVE";
                        const isUpcoming = status === "UPCOMING";
                        const isPast = status === "FINISHED";
                        
                        const diff = getOverallDifficulty(contest.difficulty_mix);
                        
                        // Mock data for UI completeness if actual data is missing
                        const participants = contest.participant_count || Math.floor(Math.random() * 5000) + 100;
                        const duration = contest.duration_minutes || 90;
                        const mockScore = isPast ? Math.floor(Math.random() * 500) + 100 : null;
                        const mockPct = isPast ? Math.floor((mockScore / 600) * 100) : null;

                        return (
                            <div key={contest.id} className={`wc-card ${isLive ? 'outline-live' : ''}`} onClick={() => setPage({ name: "contestDetail", contestId: contest.id })}>
                                {/* TOP */}
                                <div className="wc-card-top">
                                    <h3 className="wc-card-title">{contest.title}</h3>
                                    {isLive && <span className="wc-badge badge-live"><span className="wc-dot"></span> LIVE</span>}
                                    {isUpcoming && <span className="wc-badge badge-upcoming">UPCOMING</span>}
                                    {isPast && <span className="wc-badge badge-ended">ENDED ▾</span>}
                                </div>

                                {/* MIDDLE */}
                                <div className="wc-card-middle">
                                    <div className="wc-card-desc">
                                        {isLive ? `${participants} competing now` : 
                                         isUpcoming ? `Starts in: ${getTimeRemaining(contest.start_time).replace('Starts in ', '')}` : 
                                         `Contest ended on ${new Date(contest.start_time).toLocaleDateString()}`}
                                    </div>
                                    <div className="wc-card-info-row">
                                        <div className="wc-info-item">
                                            <span className="wc-icon">⭐</span> Difficulty: <span className={`wc-stars-color ${diff.color}`}>{diff.stars}</span> {diff.label}
                                        </div>
                                    </div>
                                    <div className="wc-card-chips">
                                        {contest.difficulty_mix ? (
                                            contest.difficulty_mix.split(',').map((p, i) => {
                                                const [cnt, lvl] = p.trim().split('-');
                                                return <span key={i} className={`wc-chip chip-${lvl?.toLowerCase()}`}>{cnt} {lvl?.toUpperCase()}</span>;
                                            })
                                        ) : (
                                            <span className="wc-chip chip-medium">Problems Set</span>
                                        )}
                                        <div className="wc-time-info">
                                            <span className="wc-icon">🕒</span> 
                                            {isLive ? `Time Left: ~${Math.floor(Math.random() * 60)}m left` : 
                                             isUpcoming ? `Duration: ${Math.floor(duration/60)}h ${duration%60}m` : 
                                             `${Math.floor(duration/60)}h ${duration%60}m`}
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM */}
                                <div className="wc-card-bottom">
                                    <div className="wc-card-actions">
                                        {isLive && (
                                            <>
                                                <div className="wc-mock-users">
                                                    <span className="wc-icon">👥</span> {Math.floor(participants/1000)}k ▾
                                                </div>
                                                <button className="wc-btn-action live" onClick={(e) => { e.stopPropagation(); setPage({ name: "contestArena", contestId: contest.id });}}>
                                                    Participate
                                                </button>
                                            </>
                                        )}
                                        {isUpcoming && (
                                            <>
                                                <div className="wc-stat-gray">Avg Score*</div>
                                                <button className="wc-btn-action upcoming" onClick={(e) => { e.stopPropagation(); handleRegister(contest.id); }}>
                                                    View Details (Register)
                                                </button>
                                            </>
                                        )}
                                        {isPast && (
                                            <>
                                                {/* EXTRA FEATURE FOR PAST CONTESTS */}
                                                <div className="wc-past-score">
                                                    <div className="wc-score-bar">
                                                        <div className="wc-score-fill" style={{width: `${mockPct}%`}}></div>
                                                    </div>
                                                    <span className="wc-score-text"><span className="wc-green-pct">{mockPct}%</span> Your Score {mockScore}</span>
                                                </div>
                                                <button className="wc-btn-action past" onClick={(e) => { e.stopPropagation(); setPage({ name: "contestPractice", contestId: contest.id });}}>
                                                    Practice
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal remains visually separated but functional */}
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
