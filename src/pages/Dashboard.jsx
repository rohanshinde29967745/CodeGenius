import React, { useState, useEffect } from "react";
import { getUserStats, getUserActivity, getCurrentUser } from "../services/api";
import "../App.css";

function Dashboard({ setPage }) {
  const [stats, setStats] = useState({
    problemsSolved: 0,
    totalPoints: 0,
    accuracy: 0,
    currentLevel: "Bronze",
    currentXp: 0,
    xpToNextLevel: 1000,
  });
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState({ fullName: "User" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Fetch user stats
        const statsData = await getUserStats(currentUser.id);
        if (statsData.stats) {
          setStats(statsData.stats);
        }

        // Fetch recent activity
        const activityData = await getUserActivity(currentUser.id, 5);
        if (activityData.activities) {
          setActivities(activityData.activities);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Get activity icon and color
  const getActivityStyle = (type) => {
    const styles = {
      login: { icon: "🔵", color: "blue" },
      registration: { icon: "🟢", color: "green" },
      problem_solved: { icon: "✅", color: "green" },
      problem_attempted: { icon: "🔄", color: "blue" },
      code_analyzed: { icon: "🔵", color: "blue" },
      code_converted: { icon: "🟣", color: "purple" },
      project_uploaded: { icon: "📦", color: "purple" },
      badge_earned: { icon: "🏅", color: "gold" },
      level_up: { icon: "⭐", color: "gold" },
    };
    return styles[type] || { icon: "◉", color: "blue" };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1 className="welcome-text">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="welcome-text">Welcome back, {user.fullName?.split(" ")[0] || "User"}! 👋</h1>
      <p className="sub-text">
        Here's what's happening with your coding journey today.
      </p>

      <div className="stats-grid">
        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Problems Solved</h4>
            <span className="stat-icon">🎯</span>
          </div>
          <h2>{stats.problemsSolved}</h2>
          <p>Keep solving!</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Total Points</h4>
            <span className="stat-icon">📈</span>
          </div>
          <h2>{stats.totalPoints.toLocaleString()}</h2>
          <p>Great progress!</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Accuracy</h4>
            <span className="stat-icon">✓</span>
          </div>
          <h2>{stats.accuracy}%</h2>
          <p>Keep it up!</p>
        </div>

        <div className="stat-card animated-border">
          <div className="stat-header">
            <h4>Current Level</h4>
            <span className="stat-icon">👤</span>
          </div>
          <h2>{stats.currentLevel}</h2>
          <div className="level-bar">
            <div
              className="progress"
              style={{ width: `${(stats.currentXp / stats.xpToNextLevel) * 100}%` }}
            ></div>
          </div>
          <p>{stats.currentXp}/{stats.xpToNextLevel} XP to next level</p>
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
            {activities.length > 0 ? (
              activities.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div className="activity-item" key={activity.id}>
                    <span className={`activity-dot ${style.color}`}>{style.icon}</span>
                    <div className="activity-content">
                      <strong>{activity.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</strong>
                      <span>{activity.description}</span>
                      <small>⏱ {formatTimeAgo(activity.time)}</small>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="activity-item">
                <span className="activity-dot blue">◉</span>
                <div className="activity-content">
                  <strong>Welcome to CodeGenius!</strong>
                  <span>Start solving problems to see your activity here</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="badges-section animated-border">
        <h3>Your Badges</h3>
        <p>Achievements you've earned on your coding journey</p>
        <div className="badge-row">
          {stats.currentLevel === "Bronze" && <span className="badge-item animated-border">🥉 Bronze</span>}
          {(stats.currentLevel === "Silver" || stats.currentLevel === "Gold" || stats.currentLevel === "Platinum") && (
            <>
              <span className="badge-item animated-border">🥉 Bronze</span>
              <span className="badge-item animated-border">🥈 Silver</span>
            </>
          )}
          {(stats.currentLevel === "Gold" || stats.currentLevel === "Platinum") && (
            <span className="badge-item animated-border">🥇 Gold</span>
          )}
          {stats.currentLevel === "Platinum" && (
            <span className="badge-item animated-border">💎 Platinum</span>
          )}
          {stats.accuracy >= 90 && <span className="badge-item animated-border">🏆 Problem Solver</span>}
        </div>
      </div>

      <div className="challenge-card animated-border">
        <h4>📅 Today's Challenge</h4>
        <p>Complete today's challenge to earn bonus points!</p>
        <div className="challenge-box">
          <div>
            <h3>Solve a New Problem</h3>
            <p>Difficulty: Easy • Reward: 50 points</p>
          </div>
          <button className="start-btn" onClick={() => setPage("problemSolving")}>Start Challenge</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
