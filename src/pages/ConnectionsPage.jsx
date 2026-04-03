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
import "../App.css"; // Global styles
import "./ConnectionsPage.css"; // Scoped styles

function ConnectionsPage({ setPage }) {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

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

    const handleConnect = async (userId) => {
        setSendingRequest(userId);
        try {
            await sendConnectionRequest(userId);
            setSentRequests(prev => [...prev, userId]);
            setSearchResults(prev => prev.map(user =>
                user.id === userId ? { ...user, connection_status: 'pending' } : user
            ));
            setTimeout(() => handleSearch(searchQuery), 500);
        } catch (error) {
            console.error("Error sending connection:", error);
            alert("Failed to send connection request. Please try again.");
        } finally {
            setSendingRequest(null);
        }
    };

    const handleAccept = async (e, connectionId) => {
        e.stopPropagation();
        try {
            await acceptConnectionRequest(connectionId);
            loadData();
        } catch (error) {
            console.error("Error accepting connection:", error);
        }
    };

    const isRequestSent = (userId) => {
        return sentRequests.includes(userId);
    };

    return (
        <div className="cx-page">
            
            {/* 1. Header Section */}
            <div className="cx-header">
                <button className="cx-back-btn" onClick={() => setPage('dashboard')}>
                    ← Back
                </button>
                <div className="cx-title-box">
                    <span className="cx-title-icon">👥</span>
                    <h1 className="cx-title">Connections</h1>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="cx-main">
                
                {/* 2. Toolbar Section */}
                <div className="cx-toolbar">
                    <div className="cx-tabs-toolbar">
                        <button 
                            className={`cx-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('friends'); setSearchQuery(''); setSearchResults([]); }}
                        >
                            <span className="cx-icon">👥</span> Friends ({friends.length})
                        </button>
                        <button 
                            className={`cx-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('pending'); setSearchQuery(''); setSearchResults([]); }}
                        >
                            <span className="cx-icon">👤</span> Pending ({pendingRequests.length})
                        </button>
                    </div>
                    
                    <div className="cx-actions">
                        <div className="cx-search-wrapper">
                            <span className="cx-search-icon">🔍</span>
                            <input
                                type="text"
                                className="cx-search-input"
                                placeholder={`Search ${activeTab === 'friends' ? 'users' : 'requests'}...`}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="cx-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>✕</button>
                            )}
                        </div>
                        <button className="cx-add-btn">
                            + Add Friend
                        </button>
                    </div>
                </div>

                {/* 3. Info Strip */}
                <div className="cx-info-strip">
                    <span className="cx-icon-subtle">👥</span>
                    You have <strong className="cx-highlight">{friends.length}</strong> active connections • <strong className="cx-highlight">{pendingRequests.length}</strong> pending requests
                </div>

                {/* 4. Active Tab Line Display (Visual structural reinforcement from screenshot) */}
                <div className="cx-active-tab-indicator">
                    <span className={`cx-indicator-text ${activeTab === 'friends' ? 'active' : ''}`}>👥 Friends ({friends.length})</span>
                    <span className="cx-divider">|</span>
                    <span className={`cx-indicator-text ${activeTab === 'pending' ? 'active' : ''}`}>Pending ({pendingRequests.length})</span>
                </div>

                {/* 5. Connections List */}
                <div className="cx-list">
                    {loading ? (
                        <div className="cx-loading">Loading connections...</div>
                    ) : searchQuery && searchResults.length > 0 ? (
                        /* Search Results */
                        searchResults.map(user => (
                            <div key={user.id} className="cx-card clickable" onClick={() => setSelectedUserId(user.id)}>
                                <div className="cx-card-left">
                                    <img src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=667eea&color=fff`} alt="" className="cx-avatar" />
                                    <div className="cx-user-details">
                                        <h4 className="cx-name">{user.full_name}</h4>
                                        <span className="cx-level-badge">LEVEL {user.current_level || 'BRONZE'}</span>
                                        <div className="cx-status-line">
                                            <span className="cx-dot offline"></span> {user.experience_points || 0} XP
                                        </div>
                                    </div>
                                </div>
                                <div className="cx-card-right">
                                    {user.connection_status === 'accepted' ? (
                                        <div className="cx-status-connected">✓ CONNECTED</div>
                                    ) : user.connection_status === 'pending' || isRequestSent(user.id) ? (
                                        <div className="cx-status-connected sent">📤 SENT</div>
                                    ) : (
                                        <button className="cx-action-btn primary" onClick={(e) => { e.stopPropagation(); handleConnect(user.id); }}>
                                            {sendingRequest === user.id ? "Sending..." : "Connect"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : activeTab === 'friends' ? (
                        /* Friends List */
                        friends.length > 0 ? (
                            friends.map(friend => (
                                <div key={friend.id} className="cx-card clickable" onClick={() => setSelectedUserId(friend.id)}>
                                    <div className="cx-card-left">
                                        <img src={friend.profile_photo_url || `https://ui-avatars.com/api/?name=${friend.full_name}&background=667eea&color=fff`} alt="" className="cx-avatar" />
                                        <div className="cx-user-details">
                                            <h4 className="cx-name">{friend.full_name}</h4>
                                            <span className="cx-level-badge">LEVEL {friend.current_level || 'BRONZE'}</span>
                                            <div className="cx-status-line">
                                                <span className="cx-dot online"></span> Online
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cx-card-right">
                                        <div className="cx-status-connected">✓ CONNECTED</div>
                                        <button className="cx-action-btn remove">Remove</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="cx-empty">
                                <span className="cx-empty-icon">👥</span>
                                <h3>No active connections</h3>
                                <p>Try connecting with new users above.</p>
                            </div>
                        )
                    ) : (
                        /* Pending List */
                        pendingRequests.length > 0 ? (
                            pendingRequests.map(request => (
                                <div key={request.id} className="cx-card clickable" onClick={() => setSelectedUserId(request.user_id)}>
                                    <div className="cx-card-left">
                                        <img src={request.profile_photo_url || `https://ui-avatars.com/api/?name=${request.full_name}&background=667eea&color=fff`} alt="" className="cx-avatar" />
                                        <div className="cx-user-details">
                                            <h4 className="cx-name">{request.full_name}</h4>
                                            <span className="cx-level-badge">WANTS TO CONNECT</span>
                                            <div className="cx-status-line">
                                                <span className="cx-dot offline"></span> Pending Request
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cx-card-right">
                                        <div className="cx-status-connected pending">PENDING</div>
                                        <button className="cx-action-btn accept" onClick={(e) => handleAccept(e, request.id)}>Accept</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="cx-empty">
                                <span className="cx-empty-icon">📭</span>
                                <h3>No pending requests</h3>
                                <p>Try connecting with new users.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedUserId && (
                <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
}

export default ConnectionsPage;
