import React, { useState } from "react";
import "../App.css";

function Home({ setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <img src={require('../assets/logo.png')} alt="CodeGenius" className="nav-logo" />

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
          <li onClick={() => { setPage("login"); setMenuOpen(false); }}>Home</li>
          <li onClick={() => { setPage("login"); setMenuOpen(false); }}>Features</li>
          <li onClick={() => { setPage("login"); setMenuOpen(false); }}>Leaderboard</li>
          <li onClick={() => { setPage("login"); setMenuOpen(false); }}>Login</li>
        </ul>

        <button className="get-started-btn" onClick={() => setPage("login")}>
          Get Started
        </button>
      </nav>

      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="overlay"></div>

        <div className="hero-content">
          <span className="badge">⚡ AI-Powered Platform</span>

          <h1 className="hero-title">
            AI-Powered Code Explanation & Learning Platform
          </h1>

          <p className="hero-subtitle">
            Paste your code or upload a snippet — our AI explains, analyzes,
            and helps you become a better coder.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setPage("login")}>
              Try Now
            </button>

            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
