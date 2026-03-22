// MenuDropdown.jsx – Clean Settings Menu matching the provided design
import React, { useState, useEffect, useRef } from "react";
import {
    getSavedProblems, getSavedProjects, unsaveProblem,
    unsaveProject, getCurrentUser, changePassword
} from "../services/api";
import "../App.css";

function MenuDropdown({ isOpen, onClose, setPage, isDark, toggleTheme, onLogout, user }) {
    const dropdownRef = useRef(null);
    const [activeSection, setActiveSection] = useState(null);
    const [savedProblems, setSavedProblems] = useState([]);
    const [savedProjects, setSavedProjects] = useState([]);

    // Settings States
    const [language, setLanguage] = useState("English");
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

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [dailyChallengeReminder, setDailyChallengeReminder] = useState(true);
    const [achievementAlerts, setAchievementAlerts] = useState(true);
    const [weeklyProgressReport, setWeeklyProgressReport] = useState(false);
    const [collaborationNotifications, setCollaborationNotifications] = useState(true);

    // Password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
                setActiveSection(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Load saved settings
    useEffect(() => {
        const savedSettings = localStorage.getItem('codegenius-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.language) setLanguage(settings.language);
                if (settings.editorTheme) setEditorTheme(settings.editorTheme);
                if (settings.fontSize) setFontSize(settings.fontSize);
                if (settings.defaultLanguage) setDefaultLanguage(settings.defaultLanguage);
                if (settings.explanationLevel) setExplanationLevel(settings.explanationLevel);
                if (settings.profileVisibility) setProfileVisibility(settings.profileVisibility);
                if (settings.lineNumbers !== undefined) setLineNumbers(settings.lineNumbers);
                if (settings.wordWrap !== undefined) setWordWrap(settings.wordWrap);
                if (settings.tabSize) setTabSize(settings.tabSize);
                if (settings.autoSave !== undefined) setAutoSave(settings.autoSave);
                if (settings.autoComplete !== undefined) setAutoComplete(settings.autoComplete);
                if (settings.emailNotifications !== undefined) setEmailNotifications(settings.emailNotifications);
                if (settings.dailyChallengeReminder !== undefined) setDailyChallengeReminder(settings.dailyChallengeReminder);
                if (settings.achievementAlerts !== undefined) setAchievementAlerts(settings.achievementAlerts);
                if (settings.weeklyProgressReport !== undefined) setWeeklyProgressReport(settings.weeklyProgressReport);
                if (settings.collaborationNotifications !== undefined) setCollaborationNotifications(settings.collaborationNotifications);
            } catch (e) {
                console.error("Error loading settings:", e);
            }
        }
    }, []);

    // Save settings to localStorage
    const saveSettings = () => {
        const settings = {
            language, editorTheme, fontSize, defaultLanguage, explanationLevel, profileVisibility,
            lineNumbers, wordWrap, tabSize, autoSave, autoComplete,
            emailNotifications, dailyChallengeReminder, achievementAlerts, weeklyProgressReport, collaborationNotifications
        };
        localStorage.setItem('codegenius-settings', JSON.stringify(settings));
    };

    // Load saved items when section changes
    useEffect(() => {
        if (isOpen && user?.id) {
            if (activeSection === 'savedProblems') {
                loadSavedProblems();
            } else if (activeSection === 'savedProjects') {
                loadSavedProjects();
            }
        }
    }, [isOpen, activeSection, user?.id]);

    const loadSavedProblems = async () => {
        try {
            const result = await getSavedProblems(user?.id);
            setSavedProblems(result.savedProblems || []);
        } catch (error) {
            console.error("Error loading saved problems:", error);
        }
    };

    const loadSavedProjects = async () => {
        try {
            const result = await getSavedProjects(user?.id);
            setSavedProjects(result.savedProjects || []);
        } catch (error) {
            console.error("Error loading saved projects:", error);
        }
    };

    const handleRemoveSavedProblem = async (problemId) => {
        try {
            await unsaveProblem(user?.id, problemId);
            loadSavedProblems();
        } catch (error) {
            console.error("Error removing saved problem:", error);
        }
    };

    const handleRemoveSavedProject = async (projectId) => {
        try {
            await unsaveProject(user?.id, projectId);
            loadSavedProjects();
        } catch (error) {
            console.error("Error removing saved project:", error);
        }
    };

    const handleAddAccount = () => {
        localStorage.setItem('addAccountMode', 'true');
        localStorage.setItem('primaryEmail', user?.email);
        setPage('login');
        onClose();
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("All fields are required");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        try {
            const currentUser = getCurrentUser();
            const result = await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);

            if (result.error) {
                setPasswordError(result.error);
            } else {
                setPasswordSuccess("Password updated successfully!");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (error) {
            setPasswordError("Failed to update password");
        }
    };

    if (!isOpen) return null;

    const getTitle = () => {
        switch (activeSection) {
            case 'personalization': return 'Personalization';
            case 'privacy': return 'Privacy & Security';
            case 'editor': return 'Editor Preferences';
            case 'notification': return 'Notifications';
            case 'saved': return 'Saved Items';
            default: return 'Settings';
        }
    };

    return (
        <div className="settings-overlay">
            <div className="settings-panel" ref={dropdownRef}>
                {/* Header */}
                <div className="settings-header">
                    {activeSection ? (
                        <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
                            ‹
                        </button>
                    ) : (
                        <button className="settings-close-btn" onClick={() => { onClose(); setActiveSection(null); }}>
                            ✕
                        </button>
                    )}
                    <span className="settings-title">{getTitle()}</span>
                    <div className="settings-header-spacer"></div>
                </div>

                {/* Main Menu */}
                {!activeSection && (
                    <div className="settings-content">
                        {/* Profile Section */}
                        <div className="settings-profile" onClick={() => { setPage('profile'); onClose(); }}>
                            <div className="settings-avatar">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" />
                                ) : (
                                    <span>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            <div className="settings-user-info">
                                <h4>{user?.fullName || 'User'}</h4>
                                <p>{user?.email}</p>
                            </div>
                            <span className="settings-arrow">›</span>
                        </div>

                        {/* Settings Menu Items */}
                        <div className="settings-menu-section">
                            <button className="settings-menu-item" onClick={() => setActiveSection('personalization')}>
                                <span className="settings-menu-text">Personalization</span>
                                <span className="settings-arrow">›</span>
                            </button>
                            <button className="settings-menu-item" onClick={() => setActiveSection('privacy')}>
                                <span className="settings-menu-text">Privacy & Security</span>
                                <span className="settings-arrow">›</span>
                            </button>
                            <button className="settings-menu-item" onClick={() => setActiveSection('editor')}>
                                <span className="settings-menu-text">Editor Preferences</span>
                                <span className="settings-arrow">›</span>
                            </button>
                            <button className="settings-menu-item" onClick={() => setActiveSection('notification')}>
                                <span className="settings-menu-text">Notifications</span>
                                <span className="settings-arrow">›</span>
                            </button>
                        </div>

                        {/* Saved Items Section */}
                        <div className="settings-menu-section">
                            <button className="settings-menu-item" onClick={() => { setPage('saved'); onClose(); }}>
                                <span className="settings-menu-text">Saved Items</span>
                                <span className="settings-arrow">›</span>
                            </button>
                        </div>

                        {/* Account Actions */}
                        <div className="settings-menu-section settings-account-actions">
                            <button className="settings-menu-item add-account-item" onClick={handleAddAccount}>
                                <span className="settings-menu-text">Add Account</span>
                            </button>
                            <button className="settings-menu-item logout-item" onClick={() => { onLogout(); onClose(); }}>
                                <span className="settings-menu-text">Logout</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Personalization Section */}
                {activeSection === 'personalization' && (
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <span>Dark Mode</span>
                            <button className={`settings-toggle ${isDark ? "active" : ""}`} onClick={toggleTheme}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Language</span>
                            <select value={language} onChange={(e) => { setLanguage(e.target.value); saveSettings(); }}>
                                <option value="English">English</option>
                                <option value="Marathi">मराठी</option>
                                <option value="Hindi">हिंदी</option>
                            </select>
                        </div>

                        <div className="settings-section-title">Code Editor</div>
                        <div className="settings-row">
                            <span>Theme</span>
                            <select value={editorTheme} onChange={(e) => { setEditorTheme(e.target.value); saveSettings(); }}>
                                <option value="Monokai">Monokai</option>
                                <option value="Dracula">Dracula</option>
                                <option value="One Dark">One Dark</option>
                                <option value="GitHub Light">GitHub Light</option>
                                <option value="Solarized">Solarized</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <span>Font Size</span>
                            <select value={fontSize} onChange={(e) => { setFontSize(e.target.value); saveSettings(); }}>
                                <option value="12px">12px</option>
                                <option value="14px">14px</option>
                                <option value="16px">16px</option>
                                <option value="18px">18px</option>
                                <option value="20px">20px</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <span>Default Language</span>
                            <select value={defaultLanguage} onChange={(e) => { setDefaultLanguage(e.target.value); saveSettings(); }}>
                                <option value="JavaScript">JavaScript</option>
                                <option value="Python">Python</option>
                                <option value="Java">Java</option>
                                <option value="C++">C++</option>
                                <option value="TypeScript">TypeScript</option>
                            </select>
                        </div>

                        <div className="settings-section-title">AI Settings</div>
                        <div className="settings-row">
                            <span>Explanation Level</span>
                            <select value={explanationLevel} onChange={(e) => { setExplanationLevel(e.target.value); saveSettings(); }}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Privacy & Security Section */}
                {activeSection === 'privacy' && (
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <span>Profile Visibility</span>
                            <select value={profileVisibility} onChange={(e) => { setProfileVisibility(e.target.value); saveSettings(); }}>
                                <option value="Public">Public</option>
                                <option value="Friends Only">Friends Only</option>
                                <option value="Private">Private</option>
                            </select>
                        </div>

                        <div className="settings-section-title">Change Password</div>
                        <div className="settings-form">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                            {passwordError && <div className="settings-error">{passwordError}</div>}
                            {passwordSuccess && <div className="settings-success">{passwordSuccess}</div>}
                            <button className="settings-btn-primary" onClick={handlePasswordChange}>
                                Update Password
                            </button>
                        </div>

                        <div className="settings-note">
                            Private profiles won't appear on the leaderboard
                        </div>
                    </div>
                )}

                {/* Editor Preferences Section */}
                {activeSection === 'editor' && (
                    <div className="settings-section-content">
                        <div className="settings-section-title">Display</div>
                        <div className="settings-row">
                            <span>Line Numbers</span>
                            <button className={`settings-toggle ${lineNumbers ? "active" : ""}`} onClick={() => { setLineNumbers(!lineNumbers); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Word Wrap</span>
                            <button className={`settings-toggle ${wordWrap ? "active" : ""}`} onClick={() => { setWordWrap(!wordWrap); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Tab Size</span>
                            <select value={tabSize} onChange={(e) => { setTabSize(e.target.value); saveSettings(); }}>
                                <option value="2">2 spaces</option>
                                <option value="4">4 spaces</option>
                                <option value="8">8 spaces</option>
                            </select>
                        </div>

                        <div className="settings-section-title">Behavior</div>
                        <div className="settings-row">
                            <span>Auto-Save</span>
                            <button className={`settings-toggle ${autoSave ? "active" : ""}`} onClick={() => { setAutoSave(!autoSave); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Auto-Complete</span>
                            <button className={`settings-toggle ${autoComplete ? "active" : ""}`} onClick={() => { setAutoComplete(!autoComplete); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>

                        <div className="settings-note">
                            Changes are applied to all code editors
                        </div>
                    </div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notification' && (
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <span>Email Notifications</span>
                            <button className={`settings-toggle ${emailNotifications ? "active" : ""}`} onClick={() => { setEmailNotifications(!emailNotifications); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Daily Challenge Reminder</span>
                            <button className={`settings-toggle ${dailyChallengeReminder ? "active" : ""}`} onClick={() => { setDailyChallengeReminder(!dailyChallengeReminder); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Achievement Alerts</span>
                            <button className={`settings-toggle ${achievementAlerts ? "active" : ""}`} onClick={() => { setAchievementAlerts(!achievementAlerts); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Weekly Progress Report</span>
                            <button className={`settings-toggle ${weeklyProgressReport ? "active" : ""}`} onClick={() => { setWeeklyProgressReport(!weeklyProgressReport); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>
                        <div className="settings-row">
                            <span>Collaboration Requests</span>
                            <button className={`settings-toggle ${collaborationNotifications ? "active" : ""}`} onClick={() => { setCollaborationNotifications(!collaborationNotifications); saveSettings(); }}>
                                <span className="toggle-knob" />
                            </button>
                        </div>

                        <div className="settings-note">
                            Manage how you receive updates from CodeGenius
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MenuDropdown;
