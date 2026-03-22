import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
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
import NotificationsPage from "./pages/NotificationsPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import Saved from "./pages/Saved";
import InsightsPage from "./pages/InsightsPage";
import OAuthCallback from "./pages/OAuthCallback";
import ContestList from "./pages/ContestList";
import ContestDetail from "./pages/ContestDetail";
import CreateContest from "./pages/CreateContest";
import ContestArena from "./pages/ContestArena";
import TopNav from "./components/TopNav";
import LeftSidebar from "./components/LeftSidebar";
import MenuDropdown from "./components/MenuDropdown";
import ReportModal from "./components/ReportModal";
import "./login.css";

function App() {
  const [page, setPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [dashboardKey, setDashboardKey] = useState(0);

  // Wrapper for setPage that refreshes dashboard when navigating to it
  const handleSetPage = (newPage) => {
    if (newPage === "dashboard") {
      setDashboardKey(prev => prev + 1); // Force Dashboard refresh
    }
    setPage(newPage);
  };

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("codegenius-theme");
    return saved ? saved === "dark" : true;
  });

  // Restore login session
  useEffect(() => {
    if (window.location.pathname === "/oauth/callback") {
      setPage("oauth-callback");
      return;
    }

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setIsLoggedIn(true);
        setUserRole(parsedUser.role || "User");
        setUserData(parsedUser);
        if (parsedUser.role === "Admin") {
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

  // Apply theme
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    localStorage.setItem("codegenius-theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserRole("User");
    setUserData(null);
    setPage("home");
  };

  return (
    <>
      {/* HOME PAGE */}
      {page === "home" && (
        <Home setPage={setPage} />
      )}

      {/* LOGIN PAGE */}
      {page === "login" && !isLoggedIn && (
        <Login setPage={setPage} setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
      )}

      {/* REGISTER PAGE */}
      {page === "register" && !isLoggedIn && (
        <Register setPage={setPage} />
      )}

      {/* FORGOT PASSWORD PAGE */}
      {page === "forgot-password" && !isLoggedIn && (
        <ForgotPassword setPage={setPage} />
      )}

      {/* OAUTH CALLBACK PAGE */}
      {page === "oauth-callback" && (
        <OAuthCallback setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setPage={setPage} />
      )}

      {/* LOGGED IN - Dashboard Layout */}
      {isLoggedIn && (
        <div className="layout-topnav">
          {/* Top Navigation Bar - All Navigation */}
          <TopNav
            setPage={handleSetPage}
            activePage={page}
            userRole={userRole}
            isDark={isDarkTheme}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
            onMenuClick={() => setShowMenuDropdown(!showMenuDropdown)}
          />

          {/* Left Sidebar - Only for regular users */}
          {userRole !== "Admin" && (
            <LeftSidebar
              setPage={handleSetPage}
              activePage={page}
              isDark={isDarkTheme}
              toggleTheme={toggleTheme}
              onLogout={handleLogout}
              user={userData}
              onReportClick={() => setShowReportModal(true)}
            />
          )}

          {/* Menu Dropdown - Only for regular users */}
          {userRole !== "Admin" && (
            <MenuDropdown
              isOpen={showMenuDropdown}
              onClose={() => setShowMenuDropdown(false)}
              setPage={handleSetPage}
              isDark={isDarkTheme}
              toggleTheme={toggleTheme}
              onLogout={handleLogout}
              user={userData}
            />
          )}

          {/* Main content area */}
          <main className={`main-content${userRole === "Admin" ? " admin-main-content" : ""}`}>
            {page === "dashboard" && <Dashboard key={dashboardKey} setPage={handleSetPage} />}
            {page === "analyzer" && <CodeAnalyzer />}
            {page === "converter" && <CodeConverter />}
            {page === "problemSolving" && <ProblemSolving />}
            {page === "leaderboard" && <Leaderboard />}
            {page === "upload" && <UploadProject />}
            {page === "profile" && <ProfileSettings isDark={isDarkTheme} toggleTheme={toggleTheme} setIsLoggedIn={setIsLoggedIn} setPage={handleSetPage} onLogout={handleLogout} />}
            {page === "admin" && userRole === "Admin" && <AdminDashboard onLogout={handleLogout} isDark={isDarkTheme} toggleTheme={toggleTheme} setPage={handleSetPage} />}
            {page === "reports" && userRole === "Admin" && <AdminReports />}
            {page === "notifications" && <NotificationsPage setPage={handleSetPage} />}
            {page === "connections" && <ConnectionsPage setPage={handleSetPage} />}
            {page === "saved" && <Saved />}
            {page === "insights" && <InsightsPage setPage={handleSetPage} />}

            {/* Contest System Pages */}
            {page === "contests" && <ContestList setPage={handleSetPage} />}
            {page === "createContest" && <CreateContest setPage={handleSetPage} />}
            {page?.name === "contestDetail" && <ContestDetail contestId={page.contestId} setPage={handleSetPage} />}
            {page?.name === "contestArena" && <ContestArena contestId={page.contestId} setPage={handleSetPage} />}
            {page?.name === "contestPractice" && <ContestArena contestId={page.contestId} setPage={handleSetPage} mode="practice" />}
          </main>

          {/* Report Modal - Only for regular users */}
          {userRole !== "Admin" && (
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;
