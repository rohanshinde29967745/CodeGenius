// TopNav.jsx – Horizontal Navigation Bar with All Navigation Items
import React, { useState, useEffect, useRef } from "react";
import "../App.css";

function TopNav({ setPage, activePage, userRole, onMenuClick, isDark, toggleTheme, onLogout }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);
    const adminUser = JSON.parse(localStorage.getItem('user'));

    // Handle clicking outside to close search
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Simulated global search indexes
    const searchIndex = [
        { title: "Two Sum", type: "Problem", icon: "🔥", route: "problemSolving" },
        { title: "Reverse Linked List", type: "Problem", icon: "💡", route: "problemSolving" },
        { title: "AI Code Analyzer", type: "Tool", icon: "✨", route: "analyzer" },
        { title: "Code Converter", type: "Tool", icon: "🔄", route: "converter" },
        { title: "Weekly Contest #45", type: "Contest", icon: "🏆", route: "contests" },
        { title: "Project Gallery", type: "Community", icon: "📚", route: "upload" },
        { title: "Connections & Friends", type: "Users", icon: "👥", route: "connections" },
        { title: "Dashboard & Insights", type: "Page", icon: "📊", route: "dashboard" }
    ];

    const searchResults = searchQuery.trim() 
        ? searchIndex.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.type.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

    // Admin menu
    const adminMenu = [
        { key: "admin", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, label: "Dashboard" },
        { key: "contests", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>, label: "Contest" },
        { key: "reports", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, label: "Reports" },
    ];

    // User menu - Now showing sidebar items (Profile, Saved content, Friends)
    const userMenu = [
        { key: "contests", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>, label: "Contest" },
        { key: "connections", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: "Friends" },
        { key: "saved", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>, label: "Saved" },
        { key: "profile", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>, label: "Profile" },
    ];

    const menu = userRole === "Admin" ? adminMenu : userMenu;

    const handleItemClick = (key) => {
        setPage(key);
        setMobileMenuOpen(false);
        setShowSearch(false);
        setSearchQuery("");
    };

    return (
        <>
            <nav className="top-nav">
                <div className="top-nav-container">

                    {/* Global Search Bar */}
                    <div className="top-nav-search" ref={searchRef}>
                        <svg className="top-nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search problems, users, or contests..." 
                            aria-label="Search" 
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearch(true);
                            }}
                            onFocus={() => setShowSearch(true)}
                        />
                        
                        {/* Search Dropdown Results */}
                        {showSearch && searchQuery.trim() && (
                            <div className="search-dropdown" style={{ 
                                position: 'absolute', top: '100%', left: 0, right: 0, 
                                marginTop: '8px', background: isDark ? '#1E293B' : '#ffffff', 
                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                                borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                                zIndex: 1000, overflow: 'hidden'
                            }}>
                                {searchResults.length > 0 ? (
                                    <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
                                        {searchResults.map((item, idx) => (
                                            <li key={idx} 
                                                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: idx !== searchResults.length -1 ? `1px solid ${isDark ? '#334155' : '#f1f5f9'}` : 'none' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#334155' : '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => handleItemClick(item.route)}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{item.title}</span>
                                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>{item.type}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Secondary Links for Users */}
                    {userRole !== "Admin" && (
                        <div className="top-nav-secondary-links" style={{ display: 'none' }}>
                            <button className={`topnav-link ${activePage === 'upload' ? 'active' : ''}`} onClick={() => handleItemClick('upload')}>Projects</button>
                            <button className={`topnav-link ${activePage === 'connections' ? 'active' : ''}`} onClick={() => handleItemClick('connections')}>Community</button>
                            <button className={`topnav-link ${activePage === 'saved' ? 'active' : ''}`} onClick={() => handleItemClick('saved')}>Saved</button>
                            <button className={`topnav-link ${activePage === 'insights' ? 'active' : ''}`} onClick={() => handleItemClick('insights')}>Insights</button>
                        </div>
                    )}

                    {/* Right side - Notification & Menu button (users) OR Admin controls */}
                    <div className="top-nav-actions">
                        {userRole === "Admin" ? (
                            <div className="admin-topnav-controls">
                                {/* Admin identity */}
                                <div className="admin-topnav-identity">
                                    <div className="admin-topnav-avatar">
                                        {adminUser?.fullName?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="admin-topnav-info">
                                        <span className="admin-topnav-name">{adminUser?.fullName || 'Admin'}</span>
                                        <span className="admin-topnav-role">Administrator</span>
                                    </div>
                                </div>

                                {/* Dark mode toggle */}
                                <button
                                    className="admin-topnav-theme-btn"
                                    onClick={toggleTheme}
                                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                >
                                    {isDark ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="5" />
                                            <line x1="12" y1="1" x2="12" y2="3" />
                                            <line x1="12" y1="21" x2="12" y2="23" />
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                            <line x1="1" y1="12" x2="3" y2="12" />
                                            <line x1="21" y1="12" x2="23" y2="12" />
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Logout */}
                                <button
                                    className="admin-topnav-logout-btn"
                                    onClick={onLogout}
                                    title="Logout"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Notification Icon */}
                                <button
                                    className={`top-nav-notification-btn ${activePage === "notifications" ? "active" : ""}`}
                                    onClick={() => handleItemClick("notifications")}
                                    title="Notifications"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                </button>

                                {/* Settings Gear Icon */}
                                <button className="top-nav-icon-btn" onClick={() => handleItemClick("settings")} title="Account Settings">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                </button>

                                {/* User Profile Avatar (acts as Profile link) */}
                                <button
                                    className="top-nav-profile-avatar"
                                    onClick={() => handleItemClick("profile")}
                                    title="Profile Settings"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
                                </button>

                                {/* Menu Button */}
                                <button className="top-nav-menu-btn" onClick={onMenuClick} title="Menu">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        className="top-nav-mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                    <div className="top-nav-mobile-menu">
                        {/* Mobile Navigation Links - REMOVED (Navigation moved to LeftSidebar) */}
                        {userRole !== "Admin" && (
                            <>
                                <div className="top-nav-mobile-divider"></div>
                                <div className="top-nav-mobile-item" onClick={() => { onMenuClick(); setMobileMenuOpen(false); }}>
                                    <span className="top-nav-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="3" y1="6" x2="21" y2="6" />
                                            <line x1="3" y1="12" x2="21" y2="12" />
                                            <line x1="3" y1="18" x2="21" y2="18" />
                                        </svg>
                                    </span>
                                    <span className="top-nav-label">Menu</span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
}

export default TopNav;
