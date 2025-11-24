import React, { useState } from "react";
import "../App.css";

function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="dashboard-container">
      {/* PAGE TITLE */}
      <h1 className="welcome-text">Profile Settings</h1>
      <p className="sub-text">Manage your account information and track your coding progress.</p>

      {/* TABS */}
      <div className="profile-tabs">
        <button
          className={activeTab === "profile" ? "p-tab active" : "p-tab"}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>

        <button className="p-tab">Statistics</button>
        <button className="p-tab">Submissions</button>
        <button className="p-tab">Achievements</button>
      </div>

      {/* ---------------- LEFT + RIGHT LAYOUT ---------------- */}
      <div className="profile-layout">

        {/* ---------------- LEFT SIDE ---------------- */}
        <div className="profile-left">
          <div className="profile-pic-box">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="profile"
              className="profile-pic"
            />
            <h2>Alex Chen</h2>
            <p className="email-text">alex.chen@example.com</p>

            <span className="level-badge">Gold Level</span>

            <div className="stats-box">
              <div>
                <h2>47</h2>
                <p>Problems Solved</p>
              </div>
              <div>
                <h2>89%</h2>
                <p>Accuracy</p>
              </div>
            </div>

            <p className="progress-title">Progress to Platinum</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "75%" }}></div>
            </div>
            <small>750 / 1000 XP</small>
          </div>
        </div>

        {/* ---------------- RIGHT SIDE ---------------- */}
        <div className="profile-right">
          <div className="info-card">
            <div className="info-header">
              <h3>Personal Information</h3>
              <button className="edit-btn">✏ Edit</button>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <p>Alex Chen</p>
              </div>

              <div className="info-item">
                <label>Email</label>
                <p>alex.chen@example.com</p>
              </div>

              <div className="info-item full">
                <label>Bio</label>
                <p>
                  Passionate full-stack developer with expertise in React, Node.js,
                  and Python. Loves building modern applications.
                </p>
              </div>

              <div className="info-item">
                <label>Location</label>
                <p>San Francisco, CA</p>
              </div>

              <div className="info-item">
                <label>GitHub</label>
                <p>github.com/alexchen</p>
              </div>

              <div className="info-item">
                <label>LinkedIn</label>
                <p>linkedin.com/in/alexchen</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfileSettings;
