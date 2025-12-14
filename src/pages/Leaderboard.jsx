import React, { useState } from "react";
import "../App.css";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [timeFilter, setTimeFilter] = useState("allTime");

  // ALL TIME USERS FOR GLOBAL LEADERBOARD
  const allTimeUsers = [
    { name: "Sarah Chen", initials: "SC", badge: "Platinum", title: "Code Master", problems: 287, points: 8950, accuracy: "94%" },
    { name: "Marcus Rodriguez", initials: "MR", badge: "Gold", title: "Problem Solver", problems: 245, points: 8240, accuracy: "92%" },
    { name: "Emily Zhang", initials: "EZ", badge: "Silver", title: "", problems: 189, points: 6150, accuracy: "88%" },
    { name: "John Carter", initials: "JC", badge: "Bronze", title: "", problems: 156, points: 5100, accuracy: "81%" },
    { name: "Aditi Mehra", initials: "AM", badge: "Platinum", title: "Speed Demon", problems: 312, points: 9800, accuracy: "95%" },
    { name: "Michael Lee", initials: "ML", badge: "Gold", title: "", problems: 234, points: 7700, accuracy: "90%" },
    { name: "Samantha Ray", initials: "SR", badge: "Bronze", title: "", problems: 98, points: 4200, accuracy: "75%" },
    { name: "Daniel Kim", initials: "DK", badge: "Silver", title: "", problems: 167, points: 5600, accuracy: "84%" },
    { name: "Priya Sinha", initials: "PS", badge: "Gold", title: "", problems: 223, points: 7300, accuracy: "89%" },
    { name: "Tom Wilson", initials: "TW", badge: "Silver", title: "", problems: 178, points: 5800, accuracy: "85%" },
  ];

  // THIS MONTH USERS - Different ordering/data for this month
  const thisMonthUsers = [
    { name: "Aditi Mehra", initials: "AM", badge: "Platinum", title: "Speed Demon", problems: 45, points: 1450, accuracy: "96%" },
    { name: "Sarah Chen", initials: "SC", badge: "Platinum", title: "Code Master", problems: 38, points: 1220, accuracy: "95%" },
    { name: "Michael Lee", initials: "ML", badge: "Gold", title: "", problems: 32, points: 1080, accuracy: "91%" },
    { name: "Marcus Rodriguez", initials: "MR", badge: "Gold", title: "Problem Solver", problems: 28, points: 920, accuracy: "93%" },
    { name: "Priya Sinha", initials: "PS", badge: "Gold", title: "", problems: 25, points: 840, accuracy: "88%" },
    { name: "Daniel Kim", initials: "DK", badge: "Silver", title: "", problems: 22, points: 720, accuracy: "86%" },
    { name: "Emily Zhang", initials: "EZ", badge: "Silver", title: "", problems: 19, points: 620, accuracy: "84%" },
    { name: "Tom Wilson", initials: "TW", badge: "Silver", title: "", problems: 16, points: 540, accuracy: "82%" },
    { name: "John Carter", initials: "JC", badge: "Bronze", title: "", problems: 12, points: 380, accuracy: "79%" },
    { name: "Samantha Ray", initials: "SR", badge: "Bronze", title: "", problems: 8, points: 260, accuracy: "75%" },
  ];

  // Get users based on selected filter
  const displayUsers = timeFilter === "allTime" ? allTimeUsers : thisMonthUsers;

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
          <span className="rank-number">#4</span>
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
            <p>The highest-ranking developers this month</p>

            <div className="top-row">
              {/* 2nd Place */}
              <div className="top-card second-place">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
                <h4>Marcus Rodriguez</h4>
                <p>8,240 pts</p>
              </div>

              {/* 1st Place */}
              <div className="top-card top-winner">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
                <h4>Sarah Chen</h4>
                <p>8,950 pts</p>
              </div>

              {/* 3rd Place */}
              <div className="top-card third-place">
                <img src="https://randomuser.me/api/portraits/women/50.jpg" alt="" />
                <h4>Emily Zhang</h4>
                <p>6,150 pts</p>
              </div>
            </div>
          </div>

          {/* GLOBAL LEADERBOARD */}
          <div className="gl-header-row">
            <h3 className="gl-title">Global Leaderboard</h3>
            <div className="filter-bar">
              <button
                className={`filter-btn ${timeFilter === "allTime" ? "active" : ""}`}
                onClick={() => setTimeFilter("allTime")}
              >
                All Time
              </button>
              <button
                className={`filter-btn ${timeFilter === "thisMonth" ? "active" : ""}`}
                onClick={() => setTimeFilter("thisMonth")}
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
            {displayUsers.map((user, index) => (
              <div key={index} className="gl-row">
                <span className="crown-col">👑</span>
                <span className="initials-col">{user.initials}</span>
                <div className="user-info-col">
                  <span className="user-name">{user.name}</span>
                  <div className="user-badges">
                    <span className="badge-tag">{user.badge}</span>
                    {user.title && <span className="title-tag">{user.title}</span>}
                  </div>
                </div>
                <span className="problems-col">{user.problems}</span>
                <span className="points-col">{user.points.toLocaleString()}</span>
                <span className="accuracy-col">{user.accuracy}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =================== BADGES TAB =================== */}
      {activeTab === "badges" && (
        <div className="achievements-section">
          <h3>🏅 Your Achievements</h3>
          <p>Unlock badges by solving problems and improving your coding skills</p>

          <div className="badge-grid">
            <div className="badge-card bronze">
              <div className="badge-icon bronze-icon">🏆</div>
              <h4>Bronze</h4>
              <p>Solve 10 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card silver">
              <div className="badge-icon silver-icon">🛡️</div>
              <h4>Silver</h4>
              <p>Solve 25 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card gold">
              <div className="badge-icon gold-icon">👑</div>
              <h4>Gold</h4>
              <p>Solve 50 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card platinum">
              <div className="badge-icon platinum-icon">💎</div>
              <h4>Platinum</h4>
              <p>Solve 100 problems</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "47%" }}></div>
              </div>
              <small>47% complete</small>
            </div>

            <div className="badge-card problem-solver">
              <div className="badge-icon green-icon">◉</div>
              <h4>Problem Solver</h4>
              <p>90%+ accuracy rate</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card code-optimizer">
              <div className="badge-icon blue-icon">{"<>"}</div>
              <h4>Code Optimizer</h4>
              <p>Submit optimal solutions</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card speed-demon">
              <div className="badge-icon red-icon">⏱</div>
              <h4>Speed Demon</h4>
              <p>Fast submission times</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "65%" }}></div>
              </div>
              <small>65% complete</small>
            </div>

            <div className="badge-card streak-master">
              <div className="badge-icon pink-icon">⭐</div>
              <h4>Streak Master</h4>
              <p>30-day solving streak</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "10%" }}></div>
              </div>
              <small>10% complete</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
