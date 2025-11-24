import React, { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CodeAnalyzer from "./pages/CodeAnalyzer";
import CodeConverter from "./pages/CodeConverter";
import ProblemSolving from "./pages/ProblemSolving";
import Leaderboard from "./pages/Leaderboard";
import UploadProject from "./pages/UploadProject";
import ProfileSettings from "./pages/ProfileSettings";
import AdminDashboard from "./pages/AdminDashboard";
import Sidebar from "./components/Sidebar";


function App() {
  const [page, setPage] = useState("home");   // default = home page
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>

      {/* 1️⃣ HOME PAGE should show FIRST */}
      {page === "home" && (
        <Home setPage={setPage} />
      )}

      {/* 2️⃣ LOGIN PAGE shows ONLY after clicking Get Started */}
      {page === "login" && !isLoggedIn && (
        <Login setIsLoggedIn={setIsLoggedIn} setPage={setPage} />
      )}

      {/* 3️⃣ AFTER LOGIN → Show Dashboard + Sidebar */}
      {isLoggedIn && (
        <div className="layout">
          <Sidebar setPage={setPage} />

          {/* your pages */}
          {page === "dashboard" && <Dashboard />}
          {page === "analyzer" && <CodeAnalyzer />}
          {page === "converter" && <CodeConverter />}
          {page === "problemSolving" && <ProblemSolving />}
          {page === "leaderboard" && <Leaderboard />}
          {page === "upload" && <UploadProject />}
          {page === "profile" && <ProfileSettings />}
          {page === "admin" && <AdminDashboard />}
        </div>
      )}

    </>
  );
}

export default App;
