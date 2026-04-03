import React from "react";
import "../index.css";
import logo from "../assets/logo.png";

const SIDEBAR_WIDTH = 210;

const toolItems = [
    {
        key: 'dashboard', label: 'Dashboard', page: 'dashboard',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    },
    {
        key: 'problemSolving', label: 'Problems', page: 'problemSolving',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    },
    {
        key: 'analyzer', label: 'Analyzer', page: 'analyzer',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
    },
    {
        key: 'converter', label: 'Converter', page: 'converter',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    },
];

const competeItems = [
    {
        key: 'contests', label: 'Contests', page: 'contests',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    },
    {
        key: 'leaderboard', label: 'Leaderboard', page: 'leaderboard',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
    },
];

const accountItems = [
    {
        key: 'notifications', label: 'Alerts', page: 'notifications',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    },
    {
        key: 'profile', label: 'Profile', page: 'profile',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
    },
    {
        key: 'settings', label: 'Settings', page: 'settings',
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    },
];

function LeftSidebar({ setPage, activePage, onReportClick }) {

    const NavItem = ({ item }) => {
        const isActive = activePage === item.page;
        return (
            <button
                onClick={() => setPage(item.page)}
                title={item.label}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 12px',
                    border: 'none',
                    borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    borderRadius: '0 8px 8px 0',
                    background: isActive
                        ? 'linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.02) 100%)'
                        : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: '0.845rem',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.01em',
                    textAlign: 'left',
                    marginRight: '8px',
                }}
                onMouseEnter={e => {
                    if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }
                }}
                onMouseLeave={e => {
                    if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                }}
            >
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                    background: isActive ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)',
                    color: isActive ? 'var(--accent-primary)' : 'inherit',
                    transition: 'all 0.15s ease',
                }}>
                    {item.icon}
                </span>
                {item.label}
            </button>
        );
    };

    const Section = ({ label, children }) => (
        <div style={{ width: '100%' }}>
            <div style={{
                padding: '14px 14px 5px',
                fontSize: '0.62rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                opacity: 0.4,
                fontWeight: 700,
                userSelect: 'none',
            }}>
                {label}
            </div>
            {children}
        </div>
    );

    const thin = { margin: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' };

    return (
        <aside style={{
            width: `${SIDEBAR_WIDTH}px`,
            height: '100vh',           /* full height — logo area included */
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'fixed',
            left: 0,
            top: 0,                    /* starts from very top */
            overflow: 'hidden',
            zIndex: 60,                /* above TopNav (z-50) so logo is always visible */
            paddingBottom: '8px',
        }}>

            {/* ── LOGO BLOCK (same 65px height as TopNav) ── */}
            <div>
                <div
                    onClick={() => setPage('dashboard')}
                    style={{
                        height: '65px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 14px',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        userSelect: 'none',
                    }}
                >
                    <img
                        src={logo}
                        alt="CodeGenius"
                        style={{ height: '36px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                    />
                </div>

                {/* ── NAV GROUPS ── */}
                <Section label="Tools">
                    {toolItems.map(i => <NavItem key={i.key} item={i} />)}
                </Section>

                <div style={thin} />

                <Section label="Compete">
                    {competeItems.map(i => <NavItem key={i.key} item={i} />)}
                </Section>

                <div style={thin} />

                <Section label="Account">
                    {accountItems.map(i => <NavItem key={i.key} item={i} />)}
                </Section>
            </div>

            {/* ── REPORT (pinned bottom) ── */}
            <div>
                <div style={thin} />
                <button
                    onClick={onReportClick}
                    title="Report Issue"
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '7px 12px', border: 'none', borderLeft: '2px solid transparent',
                        borderRadius: '0 8px 8px 0', background: 'transparent',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        fontSize: '0.845rem', fontWeight: 400, marginRight: '8px',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </span>
                    Report Issue
                </button>
            </div>
        </aside>
    );
}

export default LeftSidebar;
