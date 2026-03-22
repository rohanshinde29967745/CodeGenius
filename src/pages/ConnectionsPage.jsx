// ConnectionsPage.jsx - Full page connections view
import React, { useState, useEffect } from "react";
import {
    getFriends,
    getPendingConnections,
    getAllUsers,
    sendConnectionRequest,
    acceptConnectionRequest,
    getCurrentUser
} from "../services/api";
import UserProfileModal from "../components/UserProfileModal";
import "../App.css";

function ConnectionsPage({ setPage }) {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]); // Track sent requests locally
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(null); // Track which user we're sending to
    const [selectedUserId, setSelectedUserId] = useState(null); // For profile modal

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [friendsData, requestsData] = await Promise.all([
                getFriends(),
                getPendingConnections()
            ]);
            setFriends(friendsData || []);
            setPendingRequests(requestsData || []);
        } catch (error) {
            console.error("Error loading connections:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length > 1) {
            try {
                const results = await getAllUsers(query);
                setSearchResults(results || []);
            } catch (error) {
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleConnect = async (userId, userName) => {
        setSendingRequest(userId);
        try {
            const result = await sendConnectionRequest(userId);
            console.log("Connection request result:", result);

            // Add to sent requests list immediately for UI feedback
            setSentRequests(prev => [...prev, userId]);

            // Update search results to show "Request Sent"
            setSearchResults(prev => prev.map(user =>
                user.id === userId
                    ? { ...user, connection_status: 'pending' }
                    : user
            ));

            // Reload data after a short delay
            setTimeout(() => {
                handleSearch(searchQuery);
            }, 500);
        } catch (error) {
            console.error("Error sending connection:", error);
            alert("Failed to send connection request. Please try again.");
        } finally {
            setSendingRequest(null);
        }
    };

    const handleAccept = async (connectionId) => {
        try {
            await acceptConnectionRequest(connectionId);
            loadData();
        } catch (error) {
            console.error("Error accepting connection:", error);
        }
    };

    // Check if request has been sent to a user
    const isRequestSent = (userId) => {
        return sentRequests.includes(userId);
    };

    return (
        <div className="connections-page">
            {/* Enhanced Header */}
            <div className="connections-header">
                <button className="connections-back-btn" onClick={() => setPage('dashboard')}>
                    <span>←</span>
                    <span>Back</span>
                </button>
                <div className="connections-title-section">
                    <h1 className="connections-title">👥 Connections</h1>
                    <div className="connections-stats">
                        <span className="stat-pill friends">
                            <span>🤝</span> {friends.length} Friends
                        </span>
                        <span className="stat-pill pending">
                            <span>📬</span> {pendingRequests.length} Pending
                        </span>
                    </div>
                </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="connections-search-section">
                <div className="connections-search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="connections-search-input"
                        placeholder="Search for users to connect..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear-btn"
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="search-results-section">
                    <h3>Search Results</h3>
                    <div className="users-grid">
                        {searchResults.map(user => (
                            <div
                                key={user.id}
                                className="user-card clickable"
                                onClick={() => setSelectedUserId(user.id)}
                            >
                                <img
                                    src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=667eea&color=fff`}
                                    alt=""
                                    className="user-avatar"
                                />
                                <div className="user-info">
                                    <h4>{user.full_name}</h4>
                                    <p className="user-level">Level {user.current_level || 1}</p>
                                </div>
                                {user.connection_status === 'accepted' ? (
                                    <span className="status-badge connected">✓ Connected</span>
                                ) : user.connection_status === 'pending' || isRequestSent(user.id) ? (
                                    <span className="status-badge sent">📤 Request Sent</span>
                                ) : sendingRequest === user.id ? (
                                    <button className="connect-btn-large sending" disabled>
                                        <span className="spinner-small"></span> Sending...
                                    </button>
                                ) : (
                                    <button
                                        className="connect-btn-large"
                                        onClick={() => handleConnect(user.id, user.full_name)}
                                    >
                                        + Connect
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* Tabs */}
            <div className="connections-tabs">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends ({friends.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Requests ({pendingRequests.length})
                </button>
            </div>

            {/* Content */}
            <div className="connections-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading connections...</p>
                    </div>
                ) : (
                    <>
                        {/* Friends Tab */}
                        {activeTab === 'friends' && (
                            friends.length > 0 ? (
                                <div className="users-grid">
                                    {friends.map(friend => (
                                        <div
                                            key={friend.id}
                                            className="user-card friend-card clickable"
                                            onClick={() => setSelectedUserId(friend.id)}
                                        >
                                            <img
                                                src={friend.profile_photo_url || `https://ui-avatars.com/api/?name=${friend.full_name}&background=667eea&color=fff`}
                                                alt=""
                                                className="user-avatar"
                                            />
                                            <div className="user-info">
                                                <h4>{friend.full_name}</h4>
                                                <p className="user-level">Level {friend.current_level || 1}</p>
                                                <p className="user-points">{friend.experience_points || 0} XP</p>
                                            </div>
                                            <span className="status-badge connected">✓ Connected</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state-large">
                                    <span className="empty-icon">👥</span>
                                    <h3>No connections yet</h3>
                                    <p>Search for users above to start connecting with the community!</p>
                                </div>
                            )
                        )}

                        {/* Pending Requests Tab */}
                        {activeTab === 'pending' && (
                            pendingRequests.length > 0 ? (
                                <div className="users-grid">
                                    {pendingRequests.map(request => (
                                        <div
                                            key={request.id}
                                            className="user-card request-card clickable"
                                            onClick={() => setSelectedUserId(request.user_id)}
                                        >
                                            <img
                                                src={request.profile_photo_url || `https://ui-avatars.com/api/?name=${request.full_name}&background=667eea&color=fff`}
                                                alt=""
                                                className="user-avatar"
                                            />
                                            <div className="user-info">
                                                <h4>{request.full_name}</h4>
                                                <p className="user-level">Wants to connect</p>
                                            </div>
                                            <div className="request-actions">
                                                <button
                                                    className="accept-btn-large"
                                                    onClick={(e) => { e.stopPropagation(); handleAccept(request.id); }}
                                                >
                                                    ✓ Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state-large">
                                    <span className="empty-icon">📬</span>
                                    <h3>No pending requests</h3>
                                    <p>All caught up! No connection requests waiting.</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* User Profile Modal */}
            {
                selectedUserId && (
                    <UserProfileModal
                        userId={selectedUserId}
                        onClose={() => setSelectedUserId(null)}
                    />
                )
            }
        </div >
    );
}

export default ConnectionsPage;
