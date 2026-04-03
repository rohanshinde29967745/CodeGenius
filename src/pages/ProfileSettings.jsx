import React, { useState, useRef, useEffect } from "react";
import { getCurrentUser, getProfile, getUserProjects, getUserStats, getUserBadges, getUserSkills, updateUserProfile, getFriends, getUserActivity } from "../services/api";
import "../App.css"; // Keep for globals
import "./ProfileSettings.css"; // Isolated CSS

function ProfileSettings({ isDark, setPage }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({});
  const [profilePhoto, setProfilePhoto] = useState("");
  const [friendsCount, setFriendsCount] = useState(0);
  const [stats, setStats] = useState({
    problemsSolved: 0, accuracy: 0, currentLevel: "Bronze",
    currentXp: 0, xpToNextLevel: 1000, totalPoints: 0, currentStreak: 0
  });
  const [userProjects, setUserProjects] = useState([]);
  const [badges, setBadges] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return setLoading(false);
      try {
        const [profData, statsData, projData, badgeData, friendsData, activityData] = await Promise.all([
          getProfile(currentUser.id).catch(() => ({})),
          getUserStats(currentUser.id).catch(() => ({})),
          getUserProjects(currentUser.id).catch(() => ({})),
          getUserBadges(currentUser.id).catch(() => ({})),
          getFriends().catch(() => ([])), // Load connections
          getUserActivity(currentUser.id, 5).catch(() => ({}))
        ]);

        if (profData.user) {
          setProfileData(profData.user);
          setProfilePhoto(profData.user.profilePhoto || "");
        }
        if (statsData.stats) setStats(prev => ({...prev, ...statsData.stats}));
        if (projData.projects) setUserProjects(projData.projects);
        if (badgeData.badges) setBadges(badgeData.badges);
        if (friendsData) setFriendsCount(Array.isArray(friendsData) ? friendsData.length : 0);
        if (activityData.activities) setRecentActivities(activityData.activities);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setProfilePhoto(reader.result);
        const currentUser = getCurrentUser();
        if (currentUser) {
          await updateUserProfile(currentUser.id, { profilePhoto: reader.result }).catch(console.error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="prof-loading"><div className="prof-spinner"></div> Loading Profile...</div>;

  const levelColor = stats.currentLevel.toLowerCase() === 'bronze' ? '#d97706' : 
                     stats.currentLevel.toLowerCase() === 'silver' ? '#94a3b8' : 
                     stats.currentLevel.toLowerCase() === 'gold' ? '#eab308' : '#a855f7';

  return (
    <div className="prof-page">
      
      {/* 1. Header Section */}
      <div className="prof-header-card">
        <div className="prof-header-glow"></div>
        <div className="prof-header-content">
          <div className="prof-header-left">
            <div className="prof-avatar-box" onClick={() => fileInputRef.current?.click()}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="prof-avatar-img" />
              ) : (
                <span className="prof-avatar-text">{profileData.fullName?.charAt(0) || "U"}</span>
              )}
              <div className="prof-avatar-overlay">📷</div>
            </div>
            <div className="prof-user-info">
              <h1 className="prof-name">{profileData.fullName || "Developer"}</h1>
              <p className="prof-bio">{profileData.bio || "Passionate developer on CodeGenius."}</p>
            </div>
          </div>
          <div className="prof-header-right">
            <button className="prof-btn-edit" onClick={() => setPage('settings')}>Edit Profile</button>
            <div className="prof-level-pill">
              <span className="prof-level-icon" style={{color: levelColor}}>🏆</span>
              <span className="prof-level-text" style={{color: levelColor}}>{stats.currentLevel}</span> Level ▸
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="prof-grid">
        
        {/* Left Column */}
        <div className="prof-col-left">
          
          {/* Coding Statistics Block */}
          <div className="prof-card">
            <h3 className="prof-card-title">Coding Statistics</h3>
            
            <div className="prof-stats-grid">
              <div className="prof-stat-box">
                <span className="prof-stat-value">{stats.totalPoints.toLocaleString()}</span>
                <span className="prof-stat-label">Total Points</span>
              </div>
              <div className="prof-stat-box">
                <span className="prof-stat-value">{stats.currentStreak} <span className="prof-emoji">🔥</span></span>
                <span className="prof-stat-label">Day Streak</span>
              </div>
              <div className="prof-stat-box">
                <span className="prof-stat-value">{stats.problemsSolved} <span className="prof-icon-bar">📊</span></span>
                <span className="prof-stat-label">Problems Solved</span>
              </div>
              <div className="prof-stat-box">
                <span className="prof-stat-value">{stats.accuracy}%</span>
                <span className="prof-stat-label">Accuracy</span>
              </div>
            </div>

            {/* Embedded Level Progress */}
            <div className="prof-progress-box">
              <div className="prof-progress-header">
                <span className="prof-prog-level" style={{color: levelColor}}>🏆 LEVEL {stats.currentLevel.toUpperCase()}</span>
                <span className="prof-prog-xp">{stats.currentXp} / {stats.xpToNextLevel} XP to next level</span>
              </div>
              <div className="prof-progress-bar-bg">
                <div className="prof-progress-bar-fill" style={{ width: `${Math.min(100, (stats.currentXp / stats.xpToNextLevel) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Bottom Row inside Left Column */}
          <div className="prof-sub-grid">
            
            {/* Connections */}
            <div className="prof-card prof-conn-card">
              <h3 className="prof-card-title">Connections</h3>
              <div className="prof-conn-inner">
                <div className="prof-conn-group">
                  <div className="prof-conn-avatars">
                    <div className="prof-c-dot">RS</div>
                    <div className="prof-c-dot">YJ</div>
                  </div>
                  <div className="prof-conn-count">
                    <span className="prof-icon-c">👥</span> Friends: &nbsp;&nbsp; <span>{friendsCount}</span> &gt;
                  </div>
                </div>
                <button className="prof-btn-view" onClick={() => setPage('connections')}>View Connections</button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="prof-card prof-act-card">
              <h3 className="prof-card-title">Recent Activity</h3>
              <div className="prof-act-list">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map(act => (
                    <div key={act.id} className="prof-act-item">
                      <span className={`prof-act-icon ${act.type.includes('solve') ? 'check' : 'trophy'}`}>
                        {act.type.includes('solve') ? '✓' : '🏆'}
                      </span>
                      <div className="prof-act-text">
                        <span className="prof-act-bold">{(act.description || "").split(' ')[0]}</span> {(act.description || "").substring((act.description || "").indexOf(' ') + 1)}
                      </div>
                      <span className="prof-act-time">{new Date(act.time).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="prof-empty-state">
                    <p className="prof-empty-sub" style={{margin: '0', fontSize: '14px', color: '#64748b'}}>No recent activity.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className="prof-col-right">
          
          {/* Earned Badges */}
          <div className="prof-card">
            <h3 className="prof-card-title">Earned Badges</h3>
            <div className="prof-empty-state">
              <span className="prof-empty-icon">🏆</span>
              <h4 className="prof-empty-title">No badges yet</h4>
              <p className="prof-empty-sub">Start solving to earn badges.</p>
            </div>
          </div>

          {/* Featured Projects */}
          <div className="prof-card">
            <h3 className="prof-card-title">Featured Projects</h3>
            {userProjects.length > 0 ? (
              <div className="prof-proj-list">
                {userProjects.slice(0, 3).map(p => (
                  <div key={p.id} className="prof-proj-item">
                    <h4>{p.title}</h4>
                    <span>{p.language}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prof-empty-state">
                <span className="prof-empty-icon">🗃️</span>
                <p className="prof-empty-sub">No projects uploaded yet.</p>
              </div>
            )}
            <button className="prof-btn-upload" onClick={() => setPage('upload')}>
              Upload Project
            </button>
          </div>

        </div>

      </div>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
    </div>
  );
}

export default ProfileSettings;
