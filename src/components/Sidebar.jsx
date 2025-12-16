// Sidebar.jsx – Ultra Premium Version with Mobile Support
import React from "react";
import "../App.css";

function Sidebar({ setPage, activePage, isOpen, onClose, userRole, onLogout, onReportClick }) {
  // Admin menu - only Admin Dashboard
  const adminMenu = [
    { key: "admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, label: "Dashboard" },
    { key: "reports", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>, label: "Reports" },
  ];

  // User menu - all regular pages (no Admin Dashboard)
  const userMenu = [
    { key: "dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>, label: "Dashboard" },
    { key: "analyzer", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" /></svg>, label: "Code Analyzer" },
    { key: "converter", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 3.9-2.5 7.2-6 8.4V21h-6v-1.6c-3.5-1.2-6-4.5-6-8.4a9 9 0 0 1 9-9z" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M9 15c.6.6 1.5 1 2.5 1s1.9-.4 2.5-1" /><path d="M12 2v3" /></svg>, label: "Code Converter" },
    { key: "problemSolving", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><line x1="6" y1="9" x2="6" y2="12" /><line x1="18" y1="9" x2="18" y2="12" /><path d="M6 12a6 6 0 0 0 6 6" /><path d="M18 12a6 6 0 0 1-6 6" /></svg>, label: "Problem Solving" },
    { key: "leaderboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>, label: "Leaderboard" },
    { key: "upload", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>, label: "Upload Project" },
    { key: "profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>, label: "Profile Settings" },
  ];

  // Use admin menu if Admin, otherwise user menu
  const menu = userRole === "Admin" ? adminMenu : userMenu;

  const handleItemClick = (key) => {
    setPage(key);
    if (onClose) onClose(); // Close sidebar on mobile after selection
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar-ultra ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src={require('../assets/logo.png')} alt="CodeGenius" className="sidebar-logo" />
        </div>

        <ul className="sidebar-ultra-menu">
          {menu.map((item) => (
            <li
              key={item.key}
              className={`ultra-item ${activePage === item.key ? "active-ultra" : ""}`}
              onClick={() => handleItemClick(item.key)}
            >
              <div className="ultra-icon">{item.icon}</div>
              <span className="ultra-label">{item.label}</span>

              {activePage === item.key && <div className="active-indicator"></div>}
            </li>
          ))}
        </ul>

        {/* Logout Button - Only for Admin */}
        {userRole === "Admin" && (
          <div className="sidebar-logout">
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              <span className="logout-label">Logout</span>
            </button>
          </div>
        )}

        {/* Report Button - Only for Users (bottom of sidebar) */}
        {userRole !== "Admin" && (
          <div className="sidebar-report" style={{ marginTop: 'auto', padding: '16px' }}>
            <button
              className="report-sidebar-btn"
              onClick={onReportClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <span>📋</span> Report Issue
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;


