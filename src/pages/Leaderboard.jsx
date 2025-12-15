import React, { useState, useEffect, useCallback } from "react";
import { getLeaderboard, getUserRank, getUserBadges, getCurrentUser, getUserStats } from "../services/api";
import "../App.css";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [timeFilter, setTimeFilter] = useState("all_time");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [badges, setBadges] = useState([]);
  const [userStats, setUserStats] = useState({ problemsSolved: 0, accuracy: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(timeFilter, 50);
      setLeaderboardData(data.leaderboard || []);
      setTopThree(data.topThree || []);

      // Get current user's rank
      const currentUser = getCurrentUser();
      if (currentUser) {
        const rankData = await getUserRank(currentUser.id);
        setUserRank(rankData.rank || 0);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  const fetchBadges = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Fetch both badges and user stats
        const [badgeData, statsData] = await Promise.all([
          getUserBadges(currentUser.id),
          getUserStats(currentUser.id)
        ]);

        const stats = statsData.stats || { problemsSolved: 0, accuracy: 0, currentStreak: 0 };
        setUserStats(stats);

        // Calculate progress for each badge based on user stats
        const badgesWithProgress = (badgeData.badges || []).map(badge => {
          let progress = badge.progress || 0;

          // If progress is 0 and not earned, calculate it from stats
          if (progress === 0 && !badge.isEarned) {
            const reqValue = badge.requirementValue || 1;
            switch (badge.requirementType) {
              case 'problems_solved':
                progress = Math.min(100, Math.round((stats.problemsSolved / reqValue) * 100));
                break;
              case 'accuracy_rate':
                progress = Math.min(100, Math.round((stats.accuracy / reqValue) * 100));
                break;
              case 'streak':
                progress = Math.min(100, Math.round((stats.currentStreak / reqValue) * 100));
                break;
              default:
                progress = 0;
            }
          }

          return { ...badge, progress: badge.isEarned ? 100 : progress };
        });

        setBadges(badgesWithProgress);
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (activeTab === "badges") {
      fetchBadges();
    }
  }, [activeTab, fetchBadges]);

  // Get badge icon
  const getBadgeIcon = (name) => {
    const icons = {
      Bronze: "🏆",
      Silver: "🛡️",
      Gold: "👑",
      Platinum: "💎",
      "Problem Solver": "◉",
      "Code Optimizer": "<>",
      "Speed Demon": "⏱",
      "Streak Master": "⭐",
    };
    return icons[name] || "🏅";
  };

  // Get badge color class
  const getBadgeColorClass = (color) => {
    const classes = {
      bronze: "bronze",
      silver: "silver",
      gold: "gold",
      platinum: "platinum",
      green: "problem-solver",
      blue: "code-optimizer",
      red: "speed-demon",
      pink: "streak-master",
    };
    return classes[color] || "";
  };

  return (
    <div className="dashboard-container">
      {/* PAGE HEADER */}
      <div className="page-header-row">
        <div>
          <h1 className="welcome-text">Leaderboard & Badges</h1>
          <p className="sub-text">Compete with other developers and earn achievements for your coding skills.</p>
        </div>
        <div className="rank-indicator">
          <span className="rank-label">🏅 Rank</span>
          <span className="rank-number">#{userRank || "-"}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="lb-tabs">
        <button
          className={activeTab === "leaderboard" ? "lb-tab active" : "lb-tab"}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>

        <button
          className={activeTab === "badges" ? "lb-tab active" : "lb-tab"}
          onClick={() => setActiveTab("badges")}
        >
          My Badges
        </button>
      </div>

      {/* =================== LEADERBOARD TAB =================== */}
      {activeTab === "leaderboard" && (
        <>
          {/* TOP PERFORMERS */}
          <div className="top-performers-box">
            <h3>🏆 Top Performers</h3>
            <p>The highest-ranking developers {timeFilter === "this_month" ? "this month" : "of all time"}</p>

            <div className="top-row">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="top-card second-place">
                  {topThree[1].profilePhoto ? (
                    <img src={topThree[1].profilePhoto} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{topThree[1].initials}</div>
                  )}
                  <h4>{topThree[1].name}</h4>
                  <p>{topThree[1].points.toLocaleString()} pts</p>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="top-card top-winner">
                  {topThree[0].profilePhoto ? (
                    <img src={topThree[0].profilePhoto} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{topThree[0].initials}</div>
                  )}
                  <h4>{topThree[0].name}</h4>
                  <p>{topThree[0].points.toLocaleString()} pts</p>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="top-card third-place">
                  {topThree[2].profilePhoto ? (
                    <img src={topThree[2].profilePhoto} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{topThree[2].initials}</div>
                  )}
                  <h4>{topThree[2].name}</h4>
                  <p>{topThree[2].points.toLocaleString()} pts</p>
                </div>
              )}
            </div>
          </div>

          {/* GLOBAL LEADERBOARD */}
          <div className="gl-header-row">
            <h3 className="gl-title">Global Leaderboard</h3>
            <div className="filter-bar">
              <button
                className={`filter-btn ${timeFilter === "all_time" ? "active" : ""}`}
                onClick={() => setTimeFilter("all_time")}
              >
                All Time
              </button>
              <button
                className={`filter-btn ${timeFilter === "this_month" ? "active" : ""}`}
                onClick={() => setTimeFilter("this_month")}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="gl-table-header">
            <span></span>
            <span></span>
            <span></span>
            <span>Problems</span>
            <span>Points</span>
            <span>Accuracy</span>
          </div>

          <div className="global-table">
            {loading ? (
              <div className="gl-row">Loading...</div>
            ) : leaderboardData.length > 0 ? (
              leaderboardData.map((user, index) => (
                <div key={user.id || index} className="gl-row">
                  <span className="crown-col">{index < 3 ? "👑" : ""}</span>
                  <span className="initials-col">{user.initials}</span>
                  <div className="user-info-col">
                    <span className="user-name">{user.name}</span>
                    <div className="user-badges">
                      <span className="badge-tag">{user.level}</span>
                    </div>
                  </div>
                  <span className="problems-col">{user.problemsSolved}</span>
                  <span className="points-col">{user.points.toLocaleString()}</span>
                  <span className="accuracy-col">{user.accuracy}%</span>
                </div>
              ))
            ) : (
              <div className="gl-row">No data available. Be the first to climb the leaderboard!</div>
            )}
          </div>
        </>
      )}

      {/* =================== BADGES TAB =================== */}
      {activeTab === "badges" && (
        <div className="achievements-section">
          <h3>🏅 Your Achievements</h3>
          <p>Unlock badges by solving problems and improving your coding skills</p>

          <div className="badge-grid">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`badge-card ${getBadgeColorClass(badge.color)} ${badge.isEarned ? "" : "locked"}`}
                >
                  <div className={`badge-icon ${badge.color}-icon`}>{getBadgeIcon(badge.name)}</div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  {badge.isEarned ? (
                    <span className="earned-tag">✔ Earned</span>
                  ) : (
                    <>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${badge.progress}%` }}></div>
                      </div>
                      <small>{badge.progress}% complete</small>
                    </>
                  )}
                </div>
              ))
            ) : (
              // Default badges if none loaded - use userStats for progress
              <>
                <div className="badge-card bronze">
                  <div className="badge-icon bronze-icon">🏆</div>
                  <h4>Bronze</h4>
                  <p>Solve 10 problems</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((userStats.problemsSolved / 10) * 100))}%` }}></div>
                  </div>
                  <small>{Math.min(100, Math.round((userStats.problemsSolved / 10) * 100))}% complete</small>
                </div>

                <div className="badge-card silver">
                  <div className="badge-icon silver-icon">🛡️</div>
                  <h4>Silver</h4>
                  <p>Solve 25 problems</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((userStats.problemsSolved / 25) * 100))}%` }}></div>
                  </div>
                  <small>{Math.min(100, Math.round((userStats.problemsSolved / 25) * 100))}% complete</small>
                </div>

                <div className="badge-card gold">
                  <div className="badge-icon gold-icon">👑</div>
                  <h4>Gold</h4>
                  <p>Solve 50 problems</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((userStats.problemsSolved / 50) * 100))}%` }}></div>
                  </div>
                  <small>{Math.min(100, Math.round((userStats.problemsSolved / 50) * 100))}% complete</small>
                </div>

                <div className="badge-card platinum">
                  <div className="badge-icon platinum-icon">💎</div>
                  <h4>Platinum</h4>
                  <p>Solve 100 problems</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((userStats.problemsSolved / 100) * 100))}%` }}></div>
                  </div>
                  <small>{Math.min(100, Math.round((userStats.problemsSolved / 100) * 100))}% complete</small>
                </div>
              </>
            )}
          </div>
        </div>
      )
      }
    </div >
  );
}

export default Leaderboard;
