import React from "react";
import "../App.css";

function Dashboard() {
  return (
    <div className="dashboard-container">

      {/* ------- HEADER TEXT ------ */}
      <h1 className="welcome-text">Welcome back, Alex! 👋</h1>
      <p className="sub-text">Here's what's happening with your coding journey today.</p>

      {/* ------- STATS ROW ------ */}
      <div className="stats-grid">

        <div className="stat-card">
          <h4>Problems Solved</h4>
          <h2>47</h2>
          <p>+3 from last week</p>
        </div>

        <div className="stat-card">
          <h4>Total Points</h4>
          <h2>2,850</h2>
          <p>+180 from last week</p>
        </div>

        <div className="stat-card">
          <h4>Accuracy</h4>
          <h2>89%</h2>
          <p>+2% from last week</p>
        </div>

        <div className="stat-card">
          <h4>Current Level</h4>
          <h2>Gold</h2>
          <div className="level-bar">
            <div className="progress"></div>
          </div>
          <p>750/1000 XP to Platinum</p>
        </div>

      </div>

      {/* ------- MIDDLE SECTION: QUICK ACTIONS + RECENT ACTIVITY ------- */}
      <div className="middle-section">

        {/* ==== QUICK ACTIONS ==== */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <p>Jump into your favorite activities</p>

          <div className="qa-card blue">
            <span>📘</span>
            <div>
              <h4>Analyze Code</h4>
              <p>Get AI-powered insights</p>
            </div>
          </div>

          <div className="qa-card green">
            <span>🟢</span>
            <div>
              <h4>Solve Problems</h4>
              <p>Practice coding challenges</p>
            </div>
          </div>

          <div className="qa-card purple">
            <span>🟣</span>
            <div>
              <h4>Convert Code</h4>
              <p>Transform between languages</p>
            </div>
          </div>

          <div className="qa-card yellow">
            <span>⭐</span>
            <div>
              <h4>View Leaderboard</h4>
              <p>See your ranking</p>
            </div>
          </div>
        </div>

        {/* ==== RECENT ACTIVITY ==== */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <p>Your latest coding activities</p>

          <ul>
            <li>
              <strong>Python Function Analyzed</strong>
              <span>Binary search implementation • 2 hours ago</span>
            </li>

            <li>
              <strong>Problem Solved</strong>
              <span>Two Sum — Easy • 5 hours ago</span>
            </li>

            <li>
              <strong>Badge Earned</strong>
              <span>Code Optimizer • 1 day ago</span>
            </li>

            <li>
              <strong>Code Converted</strong>
              <span>Python to JavaScript • 2 days ago</span>
            </li>
          </ul>
        </div>

      </div>

      {/* ------- BADGES SECTION ------- */}
      <div className="badges-section">
        <h3>Your Badges</h3>
        <p>Achievements you've earned on your coding journey</p>

        <div className="badge-row">
          <span className="badge-item">🥉 Bronze</span>
          <span className="badge-item">🥈 Silver</span>
          <span className="badge-item">🥇 Gold</span>
          <span className="badge-item">🏆 Problem Solver</span>
          <span className="badge-item">💡 Code Optimizer</span>
        </div>
      </div>

      {/* ------- TODAY'S CHALLENGE ------- */}
      <div className="challenge-card">
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
