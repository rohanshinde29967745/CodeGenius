import React, { useState, useRef, useEffect } from "react";
import { getCurrentUser, getProfile, updateUserProfile, getUserProjects, getUserStats, getUserBadges, getUserSkills, changePassword, deleteAccount, saveUserSettings, getUserSettings, getAllUsers, getFriends, getPendingConnections, sendConnectionRequest, acceptConnectionRequest } from "../services/api";
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
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailyChallengeReminder, setDailyChallengeReminder] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [weeklyProgressReport, setWeeklyProgressReport] = useState(false);
  const [collaborationNotifications, setCollaborationNotifications] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

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

  // Connections State
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [connectionTab, setConnectionTab] = useState("friends"); // friends, find
  const [requestStatus, setRequestStatus] = useState({}); // To track sent requests status button

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
        // Fetch skills
        const skillsData = await getUserSkills(currentUser.id);
        setSkills(skillsData.skills || []);

        // Fetch Connections data
        try {
          const friendsData = await getFriends();
          setFriends(friendsData || []);

          const pendingData = await getPendingConnections();
          setPendingRequests(pendingData || []);
        } catch (err) {
          console.error("Failed to load connections", err);
        }

        // Set Privacy from DB
        if (data.user && data.user.isPrivate !== undefined) {
          setProfileVisibility(data.user.isPrivate ? "Private" : "Public");
        }

        // Load settings from localStorage
        const savedSettings = localStorage.getItem(`codegenius_settings_${currentUser.id}`);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          // Personalization settings
          if (settings.language) setLanguage(settings.language);
          if (settings.editorTheme) setEditorTheme(settings.editorTheme);
          if (settings.fontSize) setFontSize(settings.fontSize);
          if (settings.defaultLanguage) setDefaultLanguage(settings.defaultLanguage);
          if (settings.explanationLevel) setExplanationLevel(settings.explanationLevel);
          if (settings.profileVisibility) setProfileVisibility(settings.profileVisibility);
          // Editor preferences
          if (settings.lineNumbers !== undefined) setLineNumbers(settings.lineNumbers);
          if (settings.wordWrap !== undefined) setWordWrap(settings.wordWrap);
          if (settings.tabSize) setTabSize(settings.tabSize);
          if (settings.autoSave !== undefined) setAutoSave(settings.autoSave);
          if (settings.autoComplete !== undefined) setAutoComplete(settings.autoComplete);
          // Notification settings
          if (settings.emailNotifications !== undefined) setEmailNotifications(settings.emailNotifications);
          if (settings.dailyChallengeReminder !== undefined) setDailyChallengeReminder(settings.dailyChallengeReminder);
          if (settings.achievementAlerts !== undefined) setAchievementAlerts(settings.achievementAlerts);
          if (settings.weeklyProgressReport !== undefined) setWeeklyProgressReport(settings.weeklyProgressReport);
          if (settings.collaborationNotifications !== undefined) setCollaborationNotifications(settings.collaborationNotifications);
        }

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

      // Call the actual API to change password
      const result = await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);

      if (result.error) {
        setPasswordError(result.error);
        return;
      }

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

  // Save all settings to localStorage
  const saveSettings = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const settings = {
      // Personalization
      language,
      editorTheme,
      fontSize,
      defaultLanguage,
      explanationLevel,
      profileVisibility,
      // Editor preferences
      lineNumbers,
      wordWrap,
      tabSize,
      autoSave,
      autoComplete,
      // Notifications
      emailNotifications,
      dailyChallengeReminder,
      achievementAlerts,
      weeklyProgressReport,
      collaborationNotifications
    };

    localStorage.setItem(`codegenius_settings_${currentUser.id}`, JSON.stringify(settings));
  };

  // Auto-save settings whenever they change
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && !loading) {
      saveSettings();
    }
  }, [language, editorTheme, fontSize, defaultLanguage, explanationLevel, profileVisibility,
    lineNumbers, wordWrap, tabSize, autoSave, autoComplete,
    emailNotifications, dailyChallengeReminder, achievementAlerts, weeklyProgressReport, collaborationNotifications]);

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm deletion");
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const result = await deleteAccount(currentUser.id, deletePassword);

      if (result.error) {
        setDeleteError(result.error);
        setDeleting(false);
        return;
      }

      // Account deleted successfully - log out
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem(`codegenius_settings_${currentUser.id}`);
      setIsLoggedIn(false);
      setPage("home");
    } catch (error) {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  // Handle export user data
  const handleExportData = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const exportData = {
      profile: profileData,
      stats: stats,
      projects: userProjects,
      skills: skills,
      badges: badges,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codegenius_data_${currentUser.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const handleVisibilityChange = async (e) => {
    const visibility = e.target.value;
    setProfileVisibility(visibility);

    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        await updateUserProfile(currentUser.id, {
          isPrivate: visibility === "Private"
        });
        console.log("Profile visibility saved successfully");
      } catch (error) {
        console.error("Failed to save profile visibility:", error);
      }
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

  // Connections Handlers
  const handleSearchUsers = async (searchQuery) => {
    // Use provided query or empty string for suggestions
    const query = typeof searchQuery === 'string' ? searchQuery.trim() : '';

    try {
      const results = await getAllUsers(query);
      // Ensure results is always an array
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results && Array.isArray(results.users)) {
        setSearchResults(results.users);
      } else {
        console.error("Unexpected API response:", results);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    }
  };

  // Load suggested users when entering Find tab
  const loadSuggestedUsers = async () => {
    try {
      const results = await getAllUsers("");
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results && Array.isArray(results.users)) {
        setSearchResults(results.users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      setSearchResults([]);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery) {
        handleSearchUsers(userSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const handleSendConnection = async (receiverId) => {
    try {
      setRequestStatus(prev => ({ ...prev, [receiverId]: 'sending' }));
      const response = await sendConnectionRequest(receiverId);

      if (response.error) {
        alert(response.error);
        setRequestStatus(prev => ({ ...prev, [receiverId]: 'failed' }));
      } else {
        // Update local UI state
        setRequestStatus(prev => ({ ...prev, [receiverId]: 'sent' }));
        // Refresh search results to show updated status
        if (userSearchQuery) {
          handleSearchUsers(userSearchQuery);
        } else {
          loadSuggestedUsers();
        }
      }
    } catch (error) {
      console.error("Connection request failed:", error);
      setRequestStatus(prev => ({ ...prev, [receiverId]: 'failed' }));
    }
  };

  const handleAcceptConnection = async (connectionId) => {
    try {
      await acceptConnectionRequest(connectionId);
      // Refresh lists
      const friendsData = await getFriends();
      setFriends(friendsData || []);
      const pendingData = await getPendingConnections();
      setPendingRequests(pendingData || []);
    } catch (error) {
      console.error("Accept failed:", error);
    }
  };

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
                        onChange={handleVisibilityChange}
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
                      <button
                        className={`toggle-switch ${emailNotifications ? "active" : ""}`}
                        onClick={() => setEmailNotifications(!emailNotifications)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Daily Challenge Reminder</span>
                      </div>
                      <button
                        className={`toggle-switch ${dailyChallengeReminder ? "active" : ""}`}
                        onClick={() => setDailyChallengeReminder(!dailyChallengeReminder)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Achievement Alerts</span>
                      </div>
                      <button
                        className={`toggle-switch ${achievementAlerts ? "active" : ""}`}
                        onClick={() => setAchievementAlerts(!achievementAlerts)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Weekly Progress Report</span>
                      </div>
                      <button
                        className={`toggle-switch ${weeklyProgressReport ? "active" : ""}`}
                        onClick={() => setWeeklyProgressReport(!weeklyProgressReport)}
                      >
                        <span className="toggle-slider" />
                      </button>
                    </div>

                    <div className="meta-settings-item-row">
                      <div className="meta-item-left">
                        <span className="meta-item-text">Project Collaboration Request</span>
                      </div>
                      <button
                        className={`toggle-switch ${collaborationNotifications ? "active" : ""}`}
                        onClick={() => setCollaborationNotifications(!collaborationNotifications)}
                      >
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
                      onClick={handleExportData}
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
                        <input
                          type="password"
                          placeholder="Enter your password to confirm"
                          className="meta-input"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          style={{ marginBottom: '10px' }}
                        />
                        {deleteError && (
                          <div className="meta-error" style={{ marginBottom: '10px' }}>{deleteError}</div>
                        )}
                        <div className="meta-delete-actions">
                          <button
                            className="meta-cancel-btn"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword("");
                              setDeleteError("");
                            }}
                            disabled={deleting}
                          >
                            Cancel
                          </button>
                          <button
                            className="meta-delete-btn"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Delete Account"}
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

      <div className="profile-tabs">
        {["profile", "statistics", "submissions", "achievements", "connections"].map((tab) => (
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
        <div className="instagram-profile">
          {/* Header Row with Edit Button on Right */}
          <div className="ig-header-actions">
            <h2 className="ig-page-title">My Profile</h2>
            <button
              className="ig-edit-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "✕ Cancel" : "✏️ Edit Profile"}
            </button>
          </div>

          {/* Main Profile Card */}
          <div className="ig-profile-card">
            {/* Left: Avatar */}
            <div className="ig-avatar-section">
              <div className="ig-avatar-wrapper" onClick={() => fileInputRef.current.click()}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="profile" className="ig-avatar" />
                ) : (
                  <div className="ig-avatar-placeholder">
                    {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div className="ig-avatar-overlay">
                  <span>📷</span>
                </div>
              </div>
              <span className="ig-level-badge">{stats.currentLevel} Level</span>
            </div>

            {/* Right: Info */}
            <div className="ig-profile-info">
              <h2 className="ig-username">{profileData.fullName || "User"}</h2>
              <p className="ig-email">{profileData.email}</p>

              {/* Stats */}
              <div className="ig-stats-row">
                <div className="ig-stat">
                  <span className="ig-stat-value">{stats.problemsSolved}</span>
                  <span className="ig-stat-label">Problems</span>
                </div>
                <div className="ig-stat">
                  <span className="ig-stat-value">{stats.accuracy}%</span>
                  <span className="ig-stat-label">Accuracy</span>
                </div>
                <div className="ig-stat">
                  <span className="ig-stat-value">{friends.length}</span>
                  <span className="ig-stat-label">Friends</span>
                </div>
                <div className="ig-stat">
                  <span className="ig-stat-value">{stats.totalPoints}</span>
                  <span className="ig-stat-label">Points</span>
                </div>
              </div>

              {/* XP Progress */}
              <div className="ig-xp-section">
                <div className="ig-xp-header">
                  <span>Progress to Next Level</span>
                  <span>{stats.currentXp} / {stats.xpToNextLevel} XP</span>
                </div>
                <div className="ig-progress-bar">
                  <div className="ig-progress-fill" style={{ width: `${(stats.currentXp / stats.xpToNextLevel) * 100}%` }} />
                </div>
              </div>

              {/* Quick Links */}
              {(profileData.github || profileData.linkedin || profileData.location) && !isEditing && (
                <div className="ig-quick-info">
                  {profileData.location && <span className="ig-info-tag">📍 {profileData.location}</span>}
                  {profileData.github && (
                    <a href={profileData.github.startsWith('http') ? profileData.github : `https://${profileData.github}`} target="_blank" rel="noopener noreferrer" className="ig-info-tag ig-link-tag">
                      GitHub
                    </a>
                  )}
                  {profileData.linkedin && (
                    <a href={profileData.linkedin.startsWith('http') ? profileData.linkedin : `https://${profileData.linkedin}`} target="_blank" rel="noopener noreferrer" className="ig-info-tag ig-link-tag">
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="ig-edit-form">
              <h3 className="ig-form-title">Edit Profile Information</h3>
              <div className="ig-form-grid">
                <div className="ig-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="ig-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="ig-input-disabled"
                  />
                </div>
                <div className="ig-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                <div className="ig-form-group">
                  <label>GitHub URL</label>
                  <input
                    type="text"
                    value={profileData.github}
                    onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                    placeholder="github.com/username"
                  />
                </div>
                <div className="ig-form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="text"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>
              <div className="ig-form-actions">
                <button className="ig-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="ig-save-btn" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Highlights Row */}
          <div className="ig-highlights">
            <div className="ig-highlight-item">
              <div className="ig-highlight-circle">🔥</div>
              <span>{stats.currentStreak} Day Streak</span>
            </div>
            <div className="ig-highlight-item">
              <div className="ig-highlight-circle">🏆</div>
              <span>{badges.filter(b => b.isEarned).length} Badges</span>
            </div>
            <div className="ig-highlight-item">
              <div className="ig-highlight-circle">📁</div>
              <span>{userProjects.length} Projects</span>
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

      {/* ================= CONNECTIONS TAB ================= */}
      {activeTab === "connections" && (
        <div className="connections-container" style={{ padding: '20px' }}>
          <div className="connections-header" style={{ marginBottom: '24px' }}>
            <h3>👥 Connections</h3>
            <div className="connection-sub-tabs" style={{ display: 'flex', gap: '15px', marginTop: '15px', borderBottom: '1px solid #333' }}>
              <button
                className={`sub-tab-btn ${connectionTab === 'friends' ? 'active' : ''}`}
                onClick={() => setConnectionTab('friends')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: connectionTab === 'friends' ? '2px solid #667eea' : 'none',
                  color: connectionTab === 'friends' ? '#667eea' : 'inherit',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                My Connections
              </button>
              <button
                className={`sub-tab-btn ${connectionTab === 'requests' ? 'active' : ''}`}
                onClick={() => setConnectionTab('requests')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: connectionTab === 'requests' ? '2px solid #667eea' : 'none',
                  color: connectionTab === 'requests' ? '#667eea' : 'inherit',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  position: 'relative'
                }}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '-5px',
                    background: '#e53e3e',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{pendingRequests.length}</span>
                )}
              </button>
              <button
                className={`sub-tab-btn ${connectionTab === 'find' ? 'active' : ''}`}
                onClick={() => setConnectionTab('find')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: connectionTab === 'find' ? '2px solid #667eea' : 'none',
                  color: connectionTab === 'find' ? '#667eea' : 'inherit',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Find People
              </button>
            </div>
          </div>

          {connectionTab === 'friends' && (
            <div className="friends-view">
              <h4 style={{ marginBottom: '15px' }}>My Connections ({friends.length})</h4>
              {friends.length > 0 ? (
                <div className="friends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {friends.map(friend => (
                    <div key={friend.id} className="user-card" style={{
                      padding: '15px', borderRadius: '10px', backgroundColor: isDark ? '#2d3748' : '#f7fafc',
                      display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      <img
                        src={friend.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name)}&background=random`}
                        alt={friend.full_name}
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <h5 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{friend.full_name}</h5>
                        <small style={{ color: '#718096' }}>{friend.current_level} • {friend.total_points} pts</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
                  <p>You haven't connected with anyone yet.</p>
                  <button
                    onClick={() => setConnectionTab('find')}
                    style={{
                      marginTop: '15px', padding: '8px 20px', background: '#667eea', color: 'white',
                      border: 'none', borderRadius: '5px', cursor: 'pointer'
                    }}
                  >
                    Find Friends
                  </button>
                </div>
              )}
            </div>
          )}

          {connectionTab === 'requests' && (
            <div className="requests-view">
              <h4 style={{ marginBottom: '20px' }}>Connection Requests ({pendingRequests.length})</h4>
              {pendingRequests.length > 0 ? (
                <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="user-card" style={{
                      padding: '20px', borderRadius: '12px', backgroundColor: isDark ? '#2d3748' : '#f7fafc',
                      display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                    }}>
                      <img
                        src={req.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.full_name)}&background=random`}
                        alt={req.full_name}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{req.full_name}</h5>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#718096' }}>
                          Wants to connect with you
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleAcceptConnection(req.id)}
                            style={{
                              padding: '8px 16px', background: '#48bb78', color: 'white', border: 'none',
                              borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600'
                            }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            style={{
                              padding: '8px 16px', background: 'transparent', color: '#718096', border: '1px solid #cbd5e0',
                              borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                          >
                            ✕ Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📬</div>
                  <h4 style={{ margin: '0 0 10px 0' }}>No Pending Requests</h4>
                  <p>When someone sends you a connection request, it will appear here.</p>
                </div>
              )}
            </div>
          )}

          {connectionTab === 'find' && (
            <div className="find-view">
              <div className="search-bar" style={{ marginBottom: '25px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search for developers..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 20px', borderRadius: '8px', border: '1px solid #cbd5e0',
                    backgroundColor: isDark ? '#2d3748' : 'white', color: isDark ? 'white' : 'black', fontSize: '1rem'
                  }}
                />
              </div>

              <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {searchResults.map(user => (
                  <div key={user.id} className="user-card" style={{
                    padding: '15px', borderRadius: '10px', backgroundColor: isDark ? '#2d3748' : '#f7fafc',
                    display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}>
                    <img
                      src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                      alt={user.full_name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ margin: '0 0 5px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</h5>
                      <span className="level-badge" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#4a5568', color: 'white' }}>
                        {user.current_level}
                      </span>
                    </div>

                    {user.connection_status === 'accepted' ? (
                      <span style={{ color: '#48bb78', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Friend</span>
                    ) : user.connection_status === 'pending' && user.requester_id === getCurrentUser()?.id ? (
                      <span style={{ color: '#ecc94b', fontWeight: 'bold', fontSize: '0.9rem' }}>Pending</span>
                    ) : user.connection_status === 'pending' ? (
                      <button
                        onClick={() => setConnectionTab('friends')}
                        style={{ padding: '6px 14px', background: '#ecc94b', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        Respond
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendConnection(user.id)}
                        disabled={requestStatus[user.id] === 'sent' || requestStatus[user.id] === 'sending'}
                        style={{
                          padding: '6px 14px',
                          background: requestStatus[user.id] === 'sent' ? '#48bb78' : '#667eea',
                          color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer',
                          opacity: requestStatus[user.id] === 'sent' ? 0.8 : 1
                        }}
                      >
                        {requestStatus[user.id] === 'sent' ? 'Sent' : requestStatus[user.id] === 'sending' ? 'Sending...' : 'Connect'}
                      </button>
                    )}
                  </div>
                ))}

                {searchResults.length === 0 && userSearchQuery && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#718096' }}>
                    No users found matching "{userSearchQuery}"
                  </div>
                )}

                {searchResults.length === 0 && !userSearchQuery && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#718096' }}>
                    Type a name to search for other developers.
                    <br />
                    <button
                      onClick={loadSuggestedUsers}
                      style={{ marginTop: '10px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Show suggestions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
