import React, { useState, useRef, useEffect } from "react";
import { getCurrentUser, getProfile, updateUserProfile, getUserProjects, getUserStats, getUserBadges, getUserSkills } from "../services/api";
import "../App.css";

function ProfileSettings({ isDark, toggleTheme, setIsLoggedIn, setPage }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ref for file input
  const fileInputRef = useRef(null);

  // Personal Info State
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    bio: "",
    location: "",
    github: "",
    linkedin: ""
  });

  // Stats state
  const [stats, setStats] = useState({
    problemsSolved: 0,
    accuracy: 0,
    currentLevel: "Bronze",
    currentXp: 0,
    xpToNextLevel: 1000,
    totalPoints: 0,
    currentStreak: 0,
    rank: 0
  });

  // User projects from database
  const [userProjects, setUserProjects] = useState([]);

  // User badges from database
  const [badges, setBadges] = useState([]);

  // User skills from database
  const [skills, setSkills] = useState([]);

  // Load user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const data = await getProfile(currentUser.id);
        if (data.user) {
          setProfileData({
            fullName: data.user.fullName || "",
            email: data.user.email || "",
            bio: data.user.bio || "",
            location: data.user.location || "",
            github: data.user.github || "",
            linkedin: data.user.linkedin || ""
          });
          setProfilePhoto(data.user.profilePhoto || "");
        }

        // Fetch stats
        const statsData = await getUserStats(currentUser.id);
        if (statsData.stats) {
          setStats({
            problemsSolved: statsData.stats.problemsSolved || 0,
            accuracy: statsData.stats.accuracy || 0,
            currentLevel: statsData.stats.currentLevel || "Bronze",
            currentXp: statsData.stats.currentXp || 0,
            xpToNextLevel: statsData.stats.xpToNextLevel || 1000,
            totalPoints: statsData.stats.totalPoints || 0,
            currentStreak: statsData.stats.currentStreak || 0,
            rank: statsData.stats.rank || 0
          });
        }

        // Fetch user's projects
        const projectsData = await getUserProjects(currentUser.id);
        setUserProjects(projectsData.projects || []);

        // Fetch badges
        const badgesData = await getUserBadges(currentUser.id);
        setBadges(badgesData.badges || []);

        // Fetch skills
        const skillsData = await getUserSkills(currentUser.id);
        setSkills(skillsData.skills || []);

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setPage("home");
  };

  const handleSaveProfile = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, {
        fullName: profileData.fullName,
        bio: profileData.bio,
        location: profileData.location,
        github: profileData.github,
        linkedin: profileData.linkedin,
        profilePhoto: profilePhoto
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle profile photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Group projects by category
  const groupedProjects = userProjects.reduce((acc, project) => {
    const category = project.category || "Other";
    if (!acc[category]) {
      acc[category] = { icon: getCategoryIcon(category), projects: [] };
    }
    acc[category].projects.push(project);
    return acc;
  }, {});

  function getCategoryIcon(category) {
    const icons = {
      "Web Development": "🌐",
      "Data Science": "📊",
      "Machine Learning": "🤖",
      "Mobile Apps": "📱",
      "Other": "📁"
    };
    return icons[category] || "📁";
  }

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setSelectedProject(null);
  };

  // Get badge icon
  const getBadgeIcon = (name) => {
    const icons = {
      Bronze: "🏆",
      Silver: "🛡️",
      Gold: "👑",
      Platinum: "💎",
      "Problem Solver": "◎",
      "Code Optimizer": "<>",
      "Speed Demon": "⏱",
      "Streak Master": "⭐"
    };
    return icons[name] || "🏅";
  };

  // Get badge background class
  const getBadgeBgClass = (color) => {
    const classes = {
      bronze: "bronze-bg",
      silver: "silver-bg",
      gold: "gold-bg",
      platinum: "platinum-bg",
      green: "green-bg",
      blue: "blue-bg",
      red: "red-bg",
      pink: "pink-bg"
    };
    return classes[color] || "bronze-bg";
  };

  if (loading) {
    return (
      <div className="dashboard-container profile-settings-page">
        <h1 className="welcome-text">Loading profile...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard-container profile-settings-page">
      <h1 className="welcome-text">Profile Settings</h1>
      <p className="sub-text">
        Manage your account information and track your coding progress.
      </p>

      {/* TABS */}
      <div className="profile-tabs">
        {["profile", "statistics", "submissions", "achievements"].map((tab) => (
          <button
            key={tab}
            className={`p-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handlePhotoChange}
      />

      {/* ================= PROFILE TAB ================= */}
      {activeTab === "profile" && (
        <div className="profile-layout">
          {/* LEFT */}
          <div className="profile-left">
            <div className="profile-pic-box">
              <div className="profile-pic-wrapper">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="profile"
                    className="profile-pic"
                  />
                ) : (
                  <div className="profile-pic-placeholder">
                    {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <button
                  className="change-photo-btn"
                  onClick={() => fileInputRef.current.click()}
                  title="Change Profile Photo"
                >
                  📷
                </button>
              </div>
              <h2>{profileData.fullName || "User"}</h2>
              <p className="email-text">{profileData.email}</p>
              <span className="level-badge">{stats.currentLevel} Level</span>

              <div className="stats-box">
                <div>
                  <h2>{stats.problemsSolved}</h2>
                  <p>Problems Solved</p>
                </div>
                <div>
                  <h2>{stats.accuracy}%</h2>
                  <p>Accuracy</p>
                </div>
              </div>

              <p className="progress-title">Progress to Next Level</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(stats.currentXp / stats.xpToNextLevel) * 100}%` }} />
              </div>
              <small>{stats.currentXp} / {stats.xpToNextLevel} XP</small>
            </div>
          </div>

          {/* RIGHT */}
          <div className="profile-right">
            <div className="info-card">
              <div className="info-header">
                <h3>Personal Information</h3>
                {isEditing ? (
                  <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "💾 Save"}
                  </button>
                ) : (
                  <button className="edit-btn-pro" onClick={() => setIsEditing(true)}>✏️ Edit</button>
                )}
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.fullName || "Not set"}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Email</label>
                  <p>{profileData.email}</p>
                </div>

                <div className="info-item full">
                  <label>Bio</label>
                  {isEditing ? (
                    <textarea
                      className="edit-textarea"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p>{profileData.bio || "No bio yet"}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  ) : (
                    <p>{profileData.location || "Not set"}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>GitHub</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.github}
                      onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                      placeholder="github.com/username"
                    />
                  ) : (
                    <p>{profileData.github || "Not set"}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/username"
                    />
                  ) : (
                    <p>{profileData.linkedin || "Not set"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div className="info-card" style={{ marginTop: 20 }}>
              <h3>Settings</h3>

              <div className="setting-item">
                <div>
                  <label>Dark Mode</label>
                  <p>Switch between light and dark theme</p>
                </div>
                <button
                  className={`toggle-switch ${isDark ? "active" : ""}`}
                  onClick={toggleTheme}
                >
                  <span className="toggle-slider" />
                </button>
              </div>

              <div className="setting-item">
                <div>
                  <label>Sign Out</label>
                  <p>Log out of your account</p>
                </div>
                <button className="logout-btn-compact" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STATISTICS TAB ================= */}
      {activeTab === "statistics" && (
        <div className="stats-page">
          <h3>📈 Coding Statistics</h3>

          <div className="stat-cards">
            <div className="stat-box blue">{stats.totalPoints.toLocaleString()}<br /><span>Total Points</span></div>
            <div className="stat-box green">{stats.currentStreak}<br /><span>Day Streak</span></div>
            <div className="stat-box purple">{stats.problemsSolved}<br /><span>Problems Solved</span></div>
            <div className="stat-box orange">{userProjects.length}<br /><span>Projects</span></div>
          </div>

          <h4>Skills & Proficiency</h4>

          {skills.length > 0 ? (
            skills.map((skill) => (
              <div className="skill-row" key={skill.name}>
                <div className="skill-header">
                  <strong>{skill.name}</strong>
                  <span>{skill.problemsSolved} problems</span>
                </div>
                <div className="skill-bar">
                  <div
                    className="skill-fill"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
                <small>{skill.proficiency}% proficiency</small>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No skills tracked yet. Start solving problems to build your skills!</p>
            </div>
          )}
        </div>
      )}

      {/* ================= SUBMISSIONS TAB ================= */}
      {activeTab === "submissions" && (
        <div className="submissions-container">
          <div className="submissions-header">
            <h3>📤 Project Submissions</h3>
            <p>Click on a category to view your submitted projects</p>
          </div>

          {Object.keys(groupedProjects).length > 0 ? (
            <>
              {/* Horizontal Category Buttons */}
              <div className="category-buttons-row">
                {Object.entries(groupedProjects).map(([category, data]) => (
                  <button
                    key={category}
                    className={`category-btn ${expandedCategory === category ? "active" : ""}`}
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="cat-btn-icon">{data.icon}</span>
                    <span className="cat-btn-name">{category}</span>
                    <span className="cat-btn-count">{data.projects.length}</span>
                  </button>
                ))}
              </div>

              {/* Project List - appears below buttons */}
              {expandedCategory && groupedProjects[expandedCategory] && (
                <div className="projects-panel">
                  <div className="projects-panel-header">
                    <h4>{groupedProjects[expandedCategory].icon} {expandedCategory}</h4>
                    <span className="projects-count">
                      {groupedProjects[expandedCategory].projects.length} Project{groupedProjects[expandedCategory].projects.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="project-list">
                    {groupedProjects[expandedCategory].projects.map((project, idx) => (
                      <React.Fragment key={project.id || idx}>
                        <div className="project-item">
                          <div className="project-info">
                            <h4 className="project-name">{project.title}</h4>
                            <span className="project-tech">{project.language}</span>
                          </div>
                          <button
                            className="details-btn"
                            onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                          >
                            {selectedProject?.id === project.id ? "Hide" : "Details"}
                          </button>
                        </div>

                        {/* Project Details */}
                        {selectedProject?.id === project.id && (
                          <div className="project-details inline-details">
                            <div className="details-header">
                              <h4>{project.title}</h4>
                            </div>
                            <div className="details-tech">
                              <strong>Language:</strong> {project.language}
                            </div>
                            <p className="details-description">{project.description || "No description"}</p>
                            {project.github && (
                              <a href={project.github} target="_blank" rel="noopener noreferrer">
                                View on GitHub →
                              </a>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No projects submitted yet. Upload your first project!</p>
              <button className="submit-project-btn" onClick={() => setPage("upload")}>
                ➕ Upload Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= ACHIEVEMENTS TAB ================= */}
      {activeTab === "achievements" && (
        <div className="achievements-container">
          <div className="achievements-header">
            <h3>🏅 Your Achievements</h3>
            <p>Unlock badges by solving problems and improving your coding skills</p>
          </div>

          <div className="badge-grid">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`achievement-card ${badge.isEarned ? "earned" : "locked"}`}
                >
                  <div className={`achievement-icon ${getBadgeBgClass(badge.color)}`}>
                    {getBadgeIcon(badge.name)}
                  </div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  {badge.isEarned ? (
                    <span className="earned-badge">✓ Earned</span>
                  ) : (
                    <>
                      <div className="achievement-progress">
                        <div
                          className="achievement-progress-fill"
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                      <small>{badge.progress}% complete</small>
                    </>
                  )}
                </div>
              ))
            ) : (
              // Default badges when none loaded from API
              <>
                <div className="achievement-card locked">
                  <div className="achievement-icon bronze-bg">🏆</div>
                  <h4>Bronze</h4>
                  <p>Solve 10 problems</p>
                  <div className="achievement-progress">
                    <div className="achievement-progress-fill" style={{ width: `${(stats.problemsSolved / 10) * 100}%` }} />
                  </div>
                  <small>{Math.min(stats.problemsSolved, 10)}/10 problems</small>
                </div>

                <div className="achievement-card locked">
                  <div className="achievement-icon silver-bg">�️</div>
                  <h4>Silver</h4>
                  <p>Solve 25 problems</p>
                  <div className="achievement-progress">
                    <div className="achievement-progress-fill" style={{ width: `${(stats.problemsSolved / 25) * 100}%` }} />
                  </div>
                  <small>{Math.min(stats.problemsSolved, 25)}/25 problems</small>
                </div>

                <div className="achievement-card locked">
                  <div className="achievement-icon gold-bg">👑</div>
                  <h4>Gold</h4>
                  <p>Solve 50 problems</p>
                  <div className="achievement-progress">
                    <div className="achievement-progress-fill" style={{ width: `${(stats.problemsSolved / 50) * 100}%` }} />
                  </div>
                  <small>{Math.min(stats.problemsSolved, 50)}/50 problems</small>
                </div>

                <div className="achievement-card locked">
                  <div className="achievement-icon green-bg">◎</div>
                  <h4>Problem Solver</h4>
                  <p>90%+ accuracy rate</p>
                  <div className="achievement-progress">
                    <div className="achievement-progress-fill" style={{ width: `${(stats.accuracy / 90) * 100}%` }} />
                  </div>
                  <small>{stats.accuracy}%/90% accuracy</small>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
