import React from "react";
import "../App.css";

function Sidebar({ setPage, activePage }) {
  return (
    <aside className="sidebar">

      <ul className="side-menu">

        <li
          className={activePage === "dashboard" ? "side-item active" : "side-item"}
          onClick={() => setPage("dashboard")}
        >
          📊 Dashboard
        </li>

        <li
          className={activePage === "analyzer" ? "side-item active" : "side-item"}
          onClick={() => setPage("analyzer")}
        >
          🧠 Code Analyzer
        </li>

        <li
          className={activePage === "converter" ? "side-item active" : "side-item"}
          onClick={() => setPage("converter")}
        >
          🔄 Code Converter
        </li>
        <li
           className={activePage === "problemSolving" ? "side-item active" : "side-item"}
            onClick={() => setPage("problemSolving")}
>
          📝 Problem Solving
        </li>
        <li
          className={activePage === "leaderboard" ? "side-item active" : "side-item"}
          onClick={() => setPage("leaderboard")}
>
          🏅 Leaderboard
        </li>
        <li
          className={activePage === "upload" ? "side-item active" : "side-item"}
          onClick={() => setPage("upload")}
        >
         📤 Upload Project
        </li>
        <li
          className={activePage === "profile" ? "side-item active" : "side-item"}
          onClick={() => setPage("profile")}
>
         👤 Profile Settings
        </li>

        <li
          className={activePage === "admin" ? "side-item active" : "side-item"}
          onClick={() => setPage("admin")}
>
          🛠 Admin Dashboard
        </li>


      </ul>

    </aside>
  );
}

export default Sidebar;
