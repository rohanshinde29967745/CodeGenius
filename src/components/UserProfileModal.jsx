// UserProfileModal.jsx - Modal to view other user's profile

import React, { useState, useEffect } from "react";
import { getUserProfile, sendConnectionRequest } from "../services/api";
import "../App.css";

function UserProfileModal({ userId, onClose }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        if (userId) {
            loadProfile();
        }
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getUserProfile(userId);
            setProfile(data);
        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        setSendingRequest(true);
        try {
            await sendConnectionRequest(userId);
            setRequestSent(true);
        } catch (error) {
            console.error("Failed to send request:", error);
        } finally {
            setSendingRequest(false);
        }
    };

    const getLevelTitle = (level) => {
        if (level >= 50) return "Master";
        if (level >= 30) return "Expert";
        if (level >= 15) return "Advanced";
        if (level >= 5) return "Intermediate";
        return "Beginner";
    };

    const getXpProgress = (xp) => {
        const xpForNextLevel = 1000;
        return ((xp % xpForNextLevel) / xpForNextLevel) * 100;
    };

    if (!userId) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="profile-modal-close" onClick={onClose}>
                    ✕
                </button>

                {loading ? (
                    <div className="profile-modal-loading">
                        <div className="spinner"></div>
                        <p>Loading profile...</p>
                    </div>
                ) : profile?.error ? (
                    <div className="profile-modal-error">
                        <span>❌</span>
                        <p>{profile.error}</p>
                    </div>
                ) : !profile?.canViewDetails ? (
                    /* Private Profile View */
                    <div className="profile-modal-private">
                        <div className="profile-modal-header">
                            <img
                                src={profile.profilePhotoUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=667eea&color=fff&size=120`}
                                alt=""
                                className="profile-modal-avatar"
                            />
                            <h2>{profile.fullName}</h2>
                        </div>

                        <div className="profile-private-message">
                            <span className="lock-icon">🔒</span>
                            <h3>Private Profile</h3>
                            <p>{profile.message}</p>

                            {requestSent ? (
                                <div className="request-sent-badge">
                                    <span>📤</span> Request Sent!
                                </div>
                            ) : (
                                <button
                                    className="send-request-btn"
                                    onClick={handleSendRequest}
                                    disabled={sendingRequest}
                                >
                                    {sendingRequest ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <span>➕</span>
                                            Send Connection Request
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Full Profile View */
                    <div className="profile-modal-full">
                        {/* Header Section */}
                        <div className="profile-modal-header">
                            <img
                                src={profile.profilePhotoUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=667eea&color=fff&size=120`}
                                alt=""
                                className="profile-modal-avatar"
                            />
                            <div className="profile-modal-name-section">
                                <h2>{profile.fullName}</h2>
                                <div className="profile-level-badge">
                                    <span>🏆</span>
                                    Level {profile.level} • {getLevelTitle(profile.level)}
                                </div>
                            </div>
                            {profile.isConnected && (
                                <span className="connected-badge-modal">✓ Connected</span>
                            )}
                        </div>

                        {/* XP Progress Bar */}
                        <div className="profile-xp-section">
                            <div className="xp-label">
                                <span>Experience</span>
                                <span>{profile.xp?.toLocaleString() || 0} XP</span>
                            </div>
                            <div className="xp-bar">
                                <div
                                    className="xp-fill"
                                    style={{ width: `${getXpProgress(profile.xp || 0)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        {profile.bio && (
                            <div className="profile-bio-section">
                                <h3>About</h3>
                                <p>{profile.bio}</p>
                            </div>
                        )}

                        {/* Stats Section */}
                        <div className="profile-stats-section">
                            <div className="stat-card">
                                <span className="stat-icon">🏅</span>
                                <div className="stat-value">{profile.totalPoints?.toLocaleString() || 0}</div>
                                <div className="stat-label">Total Points</div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">📁</span>
                                <div className="stat-value">{profile.stats?.projectsCount || 0}</div>
                                <div className="stat-label">Projects</div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">✅</span>
                                <div className="stat-value">{profile.stats?.problemsSolved || 0}</div>
                                <div className="stat-label">Problems Solved</div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="profile-skills-section">
                                <h3>Skills</h3>
                                <div className="skills-list">
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} className="skill-badge">
                                            {skill.skill_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges Section */}
                        {profile.badges && profile.badges.length > 0 && (
                            <div className="profile-badges-section">
                                <h3>Badges</h3>
                                <div className="badges-grid">
                                    {profile.badges.map((badge, i) => (
                                        <div key={i} className="badge-item" title={badge.description}>
                                            <span>{badge.icon || '🏆'}</span>
                                            <span>{badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Member Since */}
                        <div className="profile-footer">
                            <span>Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfileModal;
