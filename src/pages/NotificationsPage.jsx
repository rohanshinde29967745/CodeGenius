// NotificationsPage.jsx - Full page notifications view
import React, { useState, useEffect } from "react";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getCurrentUser
} from "../services/api";
import "../App.css";

function NotificationsPage({ setPage }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, achievement, connection, etc.

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (!user?.id) return;

            const result = await getNotifications(user.id, 100);
            setNotifications(result.notifications || []);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const user = getCurrentUser();
            if (!user?.id) return;

            await markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
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
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'achievement': return '🏆';
            case 'connection': return '👥';
            case 'streak': return '🔥';
            case 'collab': return '🤝';
            case 'project': return '📁';
            case 'problem': return '💡';
            case 'contest': return '🏁';
            default: return '📢';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.is_read;
        return n.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notifications-page">
            {/* Header */}
            <div className="page-header-row">
                <button className="back-button" onClick={() => setPage('dashboard')}>
                    ← Back
                </button>
                <div className="page-title-section">
                    <h1 className="page-title">🔔 Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} unread</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="notification-filters">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread
                </button>
                <button
                    className={`filter-tab ${filter === 'achievement' ? 'active' : ''}`}
                    onClick={() => setFilter('achievement')}
                >
                    🏆 Achievements
                </button>
                <button
                    className={`filter-tab ${filter === 'connection' ? 'active' : ''}`}
                    onClick={() => setFilter('connection')}
                >
                    👥 Connections
                </button>
                <button
                    className={`filter-tab ${filter === 'collab' ? 'active' : ''}`}
                    onClick={() => setFilter('collab')}
                >
                    🤝 Collaborations
                </button>
                <button
                    className={`filter-tab ${filter === 'contest' ? 'active' : ''}`}
                    onClick={() => setFilter('contest')}
                >
                    🏁 Contests
                </button>
            </div>

            {/* Notifications List */}
            <div className="notifications-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <div className="notifications-list-full">
                        {filteredNotifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-card ${notif.is_read ? 'read' : 'unread'}`}
                            >
                                <div className="notification-icon-large">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="notification-body">
                                    <h4 className="notification-title">{notif.title || notif.type}</h4>
                                    <p className="notification-message">{notif.message}</p>
                                    <span className="notification-time">{formatTimeAgo(notif.created_at)}</span>
                                </div>
                                <div className="notification-actions">
                                    {!notif.is_read && (
                                        <button
                                            className="action-btn mark-read"
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            title="Mark as read"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDelete(notif.id)}
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-large">
                        <span className="empty-icon">🔔</span>
                        <h3>No notifications</h3>
                        <p>
                            {filter === 'all'
                                ? "You're all caught up! Check back later for updates."
                                : `No ${filter} notifications to show.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationsPage;
