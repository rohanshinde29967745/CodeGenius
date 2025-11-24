function Navbar({ setPage }) {
  return (
    <nav className="navbar">
      <div className="logo" onClick={() => setPage("home")}>
        CodeGenius.AI
      </div>

      <ul className="nav-links">
        <li onClick={() => setPage("home")}>Home</li>
        <li>Features</li>
        <li onClick={() => setPage("dashboard")}>Leaderboard</li>
        <li>Login</li>
      </ul>

      <button
        className="get-started-btn"
        onClick={() => setPage("dashboard")}
      >
        Get Started
      </button>
    </nav>
  );
}

export default Navbar;
