import React from "react";
import "../index.css";

function Navbar({ setPage }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 2rem',
      backgroundColor: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div 
        style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-primary)'
        }}
        onClick={() => setPage("home")}
      >
        <span style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>CodeGenius</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>.AI</span>
      </div>

      <ul style={{
        display: 'flex',
        listStyle: 'none',
        gap: '2rem',
        margin: 0,
        padding: 0,
        fontSize: '0.9rem',
        fontWeight: '500'
      }}>
        <li style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPage("home")}>Home</li>
        <li style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPage("dashboard")}>Dashboard</li>
        <li style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPage("leaderboard")}>Leaderboard</li>
      </ul>

      <button
        style={{
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onClick={() => setPage("dashboard")}
      >
        Get Started
      </button>
    </nav>
  );
}

export default Navbar;
