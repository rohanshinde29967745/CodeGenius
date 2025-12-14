import React, { useState } from "react";
import "../App.css";

function UploadProject() {
  const [showUpload, setShowUpload] = useState(false);

  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [github, setGithub] = useState("");

  const projects = [
    {
      title: "React Todo App with TypeScript",
      author: "Sarah Chen",
      desc: "A full-featured todo app built with React, TypeScript, and local storage persistence.",
      tags: ["React", "TypeScript", "CSS"],
      views: 156,
      likes: 45,
      days: "2 days ago",
    },
    {
      title: "Python Data Analysis Dashboard",
      author: "Marcus Rodriguez",
      desc: "Interactive dashboard for analyzing sales data using Pandas, Matplotlib, and Streamlit.",
      tags: ["Python", "Pandas", "Matplotlib"],
      views: 89,
      likes: 23,
      days: "1 week ago",
    },
  ];

  const handleSubmit = () => {
    alert("Project uploaded successfully!");
  };

  return (
    <div className="dashboard-container">
      <h1 className="welcome-text">Project Gallery</h1>
      <p className="sub-text">
        Share your projects with the community and discover amazing work from
        other developers.
      </p>

      {/* TOP ACTION BAR */}
      <div className="upload-action-bar">
        <h3>🔍 Browse Projects</h3>
        <button
          className="submit-project-btn"
          onClick={() => setShowUpload(!showUpload)}
        >
          ➕ Upload Project
        </button>
      </div>

      <div className="project-layout">

        {/* LEFT SIDE – BROWSE PROJECTS */}
        <div className="browse-box">
          <div className="filter-row">
            <div className="dropdown-with-label">
              <label className="dropdown-label">Language</label>
              <select className="filter-select">
                <option>All Languages</option>
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
              </select>
            </div>

            <div className="dropdown-with-label">
              <label className="dropdown-label">Category</label>
              <select className="filter-select">
                <option>All Categories</option>
                <option>Web Development</option>
                <option>Data Science</option>
              </select>
            </div>

            <div className="dropdown-with-label">
              <label className="dropdown-label">Sort By</label>
              <select className="filter-select">
                <option>Most Recent</option>
                <option>Most Popular</option>
              </select>
            </div>
          </div>

          <div className="project-list">
            {projects.map((proj, i) => (
              <div key={i} className="project-card">
                <h4>{proj.title}</h4>
                <p className="author">👤 {proj.author}</p>
                <p className="desc">{proj.desc}</p>

                <div className="tag-row">
                  {proj.tags.map((t, j) => (
                    <span key={j} className="tag">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="stats-row">
                  <span>👁 {proj.views}</span>
                  <span>⭐ {proj.likes}</span>
                  <span>⏱ {proj.days}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE – UPLOAD PROJECT (DROPDOWN) */}
        {showUpload && (
          <div className="upload-box">
            <h3>📤 Upload Project</h3>
            <p>Share your project with the community</p>

            <label>Project Title</label>
            <input
              className="input-field"
              placeholder="Enter project title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />

            <label>Description</label>
            <textarea
              className="textarea-field"
              placeholder="Describe your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label>Programming Language</label>
            <select
              className="input-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>Select language</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C++</option>
            </select>

            <label>Category</label>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Select category</option>
              <option>Web Development</option>
              <option>Data Science</option>
              <option>Mobile Apps</option>
              <option>Machine Learning</option>
            </select>

            <label>Tags</label>
            <input
              className="input-field"
              placeholder="React, TypeScript, API..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            <label>GitHub Repository</label>
            <input
              className="input-field"
              placeholder="https://github.com/..."
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />

            <label>Upload Files</label>
            <input type="file" className="file-input" />

            <button className="submit-project-btn" onClick={handleSubmit}>
              🚀 Publish Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadProject;
