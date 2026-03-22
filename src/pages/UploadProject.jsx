import React, { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  getCurrentUser,
  sendCollaborationRequest,
  getReceivedCollaborations,
  acceptCollaboration,
  ignoreCollaboration,
  API_SERVER
} from "../services/api";
import "../App.css";

function UploadProject() {
  // View state: 'gallery', 'upload', 'requests'
  const [currentView, setCurrentView] = useState('gallery');

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
  const [screenshots, setScreenshots] = useState([]);
  const [demoVideo, setDemoVideo] = useState(null);
  const [videoError, setVideoError] = useState("");
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
      const formData = new FormData();
      formData.append("title", projectTitle);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("tags", tags);
      formData.append("github", github);
      formData.append("userId", currentUser.id);
      formData.append("author", currentUser.name || currentUser.email);

      if (projectFile) {
        formData.append("projectFile", projectFile);
      }

      screenshots.forEach((file, index) => {
        formData.append("screenshots", file);
      });

      if (demoVideo) {
        formData.append("demoVideo", demoVideo);
      }

      await createProject(formData);
      alert("Project uploaded successfully!");

      // Reset form
      setProjectTitle("");
      setDescription("");
      setProjectFile(null);
      setScreenshots([]);
      setDemoVideo(null);
      setVideoError("");
      setCategory("");
      setTags("");
      setGithub("");

      // Go back to gallery
      setCurrentView('gallery');
      fetchProjects();
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
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Handle open collaboration request modal
  const handleOpenInvite = (project) => {
    setSelectedProject(project);
    setCollabDescription("");
    setCollabEmail("");
    setInviteMessage("");
    setShowInviteModal(true);
  };

  // Send collaboration request
  const handleSendCollabRequest = async () => {
    if (!collabDescription.trim() || !collabEmail.trim()) {
      setInviteMessage("⚠️ Please fill in all fields");
      return;
    }

    setSendingRequest(true);
    try {
      await sendCollaborationRequest({
        project_id: selectedProject.id,
        requester_id: currentUser.id,
        owner_id: selectedProject.userId,
        description: collabDescription,
        requester_email: collabEmail
      });

      setInviteMessage("✅ Collaboration request sent!");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMessage("");
      }, 2000);
    } catch (error) {
      console.error("Send request error:", error);
      setInviteMessage("❌ Failed to send request. Please try again.");
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

  // ========== UPLOAD PROJECT PAGE ==========
  if (currentView === 'upload') {
    return (
      <div className="dashboard-container">
        <div className="upload-page-content">
          <div className="upload-form-container">
            {/* Header Row with Title Left and Back Button Right - INSIDE WHITE CONTAINER */}
            <div className="page-header-with-back">
              <div className="page-header-left">
                <h1 className="welcome-text page-title-left">Upload Project</h1>
                <p className="sub-text page-subtitle">Share your project with the community</p>
              </div>
              <button className="back-btn" onClick={() => setCurrentView('gallery')} title="Back to Gallery">
                <span className="back-arrow">←</span>
              </button>
            </div>

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
              rows={5}
            />

            <label>Upload Project (ZIP file)</label>
            <input
              type="file"
              className="input-field file-input"
              accept=".zip,.rar,.7z,.tar,.gz"
              onChange={(e) => setProjectFile(e.target.files[0])}
            />
            {projectFile && (
              <p className="file-selected">📎 {projectFile.name}</p>
            )}

            {/* Two-column row for Screenshots and Video */}
            <div className="upload-form-row media-row">
              <div className="form-group">
                <label>📸 Screenshots (max 8 images)</label>
                <input
                  type="file"
                  className="input-field file-input"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files).slice(0, 8);
                    setScreenshots(files);
                  }}
                />
                {screenshots.length > 0 && (
                  <div className="screenshots-preview">
                    {screenshots.map((file, index) => (
                      <div key={index} className="screenshot-item">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot ${index + 1}`}
                        />
                        <span>{file.name.substring(0, 12)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>🎬 Demo Video (max 2 min)</label>
                <input
                  type="file"
                  className="input-field file-input"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setVideoError("");
                      const video = document.createElement('video');
                      video.preload = 'metadata';
                      video.onloadedmetadata = () => {
                        window.URL.revokeObjectURL(video.src);
                        const duration = video.duration;
                        if (duration > 120) {
                          setVideoError(`Video is ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')} - must be under 2 minutes`);
                          setDemoVideo(null);
                          e.target.value = '';
                        } else {
                          setDemoVideo(file);
                        }
                      };
                      video.onerror = () => {
                        setVideoError("Could not read video file");
                        setDemoVideo(null);
                      };
                      video.src = URL.createObjectURL(file);
                    }
                  }}
                />
                {videoError && (
                  <p className="error-text">⚠️ {videoError}</p>
                )}
                {demoVideo && (
                  <p className="success-text">🎬 {demoVideo.name} ({(demoVideo.size / (1024 * 1024)).toFixed(2)} MB)</p>
                )}
              </div>
            </div>

            {/* Two-column row for Category and Tags */}
            <div className="upload-form-row">
              <div className="form-group">
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
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  className="input-field"
                  placeholder="React, TypeScript, API..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <label>GitHub Repository (optional)</label>
            <input
              className="input-field"
              placeholder="https://github.com/your-username/your-project"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />

            <button
              className="submit-project-btn publish-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Uploading..." : "🚀 Publish Project"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== COLLABORATION REQUESTS PAGE ==========
  if (currentView === 'requests') {
    return (
      <div className="dashboard-container">
        <div className="requests-page-content">
          <div className="requests-container">
            {/* Header Row with Title Left and Back Button Right - INSIDE WHITE CONTAINER */}
            <div className="page-header-with-back">
              <div className="page-header-left">
                <h1 className="welcome-text page-title-left">Collaboration Requests</h1>
                <p className="sub-text page-subtitle">Manage your collaboration requests</p>
              </div>
              <button className="back-btn" onClick={() => setCurrentView('gallery')} title="Back to Gallery">
                <span className="back-arrow">←</span>
              </button>
            </div>

            {receivedRequests.length > 0 ? (
              <div className="requests-list">
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`request-card-large ${request.status}`}
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRequestDetail(true);
                    }}
                  >
                    <div className="request-card-top">
                      <div className="request-info">
                        <h3 className="requester-name">👤 {request.requester_name}</h3>
                        <p className="request-project-title">For: {request.project_title}</p>
                      </div>
                      <span className={`request-status-pill status-${request.status}`}>
                        {request.status === 'pending' && '⏳ Pending'}
                        {request.status === 'accepted' && '✅ Accepted'}
                        {request.status === 'ignored' && '❌ Ignored'}
                      </span>
                    </div>
                    <p className="request-description">{request.description}</p>
                    <div className="request-footer">
                      <span className="request-time">📅 {formatTimeAgo(request.created_at)}</span>
                      <span className="request-email">📧 {request.requester_email}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-requests">
                <div className="empty-icon">📭</div>
                <h3>No collaboration requests yet</h3>
                <p>When someone wants to collaborate on your projects, you'll see their requests here.</p>
              </div>
            )}
          </div>
        </div>

        {/* REQUEST DETAIL MODAL */}
        {showRequestDetail && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowRequestDetail(false)}>
            <div className="request-detail-modal simple" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close-btn"
                onClick={() => setShowRequestDetail(false)}
              >
                ✕
              </button>

              <div className="request-simple-header">
                <h2>🤝 Collaboration Request</h2>
                <span className={`request-status-badge status-${selectedRequest.status}`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>

              <div className="request-simple-info">
                <p><strong>From:</strong> {selectedRequest.requester_name}</p>
                <p><strong>Project:</strong> {selectedRequest.project_title}</p>
                <p><strong>Received:</strong> {formatTimeAgo(selectedRequest.created_at)}</p>
              </div>

              <div className="request-simple-message">
                <p className="message-label">💬 Message:</p>
                <p className="message-text">{selectedRequest.description}</p>
              </div>

              {selectedRequest.status !== 'ignored' && (
                <div className="request-simple-contact">
                  <a href={`mailto:${selectedRequest.requester_email}`} className="contact-email-link">
                    📧 {selectedRequest.requester_email}
                  </a>
                </div>
              )}

              {selectedRequest.status === 'accepted' && (
                <div className="request-accepted-msg">
                  ✅ Request accepted! Contact them via email above.
                </div>
              )}

              {inviteMessage && (
                <div className="invite-message success">
                  {inviteMessage}
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="request-simple-actions">
                  <button
                    className="ignore-btn"
                    onClick={handleIgnoreRequest}
                    disabled={processingRequest}
                  >
                    Ignore
                  </button>
                  <button
                    className="accept-btn"
                    onClick={handleAcceptRequest}
                    disabled={processingRequest}
                  >
                    {processingRequest ? "Processing..." : "Accept"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== GALLERY VIEW (Default) ==========
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

        {/* Collaboration Requests Button */}
        {currentUser && (
          <div className="collab-btn-container">
            <button
              className="collab-requests-btn"
              onClick={() => setCurrentView('requests')}
            >
              📬 Collaboration Requests
              {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="request-badge">
                  {receivedRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
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
          onClick={() => setCurrentView('upload')}
        >
          ➕ Upload Project
        </button>
      </div>

      {/* PROJECTS GRID */}
      <div className="project-layout full-width-layout">
        <div className="browse-box full-width">
          <div className="project-list">
            {loading ? (
              <div className="project-card">
                <h4>Loading projects...</h4>
              </div>
            ) : (() => {
              const filteredProjects = projects.filter(proj => {
                if (currentUser && proj.userId === currentUser.id) return false;
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
                        <span key={j} className="tag">{t}</span>
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
      </div>

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

            <p className="invite-project-info">
              For: <strong>{selectedProject?.title}</strong>
            </p>

            <label>Why do you want to collaborate?</label>
            <textarea
              className="textarea-field"
              placeholder="Describe how you can contribute to this project..."
              value={collabDescription}
              onChange={(e) => setCollabDescription(e.target.value)}
            />

            <label>Your Contact Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="your.email@example.com"
              value={collabEmail}
              onChange={(e) => setCollabEmail(e.target.value)}
            />

            {inviteMessage && (
              <div className={`invite-message ${inviteMessage.includes('✅') ? 'success' : 'error'}`}>
                {inviteMessage}
              </div>
            )}

            <button
              className="submit-project-btn"
              onClick={handleSendCollabRequest}
              disabled={sendingRequest}
            >
              {sendingRequest ? "Sending..." : "📤 Send Request"}
            </button>
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
              <p className="project-author">By {detailProject.author}</p>
            </div>

            <div className="project-detail-content">
              <div className="detail-section">
                <h4>📋 Description</h4>
                <p>{detailProject.description}</p>
              </div>

              {detailProject.screenshots && detailProject.screenshots.length > 0 && (
                <div className="detail-section">
                  <h4>📸 Screenshots</h4>
                  <div className="screenshot-gallery">
                    {detailProject.screenshots.map((url, i) => (
                      <img
                        key={i}
                        src={`http://localhost:4000${url}`}
                        alt={`Screenshot ${i + 1}`}
                        className="detail-screenshot"
                      />
                    ))}
                  </div>
                </div>
              )}

              {detailProject.videoUrl && (
                <div className="detail-section">
                  <h4>🎬 Demo Video</h4>
                  <div className="video-container">
                    <video
                      controls
                      className="detail-video"
                      src={`http://localhost:4000${detailProject.videoUrl}`}
                    />
                  </div>
                </div>
              )}

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
              <button
                className="detail-action-btn save-btn"
                onClick={() => {
                  // Save project to localStorage
                  const savedProjects = JSON.parse(localStorage.getItem('codegenius-saved-projects') || '[]');
                  const alreadySaved = savedProjects.some(p => p.id === detailProject.id);

                  if (alreadySaved) {
                    alert('✅ Project already saved!');
                    return;
                  }

                  const projectToSave = {
                    ...detailProject,
                    savedAt: new Date().toISOString()
                  };
                  savedProjects.push(projectToSave);
                  localStorage.setItem('codegenius-saved-projects', JSON.stringify(savedProjects));
                  alert('✅ Project saved successfully!');
                }}
              >
                💾 Save Project
              </button>
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
                  href={`${API_SERVER}${detailProject.filesUrl}`}
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
