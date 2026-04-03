import React from "react";
import "../index.css";

function Sidebar({ setPage, activePage, isOpen, onClose, userRole, onLogout, onReportClick }) {
  const adminMenu = [
    { key: "admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, label: "Dashboard" },
    { key: "reports", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>, label: "Reports" },
  ];

  const userMenu = [
    { key: "dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>, label: "Dashboard" },
    { key: "analyzer", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" /></svg>, label: "Code Analyzer" },
    { key: "converter", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 3.9-2.5 7.2-6 8.4V21h-6v-1.6c-3.5-1.2-6-4.5-6-8.4a9 9 0 0 1 9-9z" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M9 15c.6.6 1.5 1 2.5 1s1.9-.4 2.5-1" /><path d="M12 2v3" /></svg>, label: "Code Converter" },
    { key: "problemSolving", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><line x1="6" y1="9" x2="6" y2="12" /><line x1="18" y1="9" x2="18" y2="12" /><path d="M6 12a6 6 0 0 0 6 6" /><path d="M18 12a6 6 0 0 1-6 6" /></svg>, label: "Problem Solving" },
    { key: "leaderboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>, label: "Leaderboard" },
    { key: "upload", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>, label: "Upload Project" },
    { key: "profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>, label: "Profile Settings" },
  ];

  const menu = userRole === "Admin" ? adminMenu : userMenu;

  const handleItemClick = (key) => {
    setPage(key);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        />
      )}

      <aside style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-100%',
        width: '280px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        transition: 'left 0.3s ease',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
      }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '700' }}>
            <span style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>CodeGenius</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>.AI</span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menu.map((item) => {
            const isActive = activePage === item.key;
            return (
              <li
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'background 0.2s, color 0.2s',
                  border: '1px solid transparent',
                  borderColor: isActive ? 'var(--border-color)' : 'transparent'
                }}
                onMouseEnter={e => {
                  if(!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if(!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ color: isActive ? 'var(--accent-primary)' : 'currentColor' }}>{item.icon}</div>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>

        {userRole === "Admin" && (
          <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--error-color)',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        )}

        {userRole !== "Admin" && (
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={onReportClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              Report Issue
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
