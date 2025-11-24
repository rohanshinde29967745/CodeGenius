import React from "react";
import "../App.css";

function Home({ setPage }) {
  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">CodeGenius.AI</div>

        <ul className="nav-links">
          <li onClick={() => setPage("home")}>Home</li>
          <li>Features</li>
          <li onClick={() => setPage("leaderboard")}>Leaderboard</li>
          <li onClick={() => setPage("login")}>Login</li>
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
