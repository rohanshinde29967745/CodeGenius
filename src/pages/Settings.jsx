import React, { useState, useEffect } from "react";
import { getCurrentUser, updateUserProfile, changePassword, deleteAccount, getProfile } from "../services/api";
import "../App.css"; // Keep for globals
import "./Settings.css"; // Isolated CSS

function Settings({ isDark, toggleTheme, setIsLoggedIn, setPage }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    bio: "",
    location: "",
    github: "",
    linkedin: "",
    profilePhoto: ""
  });

  // Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Privacy & Preferences
  const [profileVisibility, setProfileVisibility] = useState("Public");
  const [language, setLanguage] = useState("English");
  const [editorTheme, setEditorTheme] = useState("Monokai");
  const [fontSize, setFontSize] = useState("14px");

  // Danger Zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      try {
        const data = await getProfile(currentUser.id);
        if (data.user) {
          setProfileData({
            fullName: data.user.fullName || "",
            email: data.user.email || "",
            bio: data.user.bio || "",
            location: data.user.location || "",
            github: data.user.github || "",
            linkedin: data.user.linkedin || "",
            profilePhoto: data.user.profilePhoto || ""
          });
          setProfileVisibility(data.user.isPrivate ? "Private" : "Public");
        }

        const savedSettings = localStorage.getItem(`codegenius_settings_${currentUser.id}`);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.language) setLanguage(settings.language);
          if (settings.editorTheme) setEditorTheme(settings.editorTheme);
          if (settings.fontSize) setFontSize(settings.fontSize);
          if (settings.profileVisibility) setProfileVisibility(settings.profileVisibility);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const currentUser = getCurrentUser();
      await updateUserProfile(currentUser.id, {
        fullName: profileData.fullName,
        bio: profileData.bio,
        location: profileData.location,
        github: profileData.github,
        linkedin: profileData.linkedin,
        isPrivate: profileVisibility === "Private"
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg({ type: "", text: "" });
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return setPasswordMsg({ type: "error", text: "Please fill all fields" });
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordMsg({ type: "error", text: "Passwords do not match" });
    }
    
    try {
      const currentUser = getCurrentUser();
      const result = await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
      if (result.error) throw new Error(result.error);
      
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return alert("Please enter password");
    try {
      const currentUser = getCurrentUser();
      const result = await deleteAccount(currentUser.id, deletePassword);
      if (result.error) throw new Error(result.error);
      
      localStorage.clear();
      setIsLoggedIn(false);
      setPage("home");
    } catch (err) {
      alert(err.message || "Failed to delete account");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("codegenius_user");
      localStorage.removeItem("codegenius_token");
      setIsLoggedIn(false);
      setPage("home");
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && !loading) {
      localStorage.setItem(`codegenius_settings_${currentUser.id}`, JSON.stringify({
        language, editorTheme, fontSize, profileVisibility
      }));
    }
  }, [language, editorTheme, fontSize, profileVisibility, loading]);

  if (loading) return <div className="set-loading"><div className="set-spinner"></div>Loading Settings...</div>;

  return (
    <div className="set-page">
      {/* Container specific to settings for layout restriction */}
      <div className="set-layout">
        
        {/* Left Sidebar */}
        <div className="set-sidebar">
          <h2 className="set-sidebar-title">Settings</h2>
          <div className="set-nav">
            {[
              { id: 'profile', label: 'Public Profile', icon: '👤' },
              { id: 'account', label: 'Account Security', icon: '🛡️' },
              { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`set-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="set-nav-icon">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button className="set-nav-btn hover-danger" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontWeight: '500', transition: 'all 0.2s' }}>
               <span className="set-nav-icon" style={{ fontSize: '18px' }}>🚪</span> Log Out
             </button>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="set-main">
          
          {activeTab === 'profile' && (
            <div className="set-card">
              <div className="set-card-header">
                <div>
                  <h3 className="set-card-title">Public Profile</h3>
                  <p className="set-card-sub">Edit your profile information visible to other users.</p>
                </div>
                <div className="set-mini-status">
                  <span className="set-ms-icon">👤</span>
                  <div className="set-ms-text">
                     <span className="set-ms-label">Profile Visibility</span>
                     <span className="set-ms-val">{profileVisibility}</span>
                  </div>
                </div>
              </div>

              <div className="set-card-body">
                <div className="set-section">
                  <h4 className="set-section-title">Basic Info</h4>
                  <div className="set-form-group">
                    <label className="set-label">FULL NAME</label>
                    <input type="text" className="set-input" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                  </div>
                  <div className="set-form-group">
                    <label className="set-label">BIO</label>
                    <textarea className="set-input set-textarea" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})}></textarea>
                  </div>
                </div>

                <div className="set-section">
                  <h4 className="set-section-title">Additional Info</h4>
                  <div className="set-grid-2">
                    <div className="set-form-group">
                      <label className="set-label">LOCATION</label>
                      <input type="text" className="set-input" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} />
                    </div>
                    <div className="set-form-group">
                      <label className="set-label">GITHUB URL</label>
                      <input type="text" className="set-input" value={profileData.github} onChange={e => setProfileData({...profileData, github: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="set-card-footer">
                <button className="set-btn-secondary" onClick={() => setPage('dashboard')}>Cancel</button>
                <button className="set-btn-primary" onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="set-card">
              <div className="set-card-header">
                <div>
                  <h3 className="set-card-title">Account Security</h3>
                  <p className="set-card-sub">Manage your email and password details safely.</p>
                </div>
              </div>

              <div className="set-card-body">
                <div className="set-section">
                  <div className="set-form-group">
                    <label className="set-label">EMAIL ADDRESS</label>
                    <input type="email" className="set-input set-input-disabled" value={profileData.email} disabled />
                  </div>
                </div>

                <div className="set-section">
                  <h4 className="set-section-title">Change Password</h4>
                  {passwordMsg.text && (
                    <div className={`set-alert ${passwordMsg.type}`}>{passwordMsg.text}</div>
                  )}
                  <div className="set-form-group">
                    <input type="password" placeholder="Current Password" className="set-input" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                  </div>
                  <div className="set-form-group">
                    <input type="password" placeholder="New Password" className="set-input" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                  </div>
                  <div className="set-form-group">
                    <input type="password" placeholder="Confirm New Password" className="set-input" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="set-card-footer">
                <button className="set-btn-primary" onClick={handlePasswordChange}>Update Password</button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="set-card">
              <div className="set-card-header">
                <div>
                  <h3 className="set-card-title">Application Preferences</h3>
                  <p className="set-card-sub">Customize your visual layout and privacy settings.</p>
                </div>
              </div>

              <div className="set-card-body">
                <div className="set-pref-list">
                  
                  <div className="set-pref-item">
                    <div className="set-pref-info">
                      <h4 className="set-pref-title">Dark Theme</h4>
                      <p className="set-pref-desc">Toggle between light and dark mode</p>
                    </div>
                    <button className={`toggle-switch ${isDark ? "active" : ""}`} onClick={toggleTheme}>
                      <span className="toggle-slider" />
                    </button>
                  </div>

                  <div className="set-pref-item">
                    <div className="set-pref-info">
                      <h4 className="set-pref-title">Profile Visibility</h4>
                      <p className="set-pref-desc">Who can see your profile</p>
                    </div>
                    <select className="set-select" value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)}>
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>

                  <div className="set-pref-item">
                    <div className="set-pref-info">
                      <h4 className="set-pref-title">Editor Theme</h4>
                      <p className="set-pref-desc">Color scheme for code editor</p>
                    </div>
                    <select className="set-select" value={editorTheme} onChange={e => setEditorTheme(e.target.value)}>
                      <option value="Monokai">Monokai</option>
                      <option value="Dracula">Dracula</option>
                    </select>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="set-card">
              <div className="set-card-header">
                <div>
                  <h3 className="set-card-title danger-text">Danger Zone</h3>
                  <p className="set-card-sub">Permanently delete your account and all associated data.</p>
                </div>
              </div>

              <div className="set-card-body">
                <div className="set-danger-box">
                  <h4 className="danger-text">Delete Account</h4>
                  <p className="set-desc">Once you delete your account, there is no going back. Please be absolutely certain.</p>
                  
                  {!showDeleteConfirm ? (
                    <button className="set-btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                  ) : (
                    <div className="set-danger-confirm">
                      <input type="password" placeholder="Enter password to confirm" className="set-input danger-input" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                      <button className="set-btn-danger" onClick={handleDeleteAccount}>Confirm Deletion</button>
                      <button className="set-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Settings;
