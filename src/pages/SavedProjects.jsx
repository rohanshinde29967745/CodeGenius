// SavedProjects.jsx – Full Page for Saved Projects
import React, { useState, useEffect } from "react";
import "../App.css";

function SavedProjects() {
    const [savedProjects, setSavedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    // Load saved projects on mount
    useEffect(() => {
        loadSavedProjects();
    }, []);

    const loadSavedProjects = () => {
        const saved = JSON.parse(localStorage.getItem('codegenius-saved-projects') || '[]');
        setSavedProjects(saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
    };

    const deleteSavedProject = (id, e) => {
        if (e) e.stopPropagation();
        const updated = savedProjects.filter(p => p.id !== id);
        localStorage.setItem('codegenius-saved-projects', JSON.stringify(updated));
        setSavedProjects(updated);
        if (selectedProject?.id === id) {
            setSelectedProject(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Web Development': '#3b82f6',
            'Data Science': '#10b981',
            'Mobile Apps': '#f59e0b',
            'Machine Learning': '#8b5cf6'
        };
        return colors[category] || '#667eea';
    };

    return (
        <div className="saved-projects-page">
            {/* Page Header */}
            <div className="sproj-page-header">
                <div className="sproj-page-title-section">
                    <h1 className="sproj-page-title">📁 Saved Projects</h1>
                    <p className="sproj-page-subtitle">Your collection of saved projects from the gallery</p>
                </div>
                <div className="sproj-page-stats">
                    <div className="sproj-stat-card">
                        <span className="sproj-stat-value">{savedProjects.length}</span>
                        <span className="sproj-stat-label">Total Saved</span>
                    </div>
                    <div className="sproj-stat-card">
                        <span className="sproj-stat-value">{savedProjects.filter(p => p.category === 'Web Development').length}</span>
                        <span className="sproj-stat-label web">Web Dev</span>
                    </div>
                    <div className="sproj-stat-card">
                        <span className="sproj-stat-value">{savedProjects.filter(p => p.category === 'Data Science').length}</span>
                        <span className="sproj-stat-label data">Data</span>
                    </div>
                    <div className="sproj-stat-card">
                        <span className="sproj-stat-value">{savedProjects.filter(p => p.category === 'Mobile Apps' || p.category === 'Machine Learning').length}</span>
                        <span className="sproj-stat-label other">Other</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="sproj-page-content">
                {savedProjects.length === 0 ? (
                    <div className="sproj-page-empty">
                        <div className="sproj-empty-icon">📁</div>
                        <h2>No Saved Projects Yet</h2>
                        <p>Save projects while browsing the gallery to keep track of interesting work!</p>
                        <p className="sproj-empty-hint">Go to <strong>Projects</strong> page → Browse projects → Click <strong>💾 Save</strong></p>
                    </div>
                ) : (
                    <div className="sproj-page-grid">
                        {/* Projects List */}
                        <div className="sproj-projects-list">
                            <div className="sproj-list-header">
                                <h3>All Saved Projects</h3>
                                <span className="sproj-list-count">{savedProjects.length} projects</span>
                            </div>
                            <div className="sproj-list-items">
                                {savedProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className={`sproj-project-card ${selectedProject?.id === project.id ? 'active' : ''}`}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        <div className="sproj-card-header">
                                            {project.category && (
                                                <span
                                                    className="sproj-card-category"
                                                    style={{
                                                        background: getCategoryColor(project.category) + '20',
                                                        color: getCategoryColor(project.category)
                                                    }}
                                                >
                                                    {project.category}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="sproj-card-title">{project.title}</h4>
                                        <p className="sproj-card-author">👤 {project.author}</p>
                                        <p className="sproj-card-desc">
                                            {project.description?.substring(0, 80)}
                                            {project.description?.length > 80 ? '...' : ''}
                                        </p>
                                        <div className="sproj-card-footer">
                                            <div className="sproj-card-stats">
                                                <span>👁 {project.views || 0}</span>
                                                <span>⭐ {project.likes || 0}</span>
                                            </div>
                                            <button
                                                className="sproj-card-delete"
                                                onClick={(e) => deleteSavedProject(project.id, e)}
                                                title="Remove"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Project Detail */}
                        <div className="sproj-project-detail">
                            {selectedProject ? (
                                <>
                                    <div className="sproj-detail-top">
                                        <div className="sproj-detail-title-row">
                                            <h2>{selectedProject.title}</h2>
                                            {selectedProject.category && (
                                                <span
                                                    className="sproj-badge category"
                                                    style={{
                                                        background: getCategoryColor(selectedProject.category) + '20',
                                                        color: getCategoryColor(selectedProject.category)
                                                    }}
                                                >
                                                    {selectedProject.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="sproj-detail-meta">
                                            <span className="sproj-detail-author">👤 {selectedProject.author}</span>
                                            <span className="sproj-detail-date">Saved on {formatDate(selectedProject.savedAt)}</span>
                                        </div>
                                        <div className="sproj-detail-stats">
                                            <span>👁 {selectedProject.views || 0} views</span>
                                            <span>⭐ {selectedProject.likes || 0} likes</span>
                                        </div>
                                    </div>

                                    <div className="sproj-detail-body">
                                        {/* Description */}
                                        {selectedProject.description && (
                                            <div className="sproj-detail-section">
                                                <h3>📋 Description</h3>
                                                <p>{selectedProject.description}</p>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {selectedProject.tags && selectedProject.tags.length > 0 && (
                                            <div className="sproj-detail-section">
                                                <h3>🏷️ Tags</h3>
                                                <div className="sproj-tags-list">
                                                    {selectedProject.tags.map((tag, i) => (
                                                        <span key={i} className="sproj-tag">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* GitHub Link */}
                                        {selectedProject.github && (
                                            <div className="sproj-detail-section">
                                                <h3>🔗 Repository</h3>
                                                <a
                                                    href={selectedProject.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="sproj-github-link"
                                                >
                                                    📂 {selectedProject.github}
                                                </a>
                                            </div>
                                        )}

                                        {/* Screenshots */}
                                        {selectedProject.screenshots && selectedProject.screenshots.length > 0 && (
                                            <div className="sproj-detail-section">
                                                <h3>📸 Screenshots</h3>
                                                <div className="sproj-screenshots-grid">
                                                    {selectedProject.screenshots.map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={`http://localhost:4000${url}`}
                                                            alt={`Screenshot ${i + 1}`}
                                                            className="sproj-screenshot"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Video */}
                                        {selectedProject.videoUrl && (
                                            <div className="sproj-detail-section">
                                                <h3>🎬 Demo Video</h3>
                                                <video
                                                    controls
                                                    className="sproj-video"
                                                    src={`http://localhost:4000${selectedProject.videoUrl}`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="sproj-detail-actions">
                                        {selectedProject.github && (
                                            <a
                                                href={selectedProject.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sproj-action-btn primary"
                                            >
                                                🔗 View on GitHub
                                            </a>
                                        )}
                                        <button
                                            className="sproj-action-btn delete"
                                            onClick={(e) => deleteSavedProject(selectedProject.id, e)}
                                        >
                                            🗑️ Remove from Saved
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="sproj-detail-placeholder">
                                    <div className="sproj-placeholder-icon">👈</div>
                                    <h3>Select a Project</h3>
                                    <p>Click on a project from the list to view its details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SavedProjects;
