// Sidebar.jsx – Ultra Premium Version
import React from "react";
import "../App.css";

function Sidebar({ setPage, activePage }) {
  const menu = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "analyzer", icon: "🧠", label: "Code Analyzer" },
    { key: "converter", icon: "🔄", label: "Code Converter" },
    { key: "problemSolving", icon: "📝", label: "Problem Solving" },
    { key: "leaderboard", icon: "🏅", label: "Leaderboard" },
    { key: "upload", icon: "📤", label: "Upload Project" },
    { key: "profile", icon: "👤", label: "Profile Settings" },
    { key: "admin", icon: "🛠", label: "Admin Dashboard" }
  ];

  return (
    <aside className="sidebar-ultra">
      <div className="sidebar-brand">
        <div className="brand-glow"></div>
        <span className="brand-logo">⚡</span>
        <h2 className="brand-text">CodeGenius</h2>
      </div>

      <ul className="sidebar-ultra-menu">
        {menu.map((item) => (
          <li
            key={item.key}
            className={`ultra-item ${activePage === item.key ? "active-ultra" : ""}`}
            onClick={() => setPage(item.key)}
          >
            <div className="ultra-icon">{item.icon}</div>
            <span className="ultra-label">{item.label}</span>

            {activePage === item.key && <div className="active-indicator"></div>}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
