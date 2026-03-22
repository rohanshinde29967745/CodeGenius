// RightSidebar.jsx – Enhanced Right Sidebar with Saved Items, Add Accounts, and Settings
import React, { useState, useEffect } from "react";
import {
    getFriends, getPendingConnections, getAllUsers, sendConnectionRequest,
    acceptConnectionRequest, getSavedProblems, getSavedProjects, unsaveProblem,
    unsaveProject, getNotifications, markAllNotificationsAsRead
} from "../services/api";
import "../App.css";

function RightSidebar({ isOpen, onToggle, setPage, isDark, toggleTheme, onLogout, user }) {
    const [activeSection, setActiveSection] = useState(null);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [savedProblems, setSavedProblems] = useState([]);
    const [savedProjects, setSavedProjects] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load data when section changes
    useEffect(() => {
        if (isOpen && user?.id) {
            if (activeSection === 'connections') {
                loadConnectionsData();
            } else if (activeSection === 'savedProblems') {
                loadSavedProblems();
            } else if (activeSection === 'savedProjects') {
                loadSavedProjects();
            } else if (activeSection === 'notifications') {
                loadNotifications();
            }
        }
    }, [isOpen, activeSection, user?.id]);

    const loadConnectionsData = async () => {
        try {
            const [friendsData, requestsData] = await Promise.all([
                getFriends(),
                getPendingConnections()
            ]);
            setFriends(friendsData || []);
            setPendingRequests(requestsData || []);
        } catch (error) {
            console.error("Error loading connections:", error);
        }
    };

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

    const loadNotifications = async () => {
        try {
            const result = await getNotifications(user?.id);
            const notifs = result.notifications || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Error loading notifications:", error);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length > 0) {
            const results = await getAllUsers(query);
            setSearchResults(results || []);
        } else {
            setSearchResults([]);
        }
    };

    const handleConnect = async (userId) => {
        try {
            await sendConnectionRequest(userId);
            handleSearch(searchQuery);
        } catch (error) {
            console.error("Error sending connection:", error);
        }
    };

    const handleAccept = async (connectionId) => {
        try {
            await acceptConnectionRequest(connectionId);
            loadConnectionsData();
        } catch (error) {
            console.error("Error accepting connection:", error);
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

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead(user?.id);
            loadNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleAddAccount = () => {
        // Navigate to login page with add account mode
        localStorage.setItem('addAccountMode', 'true');
        localStorage.setItem('primaryEmail', user?.email);
        setPage('login');
        onToggle();
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 7)}w ago`;
    };

    // Menu items based on wireframe
    const menuItems = [
        { key: 'profile', icon: '👤', label: 'Profile' },
        { key: 'personalisation', icon: '🎨', label: 'Personalisation' },
        { key: 'privacy', icon: '🔒', label: 'Privacy & Security' },
        { key: 'editor', icon: '⚙️', label: 'Editor Preferences' },
        { key: 'notifications', icon: '🔔', label: 'Notification', badge: unreadCount },
        { key: 'saved', icon: '💾', label: 'Saved Items', badge: savedProblems.length + savedProjects.length },
        { key: 'addAccount', icon: '➕', label: 'Add Account' },
    ];

    return (
        <>
            {/* Collapsed sidebar - icon strip */}
            <div className={`right-sidebar-collapsed ${isOpen ? 'hidden' : ''}`}>
                <button className="sidebar-toggle-btn" onClick={onToggle} title="Expand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <button
                    className="sidebar-icon-btn"
                    onClick={() => { setActiveSection('profile'); onToggle(); }}
                    title="Profile"
                >
                    👤
                </button>
                <button
                    className="sidebar-icon-btn"
                    onClick={() => { setActiveSection('notifications'); onToggle(); }}
                    title="Notifications"
                >
                    🔔
                    {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
                </button>
                <button
                    className="sidebar-icon-btn"
                    onClick={() => { setPage('saved'); onToggle(); }}
                    title="Saved Items"
                >
                    💾
                </button>

                <div className="sidebar-divider"></div>

                <button className="sidebar-icon-btn logout" onClick={onLogout} title="Logout">
                    🚪
                </button>
            </div>

            {/* Expanded sidebar */}
            <div className={`right-sidebar-expanded ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Menu</h3>
                    <button className="sidebar-close-btn" onClick={onToggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>

                {/* Profile Card at Top */}
                <div className="profile-mini-card menu-profile">
                    <img
                        src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=667eea&color=fff`}
                        alt="Profile"
                        className="profile-mini-img"
                    />
                    <div className="profile-info">
                        <h4>{user?.fullName || 'User'}</h4>
                        <p className="profile-email">{user?.email}</p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="sidebar-menu-list">
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`sidebar-menu-item ${activeSection === item.key ? 'active' : ''}`}
                            onClick={() => {
                                if (item.key === 'addAccount') {
                                    handleAddAccount();
                                } else if (item.key === 'profile') {
                                    setPage('profile');
                                    onToggle();
                                } else if (item.key === 'personalisation' || item.key === 'privacy' || item.key === 'editor') {
                                    setPage('profile');
                                    onToggle();
                                } else if (item.key === 'saved') {
                                    setPage('saved');
                                    onToggle();
                                } else {
                                    setActiveSection(item.key);
                                }
                            }}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
                            <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="sidebar-content">
                    {/* Notifications Section */}
                    {activeSection === 'notifications' && (
                        <div className="sidebar-section">
                            <div className="section-header">
                                <h4>🔔 Notifications</h4>
                                <button className="back-btn" onClick={() => setActiveSection(null)}>←</button>
                            </div>
                            {unreadCount > 0 && (
                                <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                    Mark all as read
                                </button>
                            )}
                            {notifications.length > 0 ? (
                                <div className="notification-list">
                                    {notifications.map(notif => (
                                        <div key={notif.id} className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}>
                                            <div className="notif-icon">
                                                {notif.type === 'achievement' && '🏆'}
                                                {notif.type === 'connection' && '👥'}
                                                {notif.type === 'streak' && '🔥'}
                                                {notif.type === 'collab' && '🤝'}
                                                {notif.type === 'system' && '📢'}
                                            </div>
                                            <div className="notif-content">
                                                <p>{notif.message}</p>
                                                <span className="notif-time">{formatTimeAgo(notif.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>🔔</span>
                                    <p>No notifications</p>
                                </div>
                            )}
                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    setPage('notifications');
                                    onToggle();
                                }}
                            >
                                View All Notifications →
                            </button>
                        </div>
                    )}
                </div>

                {/* Logout Button at Bottom */}
                <div className="sidebar-footer">
                    <button className="sidebar-action-btn danger" onClick={onLogout}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
        </>
    );
}

export default RightSidebar;
