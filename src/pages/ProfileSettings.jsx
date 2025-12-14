import React, { useState } from "react";
import "../App.css";

function ProfileSettings({ isDark, toggleTheme, setIsLoggedIn, setPage }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Personal Info State
  const [profileData, setProfileData] = useState({
    fullName: "Alex Chen",
    email: "alex.chen@example.com",
    bio: "Passionate full-stack developer with expertise in React, Node.js, and Python.",
    location: "San Francisco, CA",
    github: "github.com/alexchen",
    linkedin: "linkedin.com/in/alexchen"
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage("home");
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // In real app, save to backend
  };

  // Project data organized by category
  const projectCategories = {
    "Web Development": {
      icon: "🌐",
      projects: [
        { name: "E-Commerce Platform", tech: "React, Node.js, MongoDB", date: "Dec 2024", description: "A full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration." },
        { name: "Portfolio Website", tech: "React, Tailwind CSS", date: "Nov 2024", description: "Personal portfolio showcasing projects and skills with modern design and animations." },
        { name: "Task Management App", tech: "Vue.js, Firebase", date: "Oct 2024", description: "Collaborative task management tool with real-time updates and team features." },
        { name: "Blog Platform", tech: "Next.js, Prisma", date: "Sep 2024", description: "Full-featured blog with markdown support, comments, and SEO optimization." }
      ]
    },
    "Data Science": {
      icon: "📊",
      projects: [
        { name: "Sales Prediction Model", tech: "Python, Scikit-learn, Pandas", date: "Nov 2024", description: "Machine learning model predicting sales trends with 92% accuracy using historical data." },
        { name: "Customer Segmentation", tech: "Python, K-Means, Matplotlib", date: "Oct 2024", description: "Clustering analysis for customer behavior patterns and targeted marketing." }
      ]
    },
    "Machine Learning": {
      icon: "🤖",
      projects: [
        { name: "Image Classifier", tech: "TensorFlow, CNN, Python", date: "Dec 2024", description: "Deep learning model for image classification with 95% accuracy on custom dataset." }
      ]
    },
    "Mobile Apps": {
      icon: "📱",
      projects: [
        { name: "Fitness Tracker", tech: "React Native, Firebase", date: "Nov 2024", description: "Cross-platform mobile app for tracking workouts, nutrition, and health goals." }
      ]
    },
    "Collaboration Projects": {
      icon: "🤝",
      projects: [
        { name: "Open Source CMS", tech: "Python, Django", date: "Dec 2024", description: "Contributed to open-source content management system with 500+ stars." },
        { name: "Community Forum", tech: "React, GraphQL", date: "Nov 2024", description: "Team project building a developer community discussion platform." },
        { name: "Code Review Tool", tech: "TypeScript, Node.js", date: "Oct 2024", description: "Collaborative code review platform with inline comments and suggestions." },
        { name: "Documentation Site", tech: "Docusaurus, MDX", date: "Sep 2024", description: "Technical documentation website for an open-source library." },
        { name: "API Gateway", tech: "Go, Docker", date: "Aug 2024", description: "High-performance API gateway for microservices architecture." }
      ]
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setSelectedProject(null);
  };

  return (
    <div className="dashboard-container">
      <h1 className="welcome-text">Profile Settings</h1>
      <p className="sub-text">
        Manage your account information and track your coding progress.
      </p>

      {/* TABS */}
      <div className="profile-tabs">
        {["profile", "statistics", "submissions", "achievements"].map((tab) => (
          <button
            key={tab}
            className={`p-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ================= PROFILE TAB ================= */}
      {activeTab === "profile" && (
        <div className="profile-layout">
          {/* LEFT */}
          <div className="profile-left">
            <div className="profile-pic-box">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="profile"
                className="profile-pic"
              />
              <h2>Alex Chen</h2>
              <p className="email-text">alex.chen@example.com</p>
              <span className="level-badge">Gold Level</span>

              <div className="stats-box">
                <div>
                  <h2>47</h2>
                  <p>Problems Solved</p>
                </div>
                <div>
                  <h2>89%</h2>
                  <p>Accuracy</p>
                </div>
              </div>

              <p className="progress-title">Progress to Platinum</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "75%" }} />
              </div>
              <small>750 / 1000 XP</small>
            </div>
          </div>

          {/* RIGHT */}
          <div className="profile-right">
            <div className="info-card">
              <div className="info-header">
                <h3>Personal Information</h3>
                {isEditing ? (
                  <button className="save-btn" onClick={handleSaveProfile}>💾 Save</button>
                ) : (
                  <button className="edit-btn-pro" onClick={() => setIsEditing(true)}>✏️ Edit</button>
                )}
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.fullName}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      className="edit-input"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.email}</p>
                  )}
                </div>

                <div className="info-item full">
                  <label>Bio</label>
                  {isEditing ? (
                    <textarea
                      className="edit-textarea"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.bio}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.location}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>GitHub</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.github}
                      onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.github}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    />
                  ) : (
                    <p>{profileData.linkedin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div className="info-card" style={{ marginTop: 20 }}>
              <h3>Settings</h3>

              <div className="setting-item">
                <div>
                  <label>Dark Mode</label>
                  <p>Switch between light and dark theme</p>
                </div>
                <button
                  className={`toggle-switch ${isDark ? "active" : ""}`}
                  onClick={toggleTheme}
                >
                  <span className="toggle-slider" />
                </button>
              </div>

              <div className="setting-item">
                <div>
                  <label>Sign Out</label>
                  <p>Log out of your account</p>
                </div>
                <button className="logout-btn-compact" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STATISTICS TAB ================= */}
      {activeTab === "statistics" && (
        <div className="stats-page">
          <h3>📈 Coding Statistics</h3>

          <div className="stat-cards">
            <div className="stat-box blue">2,850<br /><span>Total Points</span></div>
            <div className="stat-box green">6<br /><span>Day Streak</span></div>
            <div className="stat-box purple">42<br /><span>Contests</span></div>
            <div className="stat-box orange">8<br /><span>Projects</span></div>
          </div>

          <h4>Skills & Proficiency</h4>

          {[
            ["Python", 90, "25 problems"],
            ["JavaScript", 85, "18 problems"],
            ["Java", 75, "12 problems"],
            ["React", 88, "8 problems"],
            ["Data Structures", 80, "35 problems"],
            ["Algorithms", 72, "28 problems"],
          ].map(([skill, percent, count]) => (
            <div className="skill-row" key={skill}>
              <div className="skill-header">
                <strong>{skill}</strong>
                <span>{count}</span>
              </div>
              <div className="skill-bar">
                <div
                  className="skill-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <small>{percent}% proficiency</small>
            </div>
          ))}
        </div>
      )}

      {/* ================= SUBMISSIONS TAB ================= */}
      {activeTab === "submissions" && (
        <div className="submissions-container">
          <div className="submissions-header">
            <h3>📤 Project Submissions</h3>
            <p>Click on a category to view your submitted projects</p>
          </div>

          {/* Horizontal Category Buttons */}
          <div className="category-buttons-row">
            {Object.entries(projectCategories).map(([category, data]) => (
              <button
                key={category}
                className={`category-btn ${expandedCategory === category ? "active" : ""}`}
                onClick={() => toggleCategory(category)}
              >
                <span className="cat-btn-icon">{data.icon}</span>
                <span className="cat-btn-name">{category}</span>
                <span className="cat-btn-count">{data.projects.length}</span>
              </button>
            ))}
          </div>

          {/* Project List - appears below buttons */}
          {expandedCategory && (
            <div className="projects-panel">
              <div className="projects-panel-header">
                <h4>{projectCategories[expandedCategory].icon} {expandedCategory}</h4>
                <span className="projects-count">{projectCategories[expandedCategory].projects.length} Project{projectCategories[expandedCategory].projects.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="project-list">
                {projectCategories[expandedCategory].projects.map((project, idx) => (
                  <React.Fragment key={idx}>
                    <div className="project-item">
                      <div className="project-info">
                        <h4 className="project-name">{project.name}</h4>
                        <span className="project-tech">{project.tech}</span>
                      </div>
                      <button
                        className="details-btn"
                        onClick={() => setSelectedProject(selectedProject?.name === project.name ? null : project)}
                      >
                        {selectedProject?.name === project.name ? "Hide" : "Details"}
                      </button>
                    </div>

                    {/* Project Details - appears directly below selected project */}
                    {selectedProject?.name === project.name && (
                      <div className="project-details inline-details">
                        <div className="details-header">
                          <h4>{selectedProject.name}</h4>
                          <span className="details-date">{selectedProject.date}</span>
                        </div>
                        <div className="details-tech">
                          <strong>Technologies:</strong> {selectedProject.tech}
                        </div>
                        <p className="details-description">{selectedProject.description}</p>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= ACHIEVEMENTS TAB ================= */}
      {activeTab === "achievements" && (
        <div className="achievements-container">
          <div className="achievements-header">
            <h3>🏅 Your Achievements</h3>
            <p>Unlock badges by solving problems and improving your coding skills</p>
          </div>

          <div className="badge-grid">
            {/* Bronze */}
            <div className="achievement-card earned">
              <div className="achievement-icon bronze-bg">🏆</div>
              <h4>Bronze</h4>
              <p>Solve 10 problems</p>
              <span className="earned-badge">✓ Earned</span>
            </div>

            {/* Silver */}
            <div className="achievement-card earned">
              <div className="achievement-icon silver-bg">🛡️</div>
              <h4>Silver</h4>
              <p>Solve 25 problems</p>
              <span className="earned-badge">✓ Earned</span>
            </div>

            {/* Gold */}
            <div className="achievement-card earned">
              <div className="achievement-icon gold-bg">👑</div>
              <h4>Gold</h4>
              <p>Solve 50 problems</p>
              <span className="earned-badge">✓ Earned</span>
            </div>

            {/* Problem Solver */}
            <div className="achievement-card earned">
              <div className="achievement-icon green-bg">◎</div>
              <h4>Problem Solver</h4>
              <p>90%+ accuracy rate</p>
              <span className="earned-badge">✓ Earned</span>
            </div>

            {/* Code Optimizer */}
            <div className="achievement-card earned">
              <div className="achievement-icon blue-bg">{"<>"}</div>
              <h4>Code Optimizer</h4>
              <p>Submit optimal solutions</p>
              <span className="earned-badge">✓ Earned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
