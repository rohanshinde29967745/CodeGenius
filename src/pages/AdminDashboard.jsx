import React, { useState, useEffect } from "react";
import { getAdminStats, getAdminActivity, getPopularProblems } from "../services/api";
import "../App.css";

function AdminDashboard({ setPage }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailySubmissions: 0,
    activeProblems: 0,
    totalProjects: 0,
    activeContests: 0,
    growth: { users: 0, submissions: 0 },
  });
  const [activities, setActivities] = useState([]);
  const [popularProblems, setPopularProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingReports, setPendingReports] = useState(0);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData, problemsData, reportsRes] = await Promise.all([
          getAdminStats(),
          getAdminActivity(5),
          getPopularProblems(3),
          fetch("http://localhost:4000/api/reports/pending/count").catch(() => null),
        ]);
        setStats(statsData);
        setActivities(activityData.activities || []);
        setPopularProblems(problemsData.problems || []);
        
        if (reportsRes && reportsRes.ok) {
            const data = await reportsRes.json();
            setPendingReports(parseInt(data.count) || 0);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/admin/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) { alert("Failed to export data"); return; }

      let csv = "=== CODEGENIUS PLATFORM EXPORT ===\n\n";
      csv += "--- USERS ---\n";
      csv += "ID,Name,Email,Role,Level,Points,Problems Solved,Created At\n";
      data.users.forEach(u => {
        csv += `${u.id},"${u.fullName}",${u.email},${u.role},${u.level},${u.points},${u.problemsSolved},${u.createdAt}\n`;
      });
      csv += "\n--- RECENT SUBMISSIONS ---\n";
      csv += "ID,User,Problem,Status,Points,Submitted At\n";
      data.submissions.forEach(s => {
        csv += `${s.id},"${s.userName}","${s.problemTitle}",${s.status},${s.points},${s.submittedAt}\n`;
      });
      csv += "\n--- RECENT ACTIVITY ---\n";
      csv += "ID,User,Type,Description,Time\n";
      data.activities.forEach(a => {
        csv += `${a.id},"${a.userName}",${a.type},"${a.description}",${a.time}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codegenius_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("✅ Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Failed to export data");
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    const icons = {
      registration: "📧",
      login: "🔵",
      problem_solved: "🧩",
      project_uploaded: "📦",
      badge_earned: "🏅",
    };
    return icons[type] || "🔵";
  };

  const kpiCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      growth: stats.growth?.users,
      growthLabel: "vs yesterday",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "#6e8efb",
    },
    {
      label: "Daily Submissions",
      value: stats.dailySubmissions.toLocaleString(),
      growth: stats.growth?.submissions,
      growthLabel: "vs yesterday",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      color: "#a777e3",
    },
    {
      label: "Active Problems",
      value: stats.activeProblems,
      growth: null,
      growthLabel: "Available challenges",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      label: "Project Uploads",
      value: stats.totalProjects.toLocaleString(),
      growth: null,
      growthLabel: "Total projects",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      color: "#f59e0b",
    },
  ];

  return (
    <div className="adm-page">

      {/* ===== PAGE HEADER ===== */}
      <div className="adm-header">
        <div className="adm-header-left">
          <div className="adm-header-badge">Admin Panel</div>
          <h1 className="adm-title">Platform Dashboard</h1>
          <p className="adm-subtitle">Real-time analytics and platform management overview</p>
        </div>
        <div className="adm-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="adm-export-btn" onClick={() => setPage("adminUsers")} style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }}>
            👥 Manage Users
          </button>
          <button className="adm-export-btn" onClick={() => setPage("reports")} style={{ background: '#3b82f6', color: '#fff', borderColor: '#3b82f6', position: 'relative' }}>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            View Reports
            {pendingReports > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {pendingReports}
                </span>
            )}
          </button>
          <button className="adm-export-btn" onClick={handleExportData}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ===== KPI STAT CARDS ===== */}
      <div className="adm-kpi-grid">
        {kpiCards.map((card, i) => (
          <div className="adm-kpi-card" key={i} style={{ "--accent": card.color }}>
            <div className="adm-kpi-icon" style={{ background: `${card.color}18`, color: card.color }}>
              {card.icon}
            </div>
            <div className="adm-kpi-body">
              <span className="adm-kpi-label">{card.label}</span>
              {loading ? (
                <div className="adm-kpi-skeleton" />
              ) : (
                <span className="adm-kpi-value">{card.value}</span>
              )}
              {card.growth !== null ? (
                <span className={`adm-kpi-growth ${card.growth >= 0 ? "positive" : "negative"}`}>
                  {card.growth >= 0 ? "▲" : "▼"} {Math.abs(card.growth)}% {card.growthLabel}
                </span>
              ) : (
                <span className="adm-kpi-growth neutral">{card.growthLabel}</span>
              )}
            </div>
            <div className="adm-kpi-glow" style={{ background: card.color }} />
          </div>
        ))}
      </div>

      {/* ===== TWO COLUMN SECTION ===== */}
      <div className="adm-two-col">

        {/* RECENT ACTIVITY */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <div className="adm-panel-title-group">
              <span className="adm-panel-dot" style={{ background: "#6e8efb" }} />
              <h3 className="adm-panel-title">Recent Activity</h3>
            </div>
            <span className="adm-panel-sub">Latest platform events</span>
          </div>

          <div className="adm-activity-list">
            {loading ? (
              [1, 2, 3, 4, 5].map(n => (
                <div className="adm-activity-skeleton" key={n} />
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div className="adm-activity-item" key={activity.id}>
                  <span className="adm-activity-icon">{getActivityIcon(activity.type)}</span>
                  <span className="adm-activity-desc">
                    {activity.description || `${activity.userName}: ${activity.type.replace(/_/g, " ")}`}
                  </span>
                  <span className="adm-activity-time">{formatTimeAgo(activity.time)}</span>
                </div>
              ))
            ) : (
              <div className="adm-empty-state">
                <span>📊</span>
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* POPULAR PROBLEMS */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <div className="adm-panel-title-group">
              <span className="adm-panel-dot" style={{ background: "#f59e0b" }} />
              <h3 className="adm-panel-title">Most Popular Problems</h3>
            </div>
            <span className="adm-panel-sub">Highest engagement</span>
          </div>

          <div className="adm-problems-list">
            {loading ? (
              [1, 2, 3].map(n => (
                <div className="adm-problem-skeleton" key={n} />
              ))
            ) : popularProblems.length > 0 ? (
              popularProblems.map((problem) => (
                <div className="adm-problem-item" key={problem.id}>
                  <div className="adm-problem-top">
                    <strong className="adm-problem-title">{problem.title}</strong>
                    <span className="adm-problem-attempts">{problem.attempts} attempts</span>
                  </div>
                  <div className="adm-problem-bar-wrap">
                    <div className="adm-problem-bar-fill" style={{ width: `${problem.successRate}%` }} />
                  </div>
                  <small className="adm-problem-rate">Success Rate: {problem.successRate}%</small>
                </div>
              ))
            ) : (
              <div className="adm-empty-state">
                <span>🧩</span>
                <p>No problems yet. Generate problems to see stats.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ===== CONTEST MANAGEMENT ===== */}
      <div className="adm-panel adm-contest-panel">
        <div className="adm-panel-header">
          <div className="adm-panel-title-group">
            <span className="adm-panel-dot" style={{ background: "#a777e3" }} />
            <h3 className="adm-panel-title">Contest Management</h3>
          </div>
          <span className="adm-panel-sub">Create official contests and monitor participant activity</span>
        </div>

        <div className="adm-contest-cards">
          <div className="adm-contest-stat-card">
            <div className="adm-contest-stat-icon">🏆</div>
            <h4 className="adm-contest-stat-label">Active Contests</h4>
            <div className="adm-contest-stat-val">{loading ? "—" : stats.activeContests || 0}</div>
            <button className="adm-contest-btn secondary" onClick={() => setPage("adminContests")}>
              View All Contests
            </button>
          </div>

          <div className="adm-contest-stat-card accent">
            <div className="adm-contest-stat-icon">✨</div>
            <h4 className="adm-contest-stat-label">Create New</h4>
            <p className="adm-contest-stat-desc">Design a new official coding challenge</p>
            <button className="adm-contest-btn primary" onClick={() => setPage("createContest")}>
              + Start Official Contest
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;
