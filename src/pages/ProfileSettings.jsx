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

  // Settings dropdown states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState(null); // 'personalization', 'privacy', or null
  const [language, setLanguage] = useState("English");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // NEW: 5 Recommended Settings
  const [editorTheme, setEditorTheme] = useState("Monokai");
  const [fontSize, setFontSize] = useState("14px");
  const [defaultLanguage, setDefaultLanguage] = useState("JavaScript");
  const [explanationLevel, setExplanationLevel] = useState("Intermediate");
  const [profileVisibility, setProfileVisibility] = useState("Public");

  // Editor Preferences
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [tabSize, setTabSize] = useState("4");
  const [autoSave, setAutoSave] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);

  // Profile/Account Section
  const [githubConnected, setGithubConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ref for file input
  const fileInputRef = useRef(null);
  const settingsMenuRef = useRef(null);

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

  // Handle click outside to close settings menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
        setActiveSettingsSection(null);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettingsMenu]);

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // TODO: Add actual API call to change password
      // For now, just simulate success
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => {
        setPasswordSuccess("");
      }, 3000);
    } catch (error) {
      setPasswordError("Failed to change password. Please try again.");
    }
  };

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

  // Handle profile photo change - auto-saves to database
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Photo = reader.result;
        setProfilePhoto(base64Photo);

        // Auto-save photo to database
        const currentUser = getCurrentUser();
        if (currentUser) {
          try {
            await updateUserProfile(currentUser.id, {
              profilePhoto: base64Photo
            });
            console.log("Profile photo saved successfully");
          } catch (error) {
            console.error("Failed to save profile photo:", error);
          }
        }
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
      {/* Header with Settings Gear */}
      <div className="profile-header-row">
        {/* Left side - Title */}
        <h1 className="welcome-text">Profile Settings</h1>

        {/* Right side - Settings Gear */}
        <div className="settings-gear-container" ref={settingsMenuRef}>
          <button
            className="settings-gear-btn"
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu);
              if (showSettingsMenu) setActiveSettingsSection(null);
            }}
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </button>

          {/* Settings Dropdown Menu - Meta Style */}
          {showSettingsMenu && (
            <div className="meta-settings-dropdown">
              {/* Header */}
              <div className="meta-settings-header">
                <button
                  className="meta-close-btn"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setActiveSettingsSection(null);
                  }}
                >
                  ✕
                </button>
                <span className="meta-header-title">
                  {activeSettingsSection === 'personalization' ? 'Personalization' :
                    activeSettingsSection === 'privacy' ? 'Privacy & Security' :
                      activeSettingsSection === 'editor' ? 'Editor Preferences' :
                        activeSettingsSection === 'notifications' ? 'Notifications' :
                          activeSettingsSection === 'account' ? 'Account' :
                            'Settings'}
                </span>
                <div className="meta-header-spacer"></div>
              </div>

              {/* Main Menu */}
              {!activeSettingsSection && (
                <>
                  {/* Profile Card */}
                  <div
                    className="meta-profile-card"
                    onClick={() => setActiveSettingsSection('account')}
                  >
                    <div className="meta-profile-avatar">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" />
                      ) : (
                        <span>{profileData.fullName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="meta-profile-info">
                      <span className="meta-profile-name">{profileData.fullName || 'User'}</span>
                      <span className="meta-profile-email">{profileData.email}</span>
                    </div>
                    <span className="meta-arrow">›</span>
                  </div>

                  {/* Settings Group */}
                  <div className="meta-settings-group">
                    <div
                      className="meta-settings-item"
                      onClick={() => setActiveSettingsSection('personalization')}
                    >
                      <span className="meta-item-text">Personalization</span>
                      <span className="meta-arrow">›</span>
                    </div>

                    <div
                      className="meta-settings-item"
                      onClick={() => setActiveSettingsSection('privacy')}
                    >
                      <span className="meta-item-text">Privacy & Security</span>
                      <span className="meta-arrow">›</span>
                    </div>

                    <div
                      className="meta-settings-item"
                      onClick={() => setActiveSettingsSection('editor')}
                    >
                      <span className="meta-item-text">Editor Preferences</span>
                      <span className="meta-arrow">›</span>
                    </div>

                    <div
                      className="meta-settings-item"
                      onClick={() => setActiveSettingsSection('notifications')}
                    >
                      <span className="meta-item-text">Notifications</span>
                      <span className="meta-arrow">›</span>
                    </div>
                  </div>

                  {/* Account Group */}
                  <div className="meta-settings-group">
                    <div
                      className="meta-settings-item logout-item"
                      onClick={handleLogout}
                    >
                      <span className="meta-item-text">Logout</span>
                    </div>
                  </div>
                </>
              )}

              {/* Personalization Section */}
              {activeSettingsSection === 'personalization' && (
                <>
                  <div
                    className="meta-back-btn"
                    onClick={() => setActiveSettingsSection(null)}
                  >
                    <span className="meta-back-arrow">‹</span>
                    <span>Back</span>
                  </div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Dark Mode</span>
                      </div>
                      <button
                        className={`toggle-switch ${isDark ? "active" : ""}`}
                        onClick={toggleTheme}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Language</span>
                      </div>
                      <select
                        className="meta-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="Marathi">मराठी</option>
                        <option value="Hindi">हिंदी</option>
                      </select>
                    </div>
                  </div>

                  <div className="meta-section-label">Code Editor</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Theme</span>
                      </div>
                      <select
                        className="meta-select"
                        value={editorTheme}
                        onChange={(e) => setEditorTheme(e.target.value)}
                      >
                        <option value="Monokai">Monokai</option>
                        <option value="Dracula">Dracula</option>
                        <option value="One Dark">One Dark</option>
                        <option value="GitHub Light">GitHub Light</option>
                        <option value="Solarized">Solarized</option>
                      </select>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Font Size</span>
                      </div>
                      <select
                        className="meta-select"
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                      >
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                      </select>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Default Language</span>
                      </div>
                      <select
                        className="meta-select"
                        value={defaultLanguage}
                        onChange={(e) => setDefaultLanguage(e.target.value)}
                      >
                        <option value="JavaScript">JavaScript</option>
                        <option value="Python">Python</option>
                        <option value="Java">Java</option>
                        <option value="C++">C++</option>
                        <option value="TypeScript">TypeScript</option>
                      </select>
                    </div>
                  </div>

                  <div className="meta-section-label">AI Settings</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Explanation Level</span>
                      </div>
                      <select
                        className="meta-select"
                        value={explanationLevel}
                        onChange={(e) => setExplanationLevel(e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Privacy Section */}
              {activeSettingsSection === 'privacy' && (
                <>
                  <div
                    className="meta-back-btn"
                    onClick={() => setActiveSettingsSection(null)}
                  >
                    <span className="meta-back-arrow">‹</span>
                    <span>Back</span>
                  </div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Profile Visibility</span>
                      </div>
                      <select
                        className="meta-select"
                        value={profileVisibility}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                      >
                        <option value="Public">Public</option>
                        <option value="Friends Only">Friends Only</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="meta-section-label">Change Password</div>

                  <div className="meta-settings-group">
                    <div className="meta-password-form">
                      <input
                        type="password"
                        placeholder="Current Password"
                        className="meta-input"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        className="meta-input"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="meta-input"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />

                      {passwordError && (
                        <div className="meta-error">{passwordError}</div>
                      )}
                      {passwordSuccess && (
                        <div className="meta-success">{passwordSuccess}</div>
                      )}

                      <button
                        className="meta-primary-btn"
                        onClick={handlePasswordChange}
                      >
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="meta-info-note">
                    <span>Private profiles won't appear on the leaderboard</span>
                  </div>
                </>
              )}

              {/* Editor Preferences Section */}
              {activeSettingsSection === 'editor' && (
                <>
                  <div
                    className="meta-back-btn"
                    onClick={() => setActiveSettingsSection(null)}
                  >
                    <span className="meta-back-arrow">‹</span>
                    <span>Back</span>
                  </div>

                  <div className="meta-section-label">Display</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Line Numbers</span>
                      </div>
                      <button
                        className={`toggle-switch ${lineNumbers ? "active" : ""}`}
                        onClick={() => setLineNumbers(!lineNumbers)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Word Wrap</span>
                      </div>
                      <button
                        className={`toggle-switch ${wordWrap ? "active" : ""}`}
                        onClick={() => setWordWrap(!wordWrap)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Tab Size</span>
                      </div>
                      <select
                        className="meta-select"
                        value={tabSize}
                        onChange={(e) => setTabSize(e.target.value)}
                      >
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="8">8 spaces</option>
                      </select>
                    </div>
                  </div>

                  <div className="meta-section-label">Behavior</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Auto-Save</span>
                      </div>
                      <button
                        className={`toggle-switch ${autoSave ? "active" : ""}`}
                        onClick={() => setAutoSave(!autoSave)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Auto-Complete</span>
                      </div>
                      <button
                        className={`toggle-switch ${autoComplete ? "active" : ""}`}
                        onClick={() => setAutoComplete(!autoComplete)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>
                  </div>

                  <div className="meta-info-note">
                    <span>Changes are applied to all code editors</span>
                  </div>
                </>
              )}

              {/* Notifications Section */}
              {activeSettingsSection === 'notifications' && (
                <>
                  <div
                    className="meta-back-btn"
                    onClick={() => setActiveSettingsSection(null)}
                  >
                    <span className="meta-back-arrow">‹</span>
                    <span>Back</span>
                  </div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Email Notifications</span>
                      </div>
                      <button className="toggle-switch active">
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Daily Challenge Reminder</span>
                      </div>
                      <button className="toggle-switch active">
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Achievement Alerts</span>
                      </div>
                      <button className="toggle-switch active">
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Weekly Progress Report</span>
                      </div>
                      <button className="toggle-switch">
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Project Collaboration Request</span>
                      </div>
                      <button className="toggle-switch active">
                        <span className="toggle-slider" />
                      </button>
                    </div>
                  </div>

                  <div className="meta-info-note">
                    <span>Manage how you receive updates from CodeGenius</span>
                  </div>
                </>
              )}

              {/* Account Section */}
              {activeSettingsSection === 'account' && (
                <>
                  <div
                    className="meta-back-btn"
                    onClick={() => setActiveSettingsSection(null)}
                  >
                    <span className="meta-back-arrow">‹</span>
                    <span>Back</span>
                  </div>

                  {/* Profile Info Card (view only) */}
                  <div className="meta-profile-card" style={{ cursor: 'default' }}>
                    <div className="meta-profile-avatar">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" />
                      ) : (
                        <span>{profileData.fullName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="meta-profile-info">
                      <span className="meta-profile-name">{profileData.fullName || 'User'}</span>
                      <span className="meta-profile-email">{profileData.email}</span>
                    </div>
                  </div>

                  <div className="meta-settings-group">
                    <div
                      className="meta-settings-item"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setActiveSettingsSection(null);
                        setIsEditing(true);
                      }}
                    >
                      <span className="meta-item-text">Edit Profile</span>
                      <span className="meta-arrow">›</span>
                    </div>
                  </div>

                  <div className="meta-section-label">Connected Accounts</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">GitHub</span>
                      </div>
                      {githubConnected ? (
                        <button
                          className="meta-disconnect-btn"
                          onClick={() => setGithubConnected(false)}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="meta-connect-btn"
                          onClick={() => setGithubConnected(true)}
                        >
                          Connect
                        </button>
                      )}
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Google</span>
                      </div>
                      {googleConnected ? (
                        <button
                          className="meta-disconnect-btn"
                          onClick={() => setGoogleConnected(false)}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="meta-connect-btn"
                          onClick={() => setGoogleConnected(true)}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="meta-section-label">Account Status</div>

                  <div className="meta-settings-group">
                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Email Verified</span>
                      </div>
                      <span className="meta-status-badge verified">Verified</span>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Member Since</span>
                      </div>
                      <span className="meta-status-text">Dec 2024</span>
                    </div>
                  </div>

                  <div className="meta-section-label">Data</div>

                  <div className="meta-settings-group">
                    <div
                      className="meta-settings-item"
                      onClick={() => alert('Exporting your data... This feature will be available soon.')}
                    >
                      <span className="meta-item-text">Export My Data</span>
                      <span className="meta-arrow">›</span>
                    </div>
                  </div>

                  <div className="meta-section-label">Danger Zone</div>

                  <div className="meta-settings-group danger-group">
                    {!showDeleteConfirm ? (
                      <div
                        className="meta-settings-item danger-item"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <span className="meta-item-text">Delete Account</span>
                        <span className="meta-arrow">›</span>
                      </div>
                    ) : (
                      <div className="meta-delete-confirm">
                        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                        <div className="meta-delete-actions">
                          <button
                            className="meta-cancel-btn"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="meta-delete-btn"
                            onClick={() => {
                              alert('Account deletion requested. This feature will be available soon.');
                              setShowDeleteConfirm(false);
                            }}
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="meta-info-note">
                    <span>Need help? Contact support@codegenius.com</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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
