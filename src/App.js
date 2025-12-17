import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CodeAnalyzer from "./pages/CodeAnalyzer";
import CodeConverter from "./pages/CodeConverter";
import ProblemSolving from "./pages/ProblemSolving";
import Leaderboard from "./pages/Leaderboard";
import UploadProject from "./pages/UploadProject";
import ProfileSettings from "./pages/ProfileSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import OAuthCallback from "./pages/OAuthCallback";
import Sidebar from "./components/Sidebar";
import ReportModal from "./components/ReportModal";
import "./login.css";

function App() {
  const [page, setPage] = useState("home");   // default = home page
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("User"); // default role is User
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Theme state - check localStorage for saved preference, default to dark
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("codegenius-theme");
    return saved ? saved === "dark" : true; // Default to dark theme
  });

  // Restore login session from localStorage on page load
  useEffect(() => {
    // Check if this is an OAuth callback
    if (window.location.pathname === "/oauth/callback") {
      setPage("oauth-callback");
      return;
    }

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUserRole(userData.role || "User");
        // Set starting page based on role
        if (userData.role === "Admin") {
          setPage("admin");
        } else {
          setPage("dashboard");
        }
      } catch (e) {
        console.error("Failed to parse user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Apply theme class to body whenever theme changes
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    // Save to localStorage
    localStorage.setItem("codegenius-theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  // Handle logout - reset user role
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("User");
    setPage("home");
  };

  return (
    <>
      {/* 1️⃣ HOME PAGE should show FIRST */}
      {page === "home" && (
        <Home setPage={setPage} />
      )}

      {/* 2️⃣ LOGIN PAGE shows ONLY after clicking Get Started */}
      {page === "login" && !isLoggedIn && (
        <Login setPage={setPage} setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
      )}

      {/* 2.5️⃣ REGISTER PAGE */}
      {page === "register" && !isLoggedIn && (
        <Register setPage={setPage} />
      )}

      {/* 2.6️⃣ OAUTH CALLBACK PAGE */}
      {page === "oauth-callback" && (
        <OAuthCallback setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setPage={setPage} />
      )}

      {/* 3️⃣ AFTER LOGIN → Show Dashboard + Sidebar */}
      {isLoggedIn && (
        <div className="layout">
          {/* Mobile Header */}
          <header className="mobile-header">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <img src={require('./assets/logo.png')} alt="CodeGenius" className="mobile-logo-img" />
          </header>

          <Sidebar
            setPage={setPage}
            activePage={page}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole={userRole}
            onLogout={handleLogout}
            onReportClick={() => setShowReportModal(true)}
          />

          {/* Main content area */}
          <main className="main-content">
            {/* Curved Header Bar */}
            <div className="page-header-bar">
              <h1 className="page-header-title">CodeGenius</h1>
            </div>

            {page === "dashboard" && <Dashboard setPage={setPage} />}
            {page === "analyzer" && <CodeAnalyzer />}
            {page === "converter" && <CodeConverter />}
            {page === "problemSolving" && <ProblemSolving />}
            {page === "leaderboard" && <Leaderboard />}
            {page === "upload" && <UploadProject />}
            {page === "profile" && <ProfileSettings isDark={isDarkTheme} toggleTheme={toggleTheme} setIsLoggedIn={setIsLoggedIn} setPage={setPage} onLogout={handleLogout} />}
            {page === "admin" && userRole === "Admin" && <AdminDashboard onLogout={handleLogout} isDark={isDarkTheme} toggleTheme={toggleTheme} />}
            {page === "reports" && userRole === "Admin" && <AdminReports />}
          </main>

          {/* Report Modal */}
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
          />
        </div>
      )}

    </>
  );
}

export default App;


