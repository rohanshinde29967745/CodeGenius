import React, { useState, useEffect } from "react";
import "./ContestList.css";
import { getCurrentUser } from "../services/api";

function AdminContestList({ setPage }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const currentUser = getCurrentUser();

    useEffect(() => {
        fetchContests();
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

    const deleteContest = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contest? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:4000/api/contests/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert("Contest deleted successfully");
                fetchContests();
            } else {
                alert(data.error || "Failed to delete contest");
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "LIVE": return "#10b981";
            case "UPCOMING": return "#f59e0b";
            case "FINISHED": return "#ef4444";
            default: return "#94a3b8";
        }
    };

    /* ─── Inline Styles for Admin Vibe ─── */
    const s = {
        page: {
            padding: "30px",
            background: "var(--bg-primary, #0f172a)",
            minHeight: "100vh",
            color: "var(--text-primary, #f8fafc)",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "20px"
        },
        backBtn: {
            padding: "8px 16px",
            background: "var(--bg-secondary, #1e293b)",
            border: "1px solid #334155",
            color: "var(--text-primary, #e2e8f0)",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
        },
        titleGroup: {
            flex: 1
        },
        title: {
            fontSize: "1.8rem",
            fontWeight: "700",
            margin: "0 0 4px 0",
        },
        subtitle: {
            color: "#94a3b8",
            fontSize: "0.9rem",
            margin: 0
        },
        createBtn: {
            padding: "10px 20px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
        },
        toolbar: {
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            background: "var(--bg-secondary, #1e293b)",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #334155",
        },
        tab: (active) => ({
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "600",
            border: "none",
            background: active ? "rgba(99, 102, 241, 0.15)" : "transparent",
            color: active ? "#818cf8" : "#94a3b8",
            transition: "all 0.2s",
        }),
        grid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
        },
        card: {
            background: "var(--bg-secondary, #1e293b)",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "relative",
            overflow: "hidden"
        },
        cardHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
        },
        statusBadge: (status) => ({
            padding: "4px 10px",
            borderRadius: "99px",
            fontSize: "0.7rem",
            fontWeight: "700",
            background: `${getStatusColor(status)}20`,
            color: getStatusColor(status),
            border: `1px solid ${getStatusColor(status)}40`,
            textTransform: "uppercase",
        }),
        cardTitle: {
            fontSize: "1.1rem",
            fontWeight: "600",
            margin: 0,
            color: "#f8fafc",
        },
        cardMeta: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            fontSize: "0.85rem",
            color: "#94a3b8",
        },
        metaItem: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
        },
        cardActions: {
            display: "flex",
            gap: "10px",
            marginTop: "auto",
            paddingTop: "15px",
            borderTop: "1px solid #334155",
        },
        btnAction: {
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: "600",
            cursor: "pointer",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#e2e8f0",
            transition: "all 0.2s",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px"
        },
        btnDelete: {
            padding: "8px",
            borderRadius: "6px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            cursor: "pointer",
            width: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
        }
    };

    return (
        <div style={s.page}>
            <button style={s.backBtn} onClick={() => setPage("admin")}>
                ← Back to Dashboard
            </button>

            <div style={s.header}>
                <div style={s.titleGroup}>
                    <h1 style={s.title}>🏆 Contest Management</h1>
                    <p style={s.subtitle}>Monitor, manage, and monitor all platform contests</p>
                </div>
                <button style={s.createBtn} onClick={() => setPage("createContest")}>
                    + Create Official Contest
                </button>
            </div>

            <div style={s.toolbar}>
                <button style={s.tab(activeTab === "all")} onClick={() => setActiveTab("all")}>All Contests</button>
                <button style={s.tab(activeTab === "live")} onClick={() => setActiveTab("live")}>Live</button>
                <button style={s.tab(activeTab === "upcoming")} onClick={() => setActiveTab("upcoming")}>Upcoming</button>
                <button style={s.tab(activeTab === "past")} onClick={() => setActiveTab("past")}>Finished</button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8" }}>Loading platform contests...</div>
            ) : contests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px", background: "#1e293b", borderRadius: "12px", border: "1px dashed #334155" }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No contests found in this category.</p>
                </div>
            ) : (
                <div style={s.grid}>
                    {contests.map(contest => (
                        <div key={contest.id} style={s.card}>
                            <div style={s.cardHeader}>
                                <h3 style={s.cardTitle}>{contest.title}</h3>
                                <span style={s.statusBadge(contest.status)}>{contest.status}</span>
                            </div>

                            <div style={s.cardMeta}>
                                <div style={s.metaItem}>
                                    <span>👥</span>
                                    <span>{contest.participant_count || 0} participants</span>
                                </div>
                                <div style={s.metaItem}>
                                    <span>🕒</span>
                                    <span>{contest.duration_minutes} mins</span>
                                </div>
                                <div style={s.metaItem}>
                                    <span>📅</span>
                                    <span>{new Date(contest.start_time).toLocaleDateString()}</span>
                                </div>
                                <div style={s.metaItem}>
                                    <span>⭐</span>
                                    <span>{contest.difficulty_mix?.split(',').length || 0} Problems</span>
                                </div>
                            </div>

                            <div style={s.cardActions}>
                                <button style={s.btnAction} onClick={() => setPage({ name: "contestDetail", contestId: contest.id })}>
                                    👁️ View Details
                                </button>
                                <button 
                                    style={s.btnDelete} 
                                    title="Delete Contest"
                                    onClick={() => deleteContest(contest.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminContestList;
