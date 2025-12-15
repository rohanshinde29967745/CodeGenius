import React, { useState, useEffect, useRef } from "react";
import "../App.css";

function AdminDashboard({ onLogout, isDark, toggleTheme }) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onLogout) onLogout();
  };

  const handleExportData = () => {
    // Placeholder for export functionality
    alert("Exporting data...");
  };

  return (
    <div className="dashboard-container">

      {/* ================= TOP ADMIN BAR ================= */}
      <div className="admin-topbar">

        {/* RIGHT SIDE */}
        <div className="admin-topbar-right" style={{ marginLeft: 'auto' }}>
          <button className="admin-notification">🔔</button>

          <div className="admin-profile">
            <div className="admin-avatar">👤</div>
            <div className="admin-info">
              <strong>Alex Chen</strong>
              <span>Gold Level</span>
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

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <h1>15,847</h1>
          <p className="green">+12.5% from last month</p>
        </div>

        <div className="admin-stat-card">
          <h3>Daily Submissions</h3>
          <h1>3,264</h1>
          <p className="green">+5% from yesterday</p>
        </div>

        <div className="admin-stat-card">
          <h3>Active Problems</h3>
          <h1>542</h1>
          <p className="green">+8 problems this week</p>
        </div>

        <div className="admin-stat-card">
          <h3>Project Uploads</h3>
          <h1>1,089</h1>
          <p className="green">+23 uploads today</p>
        </div>
      </div>

      <div className="admin-two-col">

        {/* RECENT ACTIVITY */}
        <div className="admin-left">
          <h3 className="section-title">🔵 Recent Activity</h3>
          <p className="section-sub">Latest platform events and user actions</p>

          <div className="activity-item">
            <div className="activity-left">
              <span className="icon blue">📧</span>
              <span>New user registration: sarah.dev@email.com</span>
            </div>
            <span className="time">2 minutes ago</span>
          </div>

          <div className="activity-item">
            <div className="activity-left">
              <span className="icon green">🧩</span>
              <span>Problem "Binary Tree Traversal" was solved 15 times</span>
            </div>
            <span className="time">5 minutes ago</span>
          </div>

          <div className="activity-item">
            <div className="activity-left">
              <span className="icon purple">📦</span>
              <span>Project uploaded: "React Todo App"</span>
            </div>
            <span className="time">12 minutes ago</span>
          </div>

          <div className="activity-item">
            <div className="activity-left">
              <span className="icon orange">🏅</span>
              <span>3 users earned "Problem Solver" badge</span>
            </div>
            <span className="time">1 hour ago</span>
          </div>
        </div>

        {/* POPULAR PROBLEMS */}
        <div className="admin-right">
          <h3 className="section-title">🔥 Most Popular Problems</h3>
          <p className="section-sub">Problems with highest engagement</p>

          <div className="pop-problem">
            <div className="pop-header">
              <strong>Two Sum</strong>
              <span>1547 attempts</span>
            </div>
            <div className="pop-bar">
              <div className="pop-fill" style={{ width: "76%" }} />
            </div>
            <small>Success Rate: 76%</small>
          </div>

          <div className="pop-problem">
            <div className="pop-header">
              <strong>Valid Parentheses</strong>
              <span>1234 attempts</span>
            </div>
            <div className="pop-bar">
              <div className="pop-fill" style={{ width: "85%" }} />
            </div>
            <small>Success Rate: 85%</small>
          </div>

          <div className="pop-problem">
            <div className="pop-header">
              <strong>Binary Search</strong>
              <span>987 attempts</span>
            </div>
            <div className="pop-bar">
              <div className="pop-fill" style={{ width: "92%" }} />
            </div>
            <small>Success Rate: 92%</small>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
