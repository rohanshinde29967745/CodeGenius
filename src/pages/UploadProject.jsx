import React, { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  getCurrentUser,
  sendCollaborationRequest,
  getReceivedCollaborations,
  acceptCollaboration,
  ignoreCollaboration
} from "../services/api";
import "../App.css";

function UploadProject() {
  const [showUpload, setShowUpload] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterLanguage, setFilterLanguage] = useState("All Languages");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Project detail modal
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [detailProject, setDetailProject] = useState(null);

  // Form states
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectFile, setProjectFile] = useState(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [github, setGithub] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Collaboration request states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [collabDescription, setCollabDescription] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Received collaboration requests
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(false);

  // Get current user
  const currentUser = getCurrentUser();

  // Fetch projects on mount and when filters change
  useEffect(() => {
    fetchProjects();
  }, [filterLanguage, filterCategory, sortBy]);

  // Fetch received collaboration requests
  useEffect(() => {
    if (currentUser) {
      fetchReceivedRequests();
    }
  }, [currentUser?.id]);

  const fetchReceivedRequests = async () => {
    if (!currentUser) return;
    try {
      const data = await getReceivedCollaborations(currentUser.id);
      setReceivedRequests(data.requests || []);
    } catch (error) {
      console.error("Failed to fetch collaboration requests:", error);
    }
  };

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

      // Build FormData for file upload
      const formData = new FormData();
      formData.append("userId", currentUser.id);
      formData.append("title", projectTitle);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("github", github);
      formData.append("tags", JSON.stringify(tagArray));
      if (projectFile) {
        formData.append("projectFile", projectFile);
      }

      const result = await createProject(formData);

      if (result.project) {
        alert("Project uploaded successfully!");
        // Reset form
        setProjectTitle("");
        setDescription("");
        setProjectFile(null);
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

  // Handle open collaboration request modal
  const handleOpenInvite = (project) => {
    setSelectedProject(project);
    setCollabDescription("");
    setCollabEmail(currentUser?.email || "");
    setInviteMessage("");
    setShowInviteModal(true);
  };

  // Send collaboration request
  const handleSendCollabRequest = async () => {
    if (!collabDescription.trim()) {
      setInviteMessage("Please describe why you want to collaborate");
      return;
    }
    if (!collabEmail.trim()) {
      setInviteMessage("Please enter your email for contact");
      return;
    }

    setSendingRequest(true);
    try {
      const result = await sendCollaborationRequest({
        projectId: selectedProject.id,
        requesterId: currentUser.id,
        ownerId: selectedProject.userId,
        description: collabDescription,
        requesterEmail: collabEmail
      });

      if (result.message) {
        setInviteMessage("✅ Collaboration request sent successfully!");
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteMessage("");
          setCollabDescription("");
        }, 2000);
      } else {
        setInviteMessage(result.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Send request error:", error);
      setInviteMessage("Failed to send request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  // Handle accept collaboration
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    setProcessingRequest(true);
    try {
      await acceptCollaboration(selectedRequest.id, currentUser.id);
      setInviteMessage("✅ Request accepted! You can now contact them via email.");
      fetchReceivedRequests();
      setTimeout(() => {
        setShowRequestDetail(false);
        setInviteMessage("");
      }, 3000);
    } catch (error) {
      console.error("Accept error:", error);
    } finally {
      setProcessingRequest(false);
    }
  };

  // Handle ignore collaboration
  const handleIgnoreRequest = async () => {
    if (!selectedRequest) return;
    setProcessingRequest(true);
    try {
      await ignoreCollaboration(selectedRequest.id, currentUser.id);
      fetchReceivedRequests();
      setShowRequestDetail(false);
    } catch (error) {
      console.error("Ignore error:", error);
    } finally {
      setProcessingRequest(false);
    }
  };

  // Toggle for showing collaboration requests
  const [showCollabRequests, setShowCollabRequests] = useState(false);

  return (
    <div className="dashboard-container">
      <div className="gallery-header-row">
        <div className="gallery-header-left">
          <h1 className="welcome-text">Project Gallery</h1>
          <p className="sub-text">
            Share your projects with the community and discover amazing work from
            other developers.
          </p>
        </div>

        {/* Collaboration Requests Button with Dropdown */}
        {currentUser && (
          <div className="collab-dropdown-container">
            <button
              className={`collab-requests-btn ${showCollabRequests ? 'active' : ''}`}
              onClick={() => setShowCollabRequests(!showCollabRequests)}
            >
              📬 Collaboration Requests
              {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="request-badge">
                  {receivedRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showCollabRequests && (
              <div className="collab-dropdown-menu">
                <div className="collab-dropdown-header">
                  <span>📬 Collaboration Requests</span>
                  <button
                    className="dropdown-close-btn"
                    onClick={() => setShowCollabRequests(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="collab-dropdown-content">
                  {receivedRequests.length > 0 ? (
                    receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`dropdown-request-item ${request.status}`}
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestDetail(true);
                          setShowCollabRequests(false);
                        }}
                      >
                        <div className="dropdown-item-header">
                          <span className="dropdown-requester">👤 {request.requester_name}</span>
                          <span className={`dropdown-status status-${request.status}`}>
                            {request.status === 'pending' && '⏳'}
                            {request.status === 'accepted' && '✅'}
                            {request.status === 'ignored' && '❌'}
                          </span>
                        </div>
                        <p className="dropdown-project">For: {request.project_title}</p>
                        <span className="dropdown-time">{formatTimeAgo(request.created_at)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-empty">
                      <p>📭 No collaboration requests yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOP ACTION BAR - Search, Filters & Upload Button */}
      <div className="upload-action-bar expanded">
        {/* Search Input */}
        <div className="header-search-box">
          <input
            type="text"
            className="header-search-input"
            placeholder="🔍 Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="header-filters">
          <select
            className="header-filter-select"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
          >
            <option>All Languages</option>
            <option>JavaScript</option>
            <option>Python</option>
            <option>Java</option>
            <option>C++</option>
          </select>

          <select
            className="header-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Web Development</option>
            <option>Data Science</option>
            <option>Mobile Apps</option>
            <option>Machine Learning</option>
          </select>

          <select
            className="header-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>Most Recent</option>
            <option>Most Popular</option>
          </select>
        </div>

        {/* Upload Button */}
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
          {/* Project List - Only OTHER users' projects */}
          <div className="project-list">
            {loading ? (
              <div className="project-card">
                <h4>Loading projects...</h4>
              </div>
            ) : (() => {
              // Filter out current user's projects and apply search
              const filteredProjects = projects.filter(proj => {
                // Exclude current user's projects
                if (currentUser && proj.userId === currentUser.id) return false;
                // Apply search filter
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  return (
                    proj.title?.toLowerCase().includes(query) ||
                    proj.description?.toLowerCase().includes(query) ||
                    proj.author?.toLowerCase().includes(query) ||
                    proj.tags?.some(t => t.toLowerCase().includes(query))
                  );
                }
                return true;
              });

              return filteredProjects.length > 0 ? (
                filteredProjects.map((proj, i) => (
                  <div
                    key={proj.id || i}
                    className="project-card clickable-card"
                    onClick={() => {
                      setDetailProject(proj);
                      setShowProjectDetail(true);
                    }}
                  >
                    <div className="project-card-header">
                      <h4>{proj.title}</h4>
                      <span className="view-badge">👁 View</span>
                    </div>
                    <p className="author">👤 {proj.author}</p>
                    <p className="desc">{proj.description?.substring(0, 100)}{proj.description?.length > 100 ? '...' : ''}</p>

                    <div className="tag-row">
                      {proj.tags?.slice(0, 3).map((t, j) => (
                        <span key={j} className="tag">
                          {t}
                        </span>
                      ))}
                      {proj.category && <span className="tag category-tag">{proj.category}</span>}
                    </div>

                    <div className="stats-row">
                      <span>👁 {proj.views || 0}</span>
                      <span>⭐ {proj.likes || 0}</span>
                      <span>⏱ {formatTimeAgo(proj.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="project-card empty-card">
                  <h4>No projects found</h4>
                  <p className="desc">
                    {searchQuery ? 'Try a different search term' : 'No projects from other developers yet'}
                  </p>
                </div>
              );
            })()}
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

            <label>Upload Project (ZIP file)</label>
            <input
              type="file"
              className="input-field"
              accept=".zip"
              onChange={(e) => setProjectFile(e.target.files[0])}
              style={{ padding: '10px' }}
            />
            {projectFile && <p style={{ margin: '5px 0', color: '#0066ff' }}>📎 {projectFile.name}</p>}

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

      {/* REQUEST DETAIL MODAL */}
      {showRequestDetail && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRequestDetail(false)}>
          <div className="request-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowRequestDetail(false)}
            >
              ✕
            </button>

            <div className="request-detail-header">
              <h2>🤝 Collaboration Request</h2>
              <span className={`request-status-badge status-${selectedRequest.status}`}>
                {selectedRequest.status.toUpperCase()}
              </span>
            </div>

            <div className="request-detail-body">
              <div className="request-info-row">
                <span className="info-label">From:</span>
                <span className="info-value">{selectedRequest.requester_name}</span>
              </div>
              <div className="request-info-row">
                <span className="info-label">Project:</span>
                <span className="info-value">{selectedRequest.project_title}</span>
              </div>
              <div className="request-info-row">
                <span className="info-label">Received:</span>
                <span className="info-value">{formatTimeAgo(selectedRequest.created_at)}</span>
              </div>

              <div className="request-description-section">
                <h4>📝 Why they want to collaborate:</h4>
                <p>{selectedRequest.description}</p>
              </div>

              <div className="request-contact-section">
                <h4>📧 Contact Email:</h4>
                <a href={`mailto:${selectedRequest.requester_email}`} className="contact-email">
                  {selectedRequest.requester_email}
                </a>
                <p className="contact-hint">Click to send them an email</p>
              </div>

              {inviteMessage && (
                <div className="invite-message success">
                  {inviteMessage}
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="request-detail-actions">
                <button
                  className="ignore-btn"
                  onClick={handleIgnoreRequest}
                  disabled={processingRequest}
                >
                  ❌ Ignore Request
                </button>
                <button
                  className="accept-btn"
                  onClick={handleAcceptRequest}
                  disabled={processingRequest}
                >
                  {processingRequest ? "Processing..." : "✅ Accept & View Email"}
                </button>
              </div>
            )}

            {selectedRequest.status === 'accepted' && (
              <div className="accepted-info">
                <p>✅ You've accepted this request. Contact the requester via email above to start collaborating!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Collaboration Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invite-modal-header">
              <h3>🤝 Request Collaboration</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="invite-modal-body">
              <p className="invite-project-title">
                Project: <strong>{selectedProject?.title}</strong>
              </p>
              <p className="invite-project-author">
                Owner: <strong>{selectedProject?.author}</strong>
              </p>

              <label>Why do you want to collaborate? *</label>
              <textarea
                className="input-field textarea-field"
                placeholder="Describe your skills, experience, and how you'd like to contribute to this project..."
                value={collabDescription}
                onChange={(e) => setCollabDescription(e.target.value)}
                rows={4}
              />

              <label>Your Email (for contact) *</label>
              <input
                type="email"
                className="input-field"
                placeholder="your.email@gmail.com"
                value={collabEmail}
                onChange={(e) => setCollabEmail(e.target.value)}
              />
              <p className="input-hint">The project owner will use this email to contact you</p>

              {inviteMessage && (
                <div className={`invite-message ${inviteMessage.includes('✅') ? 'success' : 'error'}`}>
                  {inviteMessage}
                </div>
              )}

              <div className="invite-modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="send-invite-btn"
                  onClick={handleSendCollabRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? "Sending..." : "📧 Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT DETAIL MODAL */}
      {showProjectDetail && detailProject && (
        <div className="modal-overlay" onClick={() => setShowProjectDetail(false)}>
          <div className="project-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowProjectDetail(false)}
            >
              ✕
            </button>

            <div className="project-detail-header">
              <h2>{detailProject.title}</h2>
              <div className="project-meta">
                <span className="author-badge">👤 {detailProject.author}</span>
                <span className="date-badge">📅 {formatTimeAgo(detailProject.createdAt)}</span>
              </div>
            </div>

            <div className="project-detail-body">
              <div className="detail-section">
                <h4>📝 Description</h4>
                <p>{detailProject.description || "No description provided"}</p>
              </div>

              {detailProject.category && (
                <div className="detail-section">
                  <h4>📁 Category</h4>
                  <span className="category-badge">{detailProject.category}</span>
                </div>
              )}

              {detailProject.tags && detailProject.tags.length > 0 && (
                <div className="detail-section">
                  <h4>🏷️ Tags</h4>
                  <div className="tags-list">
                    {detailProject.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section stats-section">
                <div className="stat-item">
                  <span className="stat-icon">👁</span>
                  <span className="stat-value">{detailProject.views || 0}</span>
                  <span className="stat-label">Views</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{detailProject.likes || 0}</span>
                  <span className="stat-label">Likes</span>
                </div>
              </div>
            </div>

            <div className="project-detail-actions">
              {detailProject.github && (
                <a
                  href={detailProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-action-btn github-btn"
                >
                  🐙 View on GitHub
                </a>
              )}
              {detailProject.filesUrl && (
                <a
                  href={`http://localhost:4000${detailProject.filesUrl}`}
                  download
                  className="detail-action-btn download-btn"
                >
                  📥 Download ZIP
                </a>
              )}
              <button
                className="detail-action-btn collab-btn"
                onClick={() => {
                  setShowProjectDetail(false);
                  handleOpenInvite(detailProject);
                }}
              >
                🤝 Request Collaboration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadProject;
