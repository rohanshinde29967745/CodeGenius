import React, { useState } from "react";
import "../App.css";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState("leaderboard");

  // MANY USERS FOR GLOBAL LEADERBOARD (scrollable)
  const globalUsers = [
    { name: "Sarah Chen", rank: 1, badge: "Platinum", points: 8950, accuracy: "94%" },
    { name: "Marcus Rodriguez", rank: 2, badge: "Gold", points: 8240, accuracy: "92%" },
    { name: "Emily Zhang", rank: 3, badge: "Silver", points: 6150, accuracy: "88%" },
    { name: "John Carter", rank: 4, badge: "Bronze", points: 5100, accuracy: "81%" },
    { name: "Aditi Mehra", rank: 5, badge: "Platinum", points: 9800, accuracy: "95%" },
    { name: "Michael Lee", rank: 6, badge: "Gold", points: 7700, accuracy: "90%" },
    { name: "Samantha Ray", rank: 7, badge: "Bronze", points: 4200, accuracy: "75%" },
    { name: "Daniel Kim", rank: 8, badge: "Silver", points: 5600, accuracy: "84%" },
    { name: "Priya Sinha", rank: 9, badge: "Gold", points: 7300, accuracy: "89%" },
    { name: "Tom Wilson", rank: 10, badge: "Silver", points: 5800, accuracy: "85%" },
    // Add more if needed
  ];

  return (
    <div className="dashboard-container">
      {/* PAGE HEADER */}
      <h1 className="welcome-text">Leaderboard & Badges</h1>
      <p className="sub-text">Compete with top developers worldwide.</p>

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
              <div className="top-card">
                <img src="https://randomuser.me/api/portraits/men/41.jpg" alt="" />
                <h4>Marcus Rodriguez</h4>
                <p>8,240 pts</p>
              </div>

              <div className="top-card top-winner">
                <div className="top-initial">SC</div>
                <h4>Sarah Chen</h4>
                <span className="winner-label">Code Master</span>
                <p>8,950 pts</p>
              </div>

              <div className="top-card">
                <img src="https://randomuser.me/api/portraits/women/50.jpg" alt="" />
                <h4>Emily Zhang</h4>
                <p>6,150 pts</p>
              </div>
            </div>
          </div>

          {/* GLOBAL LEADERBOARD */}
          <h3 className="gl-title">Global Leaderboard</h3>

          <div className="filter-bar">
            <button className="filter-btn active">All Time</button>
            <button className="filter-btn">This Month</button>
          </div>

          <div className="global-table">
            {globalUsers.map((user, index) => (
              <div key={index} className="gl-row">
                <span className="rank">#{user.rank}</span>
                <span className="user">{user.name}</span>
                <span className="badge">{user.badge}</span>
                <span className="points">{user.points} pts</span>
                <span className="accuracy">{user.accuracy}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =================== BADGES TAB =================== */}
      {activeTab === "badges" && (
        <div className="achievements-section">
          <h3>Your Achievements</h3>
          <p>Unlock badges by solving problems and improving your coding skills</p>

          <div className="badge-grid">
            <div className="badge-card bronze">
              <h4>🥉 Bronze</h4>
              <p>Solve 10 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card silver">
              <h4>🥈 Silver</h4>
              <p>Solve 25 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card gold">
              <h4>🥇 Gold</h4>
              <p>Solve 50 problems</p>
              <span className="earned-tag">✔ Earned</span>
            </div>

            <div className="badge-card platinum">
              <h4>👑 Platinum</h4>
              <p>Solve 100 problems</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "47%" }}></div>
              </div>
              <small>47% complete</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
