import React, { useState, useEffect } from "react";
import { getUserStats, getUserActivity, getCurrentUser, getContestBadges } from "../services/api";
import "./Dashboard.css"; // Use the newly created module

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
  const [dailyProblem, setDailyProblem] = useState(null);
  const [isDailySolved, setIsDailySolved] = useState(false);

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
      const statsData = await getUserStats(currentUser.id);
      if (statsData.stats) {
        setStats(statsData.stats);
      }

      // Fetch recent activity
      const activityData = await getUserActivity(currentUser.id, 5);
      if (activityData.activities) {
        setActivities(activityData.activities);
      }

      // Fetch daily problem
      const dailyRes = await fetch("http://localhost:4000/api/problem-generate/daily");
      const dailyData = await dailyRes.json();
      if (dailyData && dailyData.title) {
        setDailyProblem(dailyData);
        // Check if solved today
        const solvedToday = activityData.activities?.some(a => 
          a.type === "problem_solved" && a.description.includes(dailyData.title)
        );
        setIsDailySolved(!!solvedToday);
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

  useEffect(() => {
    // Trigger a fresh fetch every time Dashboard is rendered
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleFocus = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleStatsUpdated = (event) => {
      console.log("📊 Stats updated event received:", event.detail);
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

    if (diffMins < 60) return `${diffMins || 1} min ago`;
    if (diffHours < 24) return `Today`;
    if (diffDays === 1) return `1 day ago`;
    return `${diffDays} days ago`;
  };

  // Get activity icon/color mapped to new styles
  const getActivityStyle = (type) => {
    const styles = {
      login: { icon: "👤", color: "blue" },
      registration: { icon: "🎉", color: "purple" },
      problem_solved: { icon: "✅", color: "success" },
      problem_attempted: { icon: "🔄", color: "blue" },
      code_analyzed: { icon: "🧠", color: "blue" },
      code_converted: { icon: "🔁", color: "purple" },
      project_uploaded: { icon: "📦", color: "purple" },
      badge_earned: { icon: "🎖️", color: "success" },
      level_up: { icon: "⭐", color: "purple" },
    };
    return styles[type] || { icon: "⚡", color: "blue" };
  };

  if (loading) {
    return (
      <div className="dev-dashboard" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading command center...</p>
      </div>
    );
  }

  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="dev-dashboard">
      
      {/* 1. TOP CONTROL HEADER */}
      <div className="dash-header-section">
        
        <div className="dash-header-left">
          <div className="dash-avatar">
            {initial}
            <div className="dash-avatar-status"></div>
          </div>
          <div className="dash-user-info">
            <h2 className="dash-user-name">{user.fullName || "Developer User"}</h2>
            <div className="dash-level-row">
              <span className="dash-level-badge">{stats.currentLevel}</span>
              <span>•</span>
              <span>{Math.floor(stats.currentXp)} / {Math.floor(stats.xpToNextLevel)} XP</span>
              <div className="dash-xp-bar-container">
                <div 
                  className="dash-xp-bar-fill" 
                  style={{ width: `${Math.min(100, (stats.currentXp / Math.max(1, stats.xpToNextLevel)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-header-center">
          <div className="dash-hc-stat">
            <span className="dash-hc-icon">🔥</span>
            <div className="dash-hc-text">
              <span className="dash-hc-val">1</span>
              <span className="dash-hc-lbl">Day Streak</span>
            </div>
          </div>
          <div className="dash-hc-stat">
            <span className="dash-hc-icon" style={{color: '#34d399'}}>✔️</span>
            <div className="dash-hc-text">
              <span className="dash-hc-val">{stats.accuracy}%</span>
              <span className="dash-hc-lbl">Accuracy</span>
            </div>
          </div>
        </div>

        <div className="dash-header-right">
          <button className="dash-btn" onClick={() => setPage("analyzer")}>
            <span style={{color: '#8b5cf6'}}>&lt;&gt;</span> Analyze
          </button>
          <button className="dash-btn" onClick={() => setPage("converter")}>
            <span style={{color: '#3b82f6'}}>⟲</span> Convert
          </button>
          <button className="dash-btn" onClick={() => { setLoading(true); fetchData(); }}>
            <span style={{color: '#94a3b8'}}>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* 2. MAIN GRID */}
      <div className="dash-main-grid">
        
        {/* LEFT COLUMN */}
        <div className="dash-col-left">

          {/* Today's Focus */}
          <div className="dash-panel dash-focus-card">
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">🎯 Today's Focus</h3>
              <p className="dash-panel-subtitle">Resume your last problem and maintain your streak.</p>
            </div>
            
            <div className="dash-focus-main">
              <div className="dash-fm-left">
                <h4>{dailyProblem?.title || "Daily Coding Challenge"}</h4>
                <p>
                  {isDailySolved ? "✅ Task Completed for today" : "Last solved 1 day ago"} 
                  <span className="dash-fm-tag">• {dailyProblem?.category || "Logic"}</span>
                </p>
              </div>
              <button 
                className={`dash-btn-primary ${isDailySolved ? 'solved-btn' : ''}`}
                onClick={() => setPage({ name: "problemSolving", problem: dailyProblem })}
                disabled={isDailySolved}
              >
                {isDailySolved ? "Problem Solved" : "▶ Continue Solving"}
              </button>
            </div>

            <div className="dash-suggested-row">
              <span style={{color: '#94a3b8'}}>Difficulty:</span>
              <button className="dash-suggest-btn">
                <div className={`dash-dot ${dailyProblem?.difficulty === 'Easy' ? 'green' : 'yellow'}`}></div> 
                {dailyProblem?.difficulty || "Medium"}
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dash-panel" style={{ flex: 1 }}>
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">📈 Recent Activity</h3>
              <br/>
            </div>
            
            <div className="dash-timeline">
              {activities.length > 0 ? (
                activities.map((activity, idx) => {
                  const style = getActivityStyle(activity.type);
                  return (
                    <div className="dash-timeline-item" key={activity.id || idx}>
                      <div className={`dash-t-icon ${style.color}`}>{style.icon}</div>
                      <div className="dash-t-content">
                        <h4 className="dash-t-title">
                          {activity.description}
                          {activity.type === "problem_solved" && <span className="dash-t-xp">+20 XP</span>}
                          {activity.type === "code_analyzed" && <span className="dash-t-xp">+15 XP</span>}
                        </h4>
                        <span className="dash-t-meta">
                          {formatTimeAgo(activity.time)} 
                          {activity.type === "problem_solved" && <span className="dash-t-highlight">Easy</span>}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback Mock Timeline if empty */
                <>
                  <div className="dash-timeline-item">
                    <div className="dash-t-icon success">✅</div>
                    <div className="dash-t-content">
                      <h4 className="dash-t-title">Solved Reverse a Linked List <span className="dash-t-xp">+20 XP</span></h4>
                      <span className="dash-t-meta">Today <span className="dash-t-highlight">Easy</span></span>
                    </div>
                  </div>
                  <div className="dash-timeline-item">
                    <div className="dash-t-icon purple">🏆</div>
                    <div className="dash-t-content">
                      <h4 className="dash-t-title">Joined Weekly Contest #450</h4>
                      <span className="dash-t-meta">2 days ago <span className="dash-t-highlight" style={{background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8'}}>Rank #128</span></span>
                    </div>
                  </div>
                  <div className="dash-timeline-item">
                    <div className="dash-t-icon blue">🧠</div>
                    <div className="dash-t-content">
                      <h4 className="dash-t-title">Analyzed 3 solutions with AI <span className="dash-t-xp">+15 XP</span></h4>
                      <span className="dash-t-meta">2 days ago</span>
                    </div>
                  </div>
                  <div className="dash-timeline-item">
                    <div className="dash-t-icon blue">👤</div>
                    <div className="dash-t-content">
                      <h4 className="dash-t-title">Logged in</h4>
                      <span className="dash-t-meta">3 days ago</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col-right">

          {/* Performance Panel */}
          <div className="dash-panel">
            <h3 className="dash-panel-title" style={{marginBottom: '24px'}}>📈 Your Performance</h3>
            
            <div className="dash-perf-row">
              <div className="dash-perf-top">
                <div className="dash-perf-icon-row">
                  <div className="dash-perf-icon bg-blue">🎯</div>
                  <span>Problems Solved</span>
                </div>
                <span className="dash-perf-val">{stats.problemsSolved} / 50</span>
              </div>
              <div className="dash-perf-bar-bg">
                <div className="dash-perf-fill blue" style={{width: `${Math.min(100, (stats.problemsSolved / 50) * 100)}%`}}></div>
              </div>
            </div>

            <div className="dash-perf-row">
              <div className="dash-perf-top">
                <div className="dash-perf-icon-row">
                  <div className="dash-perf-icon bg-purple">✔️</div>
                  <span>Accuracy</span>
                </div>
                <span className="dash-perf-val">{stats.accuracy}%</span>
              </div>
              <div className="dash-perf-bar-bg">
                <div className="dash-perf-fill purple" style={{width: `${stats.accuracy}%`}}></div>
              </div>
            </div>

            <div className="dash-perf-row">
              <div className="dash-perf-top">
                <div className="dash-perf-icon-row">
                  <div className="dash-perf-icon bg-green">📈</div>
                  <span>XP Growth</span>
                </div>
                <span className="dash-perf-val">+{Math.floor(stats.currentXp)} XP</span>
              </div>
              <div className="dash-perf-bar-bg">
                <div className="dash-perf-fill green" style={{width: '65%'}}></div>
              </div>
            </div>
          </div>

          {/* Quick Actions Component */}
          <div className="dash-panel">
            <h3 className="dash-panel-title" style={{marginBottom: '20px'}}>⚡ Quick Actions</h3>
            
            <div className="dash-qa-grid">
              
              <div className="dash-qa-card" onClick={() => setPage("problemSolving")}>
                <div className="dash-qa-icon cyan">🎯</div>
                <div className="dash-qa-text">
                  <h4>Solve Problems</h4>
                  <p>Practice coding</p>
                </div>
                <span className="dash-qa-arrow">→</span>
              </div>

              <div className="dash-qa-card" onClick={() => setPage("analyzer")}>
                <div className="dash-qa-icon purple">&lt;&gt;</div>
                <div className="dash-qa-text">
                  <h4>Analyze Code</h4>
                  <p>Get AI insights</p>
                </div>
                <span className="dash-qa-arrow">→</span>
              </div>

              <div className="dash-qa-card" onClick={() => setPage("converter")}>
                <div className="dash-qa-icon blue">⟲</div>
                <div className="dash-qa-text">
                  <h4>Convert Code</h4>
                  <p>Between languages</p>
                </div>
                <span className="dash-qa-arrow">→</span>
              </div>

              <div className="dash-qa-card" onClick={() => setPage("contests")}>
                <div className="dash-qa-icon yellow">🏆</div>
                <div className="dash-qa-text">
                  <h4>Contests</h4>
                  <p>Join challenges</p>
                </div>
                <span className="dash-qa-arrow">→</span>
              </div>

            </div>
          </div>

          {/* Daily Challenge Component */}
          {(() => {
            const solvedTodayCount = activities.filter(a => {
              if (a.type !== "problem_solved") return false;
              if (!a.time) return true; // assuming mock data without time is today
              const actDate = new Date(a.time);
              const now = new Date();
              return actDate.getDate() === now.getDate() && 
                     actDate.getMonth() === now.getMonth() && 
                     actDate.getFullYear() === now.getFullYear();
            }).length;
            const targetDaily = 2;
            const progress = Math.min(solvedTodayCount, targetDaily);
            const isCompleted = progress >= targetDaily;

            return (
              <div className="dash-panel dash-daily-panel">
                <div className="dash-daily-left">
                  <div className="dash-daily-icon">⚡</div>
                  <div className="dash-daily-text">
                    <h4>Daily Challenge</h4>
                    <p>{isCompleted ? "Challenge Complete! Awesome work!" : "Solve 2 problems today to complete your challenge!"}</p>
                  </div>
                </div>
                <div className="dash-daily-right">
                  <div className="dash-daily-prog-text">Progress <span>{progress} / {targetDaily}</span></div>
                  <div className="dash-daily-prog-bar-bg">
                     <div className="dash-daily-prog-bar-fill" style={{width: `${(progress / targetDaily) * 100}%`, background: isCompleted ? '#10B981' : undefined}}></div>
                  </div>
                  <button 
                    className="dash-daily-btn" 
                    onClick={() => setPage("problemSolving")}
                    style={{ opacity: isCompleted ? 0.6 : 1, cursor: isCompleted ? 'default' : 'pointer' }}
                  >
                    {isCompleted ? "Done" : "Start Challenge"}
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </div>



    </div>
  );
}

export default Dashboard;
