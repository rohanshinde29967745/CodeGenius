import React from "react";
import "../App.css";

function Dashboard({ setPage }) {
  return (
    <div className="dashboard-container">
      <h1 className="welcome-text">Welcome back, Alex! 👋</h1>
      <p className="sub-text">
        Here's what's happening with your coding journey today.
      </p>

      <div className="stats-grid">
        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Problems Solved</h4>
            <span className="stat-icon">🎯</span>
          </div>
          <h2>47</h2>
          <p>+3 from last week</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Total Points</h4>
            <span className="stat-icon">📈</span>
          </div>
          <h2>2,850</h2>
          <p>+180 from last week</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Accuracy</h4>
            <span className="stat-icon">✓</span>
          </div>
          <h2>89%</h2>
          <p>+2% from last week</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Current Level</h4>
            <span className="stat-icon">👤</span>
          </div>
          <h2>Gold</h2>
          <div className="level-bar">
            <div className="progress"></div>
          </div>
          <p>750/1000 XP to Platinum</p>
        </div>
      </div>

      <div className="middle-section">
        <div className="quick-actions animated-border">
          <div className="section-header">
            <span className="section-icon">⚡</span>
            <div>
              <h3>Quick Actions</h3>
              <p>Jump into your favorite activities</p>
            </div>
          </div>

          <div className="qa-card" onClick={() => setPage("analyzer")} style={{ cursor: 'pointer' }}>
            <div className="qa-icon blue">
              <span>{"<>"}</span>
            </div>
            <div className="qa-content">
              <h4>Analyze Code</h4>
              <p>Get AI-powered insights</p>
            </div>
            <span className="qa-arrow">→</span>
          </div>

          <div className="qa-card" onClick={() => setPage("problemSolving")} style={{ cursor: 'pointer' }}>
            <div className="qa-icon green">
              <span>◉</span>
            </div>
            <div className="qa-content">
              <h4>Solve Problems</h4>
              <p>Practice coding challenges</p>
            </div>
            <span className="qa-arrow">→</span>
          </div>

          <div className="qa-card" onClick={() => setPage("converter")} style={{ cursor: 'pointer' }}>
            <div className="qa-icon purple">
              <span>⟲</span>
            </div>
            <div className="qa-content">
              <h4>Convert Code</h4>
              <p>Transform between languages</p>
            </div>
            <span className="qa-arrow">→</span>
          </div>

          <div className="qa-card" onClick={() => setPage("leaderboard")} style={{ cursor: 'pointer' }}>
            <div className="qa-icon yellow">
              <span>🏅</span>
            </div>
            <div className="qa-content">
              <h4>View Leaderboard</h4>
              <p>See your ranking</p>
            </div>
            <span className="qa-arrow">→</span>
          </div>
        </div>

        <div className="recent-activity animated-border">
          <div className="section-header">
            <span className="section-icon">📊</span>
            <div>
              <h3>Recent Activity</h3>
              <p>Your latest coding activities</p>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-dot blue">◉</span>
              <div className="activity-content">
                <strong>Python Function Analyzed</strong>
                <span>Binary search implementation</span>
                <small>⏱ 2 hours ago</small>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot green">◉</span>
              <div className="activity-content">
                <strong>Problem Solved</strong>
                <span>Two Sum - Easy</span>
                <small>⏱ 5 hours ago</small>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot gold">🏅</span>
              <div className="activity-content">
                <strong>Badge Earned</strong>
                <span>Code Optimizer</span>
                <small>⏱ 1 day ago</small>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot purple">◉</span>
              <div className="activity-content">
                <strong>Code Converted</strong>
                <span>Python to JavaScript</span>
                <small>⏱ 2 days ago</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="badges-section animated-border">
        <h3>Your Badges</h3>
        <p>Achievements you've earned on your coding journey</p>
        <div className="badge-row">
          <span className="badge-item animated-border">🥉 Bronze</span>
          <span className="badge-item animated-border">🥈 Silver</span>
          <span className="badge-item animated-border">🥇 Gold</span>
          <span className="badge-item animated-border">🏆 Problem Solver</span>
          <span className="badge-item animated-border">💡 Code Optimizer</span>
        </div>
      </div>

      <div className="challenge-card animated-border">
        <h4>📅 Today's Challenge</h4>
        <p>Complete today's challenge to earn bonus points!</p>
        <div className="challenge-box">
          <div>
            <h3>Implement a Binary Search Tree</h3>
            <p>Difficulty: Medium • Reward: 150 points</p>
          </div>
          <button className="start-btn">Start Challenge</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

