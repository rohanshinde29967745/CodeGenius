import React, { useState, useEffect, useRef } from "react";
import { getAdminStats, getAdminActivity, getPopularProblems } from "../services/api";
import "../App.css";

function AdminDashboard({ onLogout, isDark, toggleTheme }) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailySubmissions: 0,
    activeProblems: 0,
    totalProjects: 0,
    growth: { users: 0, submissions: 0 },
  });
  const [activities, setActivities] = useState([]);
  const [popularProblems, setPopularProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData, problemsData] = await Promise.all([
          getAdminStats(),
          getAdminActivity(5),
          getPopularProblems(3),
        ]);

        setStats(statsData);
        setActivities(activityData.activities || []);
        setPopularProblems(problemsData.problems || []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onLogout) onLogout();
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/export");
      const data = await response.json();

      if (!response.ok) {
        alert("Failed to export data");
        return;
      }

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

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffMs / 86400000)} days ago`;
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

  return (
    <div className="dashboard-container">

      {/* ================= TOP ADMIN BAR ================= */}
      <div className="admin-topbar">

        {/* RIGHT SIDE */}
        <div className="admin-topbar-right" style={{ marginLeft: 'auto' }}>
          <div className="admin-profile">
            <div className="admin-avatar">👤</div>
            <div className="admin-info">
              <strong>{JSON.parse(localStorage.getItem('user'))?.fullName || 'Admin'}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>

      </div>
      {/* ================= END TOP BAR ================= */}

      <h1 className="welcome-text">Admin Dashboard</h1>
      <p className="sub-text">Platform analytics and management overview.</p>

      <div className="admin-top-buttons">
        <button className="admin-action-btn export-btn" onClick={handleExportData}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Export Data
        </button>

        <div className="admin-settings-wrapper" ref={settingsRef}>
          <button
            className="admin-action-btn settings-btn"
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          {showSettingsDropdown && (
            <div className="admin-settings-dropdown">
              {/* Dark Mode Toggle */}
              <div className="settings-dropdown-item theme-item">
                <div className="theme-label">
                  <span className="theme-icon">{isDark ? "🌙" : "☀️"}</span>
                  <span>Dark Mode</span>
                </div>
                <label className="admin-toggle-switch">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                  />
                  <span className="admin-toggle-slider"></span>
                </label>
              </div>

              <div className="settings-dropdown-divider"></div>

              {/* Logout Button */}
              <button className="settings-dropdown-item logout-item" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-stats-row">
          <div className="admin-stat-card">Loading...</div>
        </div>
      ) : (
        <>
          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <h3>Total Users</h3>
              <h1>{stats.totalUsers.toLocaleString()}</h1>
              <p className={stats.growth?.users >= 0 ? "green" : "red"}>
                {stats.growth?.users >= 0 ? "+" : ""}{stats.growth?.users}% from yesterday
              </p>
            </div>

            <div className="admin-stat-card">
              <h3>Daily Submissions</h3>
              <h1>{stats.dailySubmissions.toLocaleString()}</h1>
              <p className={stats.growth?.submissions >= 0 ? "green" : "red"}>
                {stats.growth?.submissions >= 0 ? "+" : ""}{stats.growth?.submissions}% from yesterday
              </p>
            </div>

            <div className="admin-stat-card">
              <h3>Active Problems</h3>
              <h1>{stats.activeProblems}</h1>
              <p className="green">Available challenges</p>
            </div>

            <div className="admin-stat-card">
              <h3>Project Uploads</h3>
              <h1>{stats.totalProjects.toLocaleString()}</h1>
              <p className="green">Total projects</p>
            </div>
          </div>

          <div className="admin-two-col">

            {/* RECENT ACTIVITY */}
            <div className="admin-left">
              <h3 className="section-title">🔵 Recent Activity</h3>
              <p className="section-sub">Latest platform events and user actions</p>

              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-left">
                      <span className="icon blue">{getActivityIcon(activity.type)}</span>
                      <span>{activity.description || `${activity.userName}: ${activity.type.replace(/_/g, " ")}`}</span>
                    </div>
                    <span className="time">{formatTimeAgo(activity.time)}</span>
                  </div>
                ))
              ) : (
                <div className="activity-item">
                  <div className="activity-left">
                    <span className="icon blue">📊</span>
                    <span>No recent activity</span>
                  </div>
                </div>
              )}
            </div>

            {/* POPULAR PROBLEMS */}
            <div className="admin-right">
              <h3 className="section-title">🔥 Most Popular Problems</h3>
              <p className="section-sub">Problems with highest engagement</p>

              {popularProblems.length > 0 ? (
                popularProblems.map((problem) => (
                  <div className="pop-problem" key={problem.id}>
                    <div className="pop-header">
                      <strong>{problem.title}</strong>
                      <span>{problem.attempts} attempts</span>
                    </div>
                    <div className="pop-bar">
                      <div className="pop-fill" style={{ width: `${problem.successRate}%` }} />
                    </div>
                    <small>Success Rate: {problem.successRate}%</small>
                  </div>
                ))
              ) : (
                <div className="pop-problem">
                  <div className="pop-header">
                    <strong>No problems yet</strong>
                  </div>
                  <p>Generate problems to see statistics</p>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
