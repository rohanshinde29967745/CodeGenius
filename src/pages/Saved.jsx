// Saved.jsx – Unified Page for Saved Problems and Projects
import React, { useState, useEffect } from "react";
import "../App.css";

function Saved() {
    const [activeTab, setActiveTab] = useState("problems");
    const [savedProblems, setSavedProblems] = useState([]);
    const [savedProjects, setSavedProjects] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    // Load saved items on mount
    useEffect(() => {
        loadSavedProblems();
        loadSavedProjects();
    }, []);

    const loadSavedProblems = () => {
        const saved = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');
        setSavedProblems(saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
    };

    const loadSavedProjects = () => {
        const saved = JSON.parse(localStorage.getItem('codegenius-saved-projects') || '[]');
        setSavedProjects(saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
    };

    const deleteSavedProblem = (id, e) => {
        if (e) e.stopPropagation();
        const updated = savedProblems.filter(p => p.id !== id);
        localStorage.setItem('codegenius-saved-problems', JSON.stringify(updated));
        setSavedProblems(updated);
        if (selectedProblem?.id === id) {
            setSelectedProblem(null);
        }
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

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return '#667eea';
        }
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

    // Clear selection when switching tabs
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedProblem(null);
        setSelectedProject(null);
    };

    return (
        <div className="saved-page">
            {/* Page Header */}
            <div className="saved-page-header">
                <div className="saved-page-title-section">
                    <h1 className="saved-page-title">💾 Saved Items</h1>
                    <p className="saved-page-subtitle">Your collection of saved problems and projects</p>
                </div>
                <div className="saved-page-stats">
                    <div className="saved-stat-card">
                        <span className="saved-stat-value">{savedProblems.length + savedProjects.length}</span>
                        <span className="saved-stat-label">Total Saved</span>
                    </div>
                    <div className="saved-stat-card">
                        <span className="saved-stat-value">{savedProblems.length}</span>
                        <span className="saved-stat-label problems">Problems</span>
                    </div>
                    <div className="saved-stat-card">
                        <span className="saved-stat-value">{savedProjects.length}</span>
                        <span className="saved-stat-label projects">Projects</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="saved-tabs">
                <button
                    className={`saved-tab ${activeTab === 'problems' ? 'active' : ''}`}
                    onClick={() => handleTabChange('problems')}
                >
                    <span className="tab-icon">📚</span>
                    Problems
                    <span className="tab-count">{savedProblems.length}</span>
                </button>
                <button
                    className={`saved-tab ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => handleTabChange('projects')}
                >
                    <span className="tab-icon">📁</span>
                    Projects
                    <span className="tab-count">{savedProjects.length}</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="saved-page-content">
                {/* Problems Tab */}
                {activeTab === 'problems' && (
                    <>
                        {savedProblems.length === 0 ? (
                            <div className="saved-page-empty">
                                <div className="saved-empty-icon">📭</div>
                                <h2>No Saved Problems Yet</h2>
                                <p>Save problems while practicing to review them later!</p>
                                <p className="saved-empty-hint">Go to <strong>Problems</strong> page → Generate a problem → Click <strong>Save Problem</strong></p>
                            </div>
                        ) : (
                            <div className="saved-page-grid">
                                {/* Problems List */}
                                <div className="saved-items-list">
                                    <div className="saved-list-header">
                                        <h3>All Problems</h3>
                                        <span className="saved-list-count">{savedProblems.length} problems</span>
                                    </div>
                                    <div className="saved-list-items">
                                        {savedProblems.map(problem => (
                                            <div
                                                key={problem.id}
                                                className={`saved-item-card ${selectedProblem?.id === problem.id ? 'active' : ''}`}
                                                onClick={() => setSelectedProblem(problem)}
                                            >
                                                <div className="saved-card-header">
                                                    <span
                                                        className="saved-card-difficulty"
                                                        style={{
                                                            background: getDifficultyColor(problem.difficulty) + '20',
                                                            color: getDifficultyColor(problem.difficulty)
                                                        }}
                                                    >
                                                        {problem.difficulty}
                                                    </span>
                                                    <span className="saved-card-lang">{problem.language}</span>
                                                </div>
                                                <h4 className="saved-card-title">{problem.problem}</h4>
                                                <p className="saved-card-desc">
                                                    {problem.description?.substring(0, 100)}
                                                    {problem.description?.length > 100 ? '...' : ''}
                                                </p>
                                                <div className="saved-card-footer">
                                                    <span className="saved-card-date">{formatDate(problem.savedAt)}</span>
                                                    <button
                                                        className="saved-card-delete"
                                                        onClick={(e) => deleteSavedProblem(problem.id, e)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Problem Detail */}
                                <div className="saved-item-detail">
                                    {selectedProblem ? (
                                        <>
                                            <div className="saved-detail-top">
                                                <div className="saved-detail-title-row">
                                                    <h2>{selectedProblem.problem}</h2>
                                                    <div className="saved-detail-badges">
                                                        <span
                                                            className="saved-badge difficulty"
                                                            style={{
                                                                background: getDifficultyColor(selectedProblem.difficulty) + '20',
                                                                color: getDifficultyColor(selectedProblem.difficulty)
                                                            }}
                                                        >
                                                            {selectedProblem.difficulty}
                                                        </span>
                                                        <span className="saved-badge language">{selectedProblem.language}</span>
                                                    </div>
                                                </div>
                                                <span className="saved-detail-date">Saved on {formatDate(selectedProblem.savedAt)}</span>
                                            </div>

                                            <div className="saved-detail-body">
                                                {/* Description */}
                                                {selectedProblem.description && (
                                                    <div className="saved-detail-section">
                                                        <h3>📝 Description</h3>
                                                        <p>{selectedProblem.description}</p>
                                                    </div>
                                                )}

                                                {/* Examples */}
                                                {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                                                    <div className="saved-detail-section">
                                                        <h3>💡 Examples</h3>
                                                        <div className="saved-examples-grid">
                                                            {selectedProblem.examples.map((ex, i) => (
                                                                <div key={i} className="saved-example-box">
                                                                    <div className="saved-example-num">Example {i + 1}</div>
                                                                    <div className="saved-example-content">
                                                                        <div className="saved-ex-row">
                                                                            <strong>Input:</strong>
                                                                            <code>{ex.input}</code>
                                                                        </div>
                                                                        <div className="saved-ex-row">
                                                                            <strong>Output:</strong>
                                                                            <code>{ex.output}</code>
                                                                        </div>
                                                                        {ex.explain && (
                                                                            <div className="saved-ex-explain">
                                                                                <strong>Explanation:</strong> {ex.explain}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Constraints */}
                                                {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                                                    <div className="saved-detail-section">
                                                        <h3>⚠️ Constraints</h3>
                                                        <ul className="saved-constraints">
                                                            {selectedProblem.constraints.map((c, i) => (
                                                                <li key={i}>{c}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Solution */}
                                                {selectedProblem.solution && (
                                                    <div className="saved-detail-section">
                                                        <h3>💻 Your Solution ({selectedProblem.language})</h3>
                                                        <pre className="saved-code-block">
                                                            <code>{selectedProblem.solution}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="saved-detail-actions">
                                                <button
                                                    className="saved-action-btn delete"
                                                    onClick={(e) => deleteSavedProblem(selectedProblem.id, e)}
                                                >
                                                    🗑️ Delete Problem
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="saved-detail-placeholder">
                                            <div className="saved-placeholder-icon">👈</div>
                                            <h3>Select a Problem</h3>
                                            <p>Click on a problem from the list to view its details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <>
                        {savedProjects.length === 0 ? (
                            <div className="saved-page-empty">
                                <div className="saved-empty-icon">📁</div>
                                <h2>No Saved Projects Yet</h2>
                                <p>Save projects while browsing the gallery to keep track of interesting work!</p>
                                <p className="saved-empty-hint">Go to <strong>Projects</strong> page → Browse projects → Click <strong>💾 Save</strong></p>
                            </div>
                        ) : (
                            <div className="saved-page-grid">
                                {/* Projects List */}
                                <div className="saved-items-list">
                                    <div className="saved-list-header">
                                        <h3>All Saved Projects</h3>
                                        <span className="saved-list-count">{savedProjects.length} projects</span>
                                    </div>
                                    <div className="saved-list-items">
                                        {savedProjects.map(project => (
                                            <div
                                                key={project.id}
                                                className={`saved-item-card project ${selectedProject?.id === project.id ? 'active' : ''}`}
                                                onClick={() => setSelectedProject(project)}
                                            >
                                                <div className="saved-card-header">
                                                    {project.category && (
                                                        <span
                                                            className="saved-card-category"
                                                            style={{
                                                                background: getCategoryColor(project.category) + '20',
                                                                color: getCategoryColor(project.category)
                                                            }}
                                                        >
                                                            {project.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="saved-card-title">{project.title}</h4>
                                                <p className="saved-card-author">👤 {project.author}</p>
                                                <p className="saved-card-desc">
                                                    {project.description?.substring(0, 80)}
                                                    {project.description?.length > 80 ? '...' : ''}
                                                </p>
                                                <div className="saved-card-footer">
                                                    <div className="saved-card-stats">
                                                        <span>👁 {project.views || 0}</span>
                                                        <span>⭐ {project.likes || 0}</span>
                                                    </div>
                                                    <button
                                                        className="saved-card-delete"
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
                                <div className="saved-item-detail">
                                    {selectedProject ? (
                                        <>
                                            <div className="saved-detail-top">
                                                <div className="saved-detail-title-row">
                                                    <h2>{selectedProject.title}</h2>
                                                    {selectedProject.category && (
                                                        <span
                                                            className="saved-badge category"
                                                            style={{
                                                                background: getCategoryColor(selectedProject.category) + '20',
                                                                color: getCategoryColor(selectedProject.category)
                                                            }}
                                                        >
                                                            {selectedProject.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="saved-detail-meta">
                                                    <span className="saved-detail-author">👤 {selectedProject.author}</span>
                                                    <span className="saved-detail-date">Saved on {formatDate(selectedProject.savedAt)}</span>
                                                </div>
                                                <div className="saved-detail-stats">
                                                    <span>👁 {selectedProject.views || 0} views</span>
                                                    <span>⭐ {selectedProject.likes || 0} likes</span>
                                                </div>
                                            </div>

                                            <div className="saved-detail-body">
                                                {/* Description */}
                                                {selectedProject.description && (
                                                    <div className="saved-detail-section">
                                                        <h3>📋 Description</h3>
                                                        <p>{selectedProject.description}</p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                {selectedProject.tags && selectedProject.tags.length > 0 && (
                                                    <div className="saved-detail-section">
                                                        <h3>🏷️ Tags</h3>
                                                        <div className="saved-tags-list">
                                                            {selectedProject.tags.map((tag, i) => (
                                                                <span key={i} className="saved-tag">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* GitHub Link */}
                                                {selectedProject.github && (
                                                    <div className="saved-detail-section">
                                                        <h3>🔗 Repository</h3>
                                                        <a
                                                            href={selectedProject.github}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="saved-github-link"
                                                        >
                                                            📂 {selectedProject.github}
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Screenshots */}
                                                {selectedProject.screenshots && selectedProject.screenshots.length > 0 && (
                                                    <div className="saved-detail-section">
                                                        <h3>📸 Screenshots</h3>
                                                        <div className="saved-screenshots-grid">
                                                            {selectedProject.screenshots.map((url, i) => (
                                                                <img
                                                                    key={i}
                                                                    src={`http://localhost:4000${url}`}
                                                                    alt={`Screenshot ${i + 1}`}
                                                                    className="saved-screenshot"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Video */}
                                                {selectedProject.videoUrl && (
                                                    <div className="saved-detail-section">
                                                        <h3>🎬 Demo Video</h3>
                                                        <video
                                                            controls
                                                            className="saved-video"
                                                            src={`http://localhost:4000${selectedProject.videoUrl}`}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="saved-detail-actions">
                                                {selectedProject.github && (
                                                    <a
                                                        href={selectedProject.github}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="saved-action-btn primary"
                                                    >
                                                        🔗 View on GitHub
                                                    </a>
                                                )}
                                                <button
                                                    className="saved-action-btn delete"
                                                    onClick={(e) => deleteSavedProject(selectedProject.id, e)}
                                                >
                                                    🗑️ Remove from Saved
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="saved-detail-placeholder">
                                            <div className="saved-placeholder-icon">👈</div>
                                            <h3>Select a Project</h3>
                                            <p>Click on a project from the list to view its details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Saved;
