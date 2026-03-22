import React, { useState, useEffect } from "react";
import { getUserStats, getUserActivity, getCurrentUser, getContestBadges } from "../services/api";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [contestBadges, setContestBadges] = useState([]);

  // Extract fetchData so it can be called from multiple places
  const fetchData = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setUser(currentUser);

    try {
      // Fetch user stats
      console.log("📊 Fetching stats for user ID:", currentUser.id);
      const statsData = await getUserStats(currentUser.id);
      console.log("📊 Stats received:", statsData.stats);
      if (statsData.stats) {
        setStats(statsData.stats);
      }

      // Fetch recent activity
      const activityData = await getUserActivity(currentUser.id, 5);
      if (activityData.activities) {
        setActivities(activityData.activities);
      }

      // Fetch contest badges
      const badgeData = await getContestBadges(currentUser.id);
      if (badgeData.success) {
        setContestBadges(badgeData.badges);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when refreshKey changes
  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Refetch data when component mounts (user navigates to dashboard)
  // This runs every time the Dashboard component appears on screen
  useEffect(() => {
    // Trigger a fresh fetch every time Dashboard is rendered
    setRefreshKey(prev => prev + 1);
  }, []); // Empty array means this runs on mount

  // Also refetch when page becomes visible (user switches browser tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshKey(prev => prev + 1);
      }
    };

    // Also listen for window focus (when clicking back into the window)
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1);
    };

    // Listen for stats update events from problem solving
    const handleStatsUpdated = (event) => {
      console.log("📊 Stats updated event received:", event.detail);
      // Small delay to ensure database has committed the changes
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('statsUpdated', handleStatsUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('statsUpdated', handleStatsUpdated);
    };
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
      <div className="db-page problem-solving-page">
        <div className="db-loading">
          <span className="loading-icon">⏳</span>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page problem-solving-page">
      {/* HEADER */}
      <div className="ps-header">
        <div className="ps-header-left">
          <h1 className="ps-page-title">Welcome back, {user.fullName?.split(" ")[0] || "User"}! 👋</h1>
          <p className="ps-page-subtitle">Here's what's happening with your coding journey today.</p>
        </div>
        <div className="ps-header-actions">
          <button
            className="ps-generate-btn"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🔄</span> Refresh Stats
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="db-stats-grid">
        <div className="db-stat-card">
          <div className="db-stat-header">
            <span className="db-stat-icon blue">🎯</span>
            <span className="db-stat-label">Problems Solved</span>
          </div>
          <div className="db-stat-value">{stats.problemsSolved}</div>
          <div className="db-stat-desc">Keep solving!</div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-header">
            <span className="db-stat-icon green">📈</span>
            <span className="db-stat-label">Total Points</span>
          </div>
          <div className="db-stat-value">{stats.totalPoints.toLocaleString()}</div>
          <div className="db-stat-desc">Great progress!</div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-header">
            <span className="db-stat-icon purple">✓</span>
            <span className="db-stat-label">Accuracy</span>
          </div>
          <div className="db-stat-value">{stats.accuracy}%</div>
          <div className="db-stat-desc">Keep it up!</div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-header">
            <span className="db-stat-icon gold">👤</span>
            <span className="db-stat-label">Current Level</span>
          </div>
          <div className="db-stat-value">{stats.currentLevel}</div>
          <div className="db-progress-bar">
            <div
              className="db-progress-fill"
              style={{ width: `${stats.xpProgress || Math.min(100, (stats.currentXp / (stats.xpToNextLevel || 1000)) * 100)}%` }}
            ></div>
          </div>
          <div className="db-stat-desc">{stats.currentXp || 0}/{stats.xpToNextLevel || 1000} XP to next level</div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="db-main-grid">
        {/* LEFT - Quick Actions */}
        <div className="db-panel">
          <div className="db-panel-header">
            <span className="db-panel-icon">⚡</span>
            <div>
              <h3 className="db-panel-title">Quick Actions</h3>
              <p className="db-panel-subtitle">Jump into your favorite activities</p>
            </div>
          </div>
          <div className="db-panel-content">
            <div className="db-action-card" onClick={() => setPage("analyzer")}>
              <div className="db-action-icon blue">&lt;&gt;</div>
              <div className="db-action-info">
                <h4>Analyze Code</h4>
                <p>Get AI-powered insights</p>
              </div>
              <span className="db-action-arrow">→</span>
            </div>

            <div className="db-action-card" onClick={() => setPage("problemSolving")}>
              <div className="db-action-icon green">◉</div>
              <div className="db-action-info">
                <h4>Solve Problems</h4>
                <p>Practice coding challenges</p>
              </div>
              <span className="db-action-arrow">→</span>
            </div>

            <div className="db-action-card" onClick={() => setPage("converter")}>
              <div className="db-action-icon purple">⟲</div>
              <div className="db-action-info">
                <h4>Convert Code</h4>
                <p>Transform between languages</p>
              </div>
              <span className="db-action-arrow">→</span>
            </div>

            <div className="db-action-card" onClick={() => setPage("leaderboard")}>
              <div className="db-action-icon gold">🏅</div>
              <div className="db-action-info">
                <h4>View Leaderboard</h4>
                <p>See your ranking</p>
              </div>
              <span className="db-action-arrow">→</span>
            </div>
          </div>
        </div>

        {/* RIGHT - Recent Activity */}
        <div className="db-panel">
          <div className="db-panel-header">
            <span className="db-panel-icon">📊</span>
            <div>
              <h3 className="db-panel-title">Recent Activity</h3>
              <p className="db-panel-subtitle">Your latest coding activities</p>
            </div>
          </div>
          <div className="db-panel-content">
            {activities.length > 0 ? (
              activities.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div className="db-activity-item" key={activity.id}>
                    <span className={`db-activity-dot ${style.color}`}>{style.icon}</span>
                    <div className="db-activity-content">
                      <strong>{activity.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</strong>
                      <span>{activity.description}</span>
                      <small>⏱ {formatTimeAgo(activity.time)}</small>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="db-activity-item">
                <span className="db-activity-dot blue">◉</span>
                <div className="db-activity-content">
                  <strong>Welcome to CodeGenius!</strong>
                  <span>Start solving problems to see your activity here</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="db-bottom-grid">
        {/* Badges Section */}
        <div className="db-panel db-badges-panel">
          <div className="db-panel-header">
            <span className="db-panel-icon">🏆</span>
            <div>
              <h3 className="db-panel-title">Your Badges</h3>
              <p className="db-panel-subtitle">Achievements you've earned</p>
            </div>
          </div>
          <div className="db-badges-grid">
            {stats.currentLevel === "Bronze" && <span className="db-badge">🥉 Bronze</span>}
            {(stats.currentLevel === "Silver" || stats.currentLevel === "Gold" || stats.currentLevel === "Platinum") && (
              <>
                <span className="db-badge">🥉 Bronze</span>
                <span className="db-badge">🥈 Silver</span>
              </>
            )}
            {(stats.currentLevel === "Gold" || stats.currentLevel === "Platinum") && (
              <span className="db-badge">🥇 Gold</span>
            )}
            {stats.currentLevel === "Platinum" && (
              <span className="db-badge">💎 Platinum</span>
            )}
            {stats.accuracy >= 90 && <span className="db-badge">🏆 Problem Solver</span>}

            {/* Contest Badges */}
            {contestBadges.map(badge => (
              <span
                key={badge.id}
                className="db-badge contest-badge"
                style={{ borderColor: badge.badge_color }}
                title={`${badge.badge_name}: ${badge.description} (${badge.contest_title})`}
              >
                {badge.badge_icon} {badge.badge_name}
              </span>
            ))}
          </div>
        </div>

        {/* Today's Challenge */}
        <div className="db-panel db-challenge-panel">
          <div className="db-panel-header">
            <span className="db-panel-icon">📅</span>
            <div>
              <h3 className="db-panel-title">Today's Challenge</h3>
              <p className="db-panel-subtitle">Complete to earn bonus points!</p>
            </div>
          </div>
          <div className="db-challenge-content">
            <div className="db-challenge-info">
              <h4>Solve a New Problem</h4>
              <p>Difficulty: Easy • Reward: 50 points</p>
            </div>
            <button className="db-challenge-btn" onClick={() => setPage("problemSolving")}>
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
