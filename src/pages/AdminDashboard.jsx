import React from "react";
import "../App.css";

function AdminDashboard() {
  return (
    <div className="dashboard-container">

      {/* ================= TOP ADMIN BAR (LIKE IMAGE) ================= */}
      <div className="admin-topbar">

        {/* SEARCH */}
        <div className="admin-search">
          <input type="text" placeholder="Search..." />
        </div>

        {/* RIGHT SIDE */}
        <div className="admin-topbar-right">
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
        <button className="admin-btn">📤 Export Data</button>
        <button className="admin-btn">⚙ Settings</button>
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
