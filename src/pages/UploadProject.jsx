import React, { useState, useEffect } from "react";
import { getProjects, createProject, getCurrentUser } from "../services/api";
import "../App.css";

function UploadProject() {
  const [showUpload, setShowUpload] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterLanguage, setFilterLanguage] = useState("All Languages");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Most Recent");

  // Form states
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [github, setGithub] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects on mount and when filters change
  useEffect(() => {
    fetchProjects();
  }, [filterLanguage, filterCategory, sortBy]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects({
        language: filterLanguage,
        category: filterCategory,
        sort: sortBy,
      });
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("Please log in to upload a project");
      return;
    }

    if (!projectTitle.trim()) {
      alert("Please enter a project title");
      return;
    }

    setSubmitting(true);
    try {
      const tagArray = tags.split(",").map((t) => t.trim()).filter((t) => t);

      const result = await createProject({
        userId: currentUser.id,
        title: projectTitle,
        description,
        language,
        category,
        github,
        tags: tagArray,
      });

      if (result.project) {
        alert("Project uploaded successfully!");
        // Reset form
        setProjectTitle("");
        setDescription("");
        setLanguage("");
        setCategory("");
        setTags("");
        setGithub("");
        setShowUpload(false);
        // Refresh projects list
        fetchProjects();
      } else {
        alert(result.error || "Failed to upload project");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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
              <select
                className="filter-select"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
              >
                <option>All Languages</option>
                <option>JavaScript</option>
                <option>Python</option>
                <option>Java</option>
                <option>C++</option>
              </select>
            </div>

            <div className="dropdown-with-label">
              <label className="dropdown-label">Category</label>
              <select
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option>All Categories</option>
                <option>Web Development</option>
                <option>Data Science</option>
                <option>Mobile Apps</option>
                <option>Machine Learning</option>
              </select>
            </div>

            <div className="dropdown-with-label">
              <label className="dropdown-label">Sort By</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Most Recent</option>
                <option>Most Popular</option>
              </select>
            </div>
          </div>

          <div className="project-list">
            {loading ? (
              <div className="project-card">
                <h4>Loading projects...</h4>
              </div>
            ) : projects.length > 0 ? (
              projects.map((proj, i) => (
                <div key={proj.id || i} className="project-card">
                  <h4>{proj.title}</h4>
                  <p className="author">👤 {proj.author}</p>
                  <p className="desc">{proj.description}</p>

                  <div className="tag-row">
                    {proj.tags?.map((t, j) => (
                      <span key={j} className="tag">
                        {t}
                      </span>
                    ))}
                    {proj.language && <span className="tag">{proj.language}</span>}
                  </div>

                  <div className="stats-row">
                    <span>👁 {proj.views || 0}</span>
                    <span>⭐ {proj.likes || 0}</span>
                    <span>⏱ {formatTimeAgo(proj.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="project-card">
                <h4>No projects found</h4>
                <p className="desc">Be the first to upload a project!</p>
              </div>
            )}
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
              <option value="">Select language</option>
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
              <option value="">Select category</option>
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

            <button
              className="submit-project-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Uploading..." : "🚀 Publish Project"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadProject;
