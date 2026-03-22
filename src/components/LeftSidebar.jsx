// LeftSidebar.jsx – Left Sidebar with Main Navigation Items
import React from "react";
import "../App.css";

function LeftSidebar({ setPage, activePage, isDark, toggleTheme, onLogout, user, onReportClick }) {
    // Main navigation items with professional SVG icons
    const menuItems = [
        {
            key: 'dashboard',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
            label: 'Dashboard',
            page: 'dashboard'
        },
        {
            key: 'analyzer',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" /></svg>,
            label: 'Analyzer',
            page: 'analyzer'
        },
        {
            key: 'converter',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
            label: 'Converter',
            page: 'converter'
        },
        {
            key: 'problemSolving',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
            label: 'Problems',
            page: 'problemSolving'
        },
        {
            key: 'contests',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><circle cx="12" cy="6" r="1" /></svg>,
            label: 'Contests',
            page: 'contests'
        },
        {
            key: 'leaderboard',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
            label: 'Leaderboard',
            page: 'leaderboard'
        },
        {
            key: 'upload',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
            label: 'Projects',
            page: 'upload'
        },
        {
            key: 'insights',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
            label: 'Insights',
            page: 'insights'
        },
    ];

    const handleMenuClick = (item) => {
        if (item.page) {
            setPage(item.page);
        }
    };

    return (
        <aside className="left-sidebar-simple">
            {/* Scrollable Menu Content */}
            <div className="left-sidebar-scroll">
                {/* Menu Buttons */}
                <div className="left-menu-buttons">
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`left-menu-btn ${activePage === item.page ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item)}
                            title={item.label}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-text">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Report Button at Bottom */}
            <div className="left-menu-footer">
                <button
                    className="left-menu-btn report-btn"
                    onClick={onReportClick}
                    title="Report Issue"
                >
                    <span className="menu-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </span>
                    <span className="menu-text">Report</span>
                </button>
            </div>
        </aside>
    );
}

export default LeftSidebar;
