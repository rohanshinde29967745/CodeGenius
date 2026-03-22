// SavedProblems.jsx – Full Page for Saved Problems
import React, { useState, useEffect } from "react";
import "../App.css";

function SavedProblems() {
    const [savedProblems, setSavedProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState(null);

    // Load saved problems on mount
    useEffect(() => {
        loadSavedProblems();
    }, []);

    const loadSavedProblems = () => {
        const saved = JSON.parse(localStorage.getItem('codegenius-saved-problems') || '[]');
        setSavedProblems(saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
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

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return '#667eea';
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

    return (
        <div className="saved-problems-page">
            {/* Page Header */}
            <div className="sp-page-header">
                <div className="sp-page-title-section">
                    <h1 className="sp-page-title">📚 Saved Problems</h1>
                    <p className="sp-page-subtitle">Your collection of saved coding challenges</p>
                </div>
                <div className="sp-page-stats">
                    <div className="sp-stat-card">
                        <span className="sp-stat-value">{savedProblems.length}</span>
                        <span className="sp-stat-label">Total Saved</span>
                    </div>
                    <div className="sp-stat-card">
                        <span className="sp-stat-value">{savedProblems.filter(p => p.difficulty?.toLowerCase() === 'easy').length}</span>
                        <span className="sp-stat-label easy">Easy</span>
                    </div>
                    <div className="sp-stat-card">
                        <span className="sp-stat-value">{savedProblems.filter(p => p.difficulty?.toLowerCase() === 'medium').length}</span>
                        <span className="sp-stat-label medium">Medium</span>
                    </div>
                    <div className="sp-stat-card">
                        <span className="sp-stat-value">{savedProblems.filter(p => p.difficulty?.toLowerCase() === 'hard').length}</span>
                        <span className="sp-stat-label hard">Hard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="sp-page-content">
                {savedProblems.length === 0 ? (
                    <div className="sp-page-empty">
                        <div className="sp-empty-icon">📭</div>
                        <h2>No Saved Problems Yet</h2>
                        <p>Save problems while practicing to review them later!</p>
                        <p className="sp-empty-hint">Go to <strong>Problems</strong> page → Generate a problem → Click <strong>Save Problem</strong></p>
                    </div>
                ) : (
                    <div className="sp-page-grid">
                        {/* Problems List */}
                        <div className="sp-problems-list">
                            <div className="sp-list-header">
                                <h3>All Problems</h3>
                                <span className="sp-list-count">{savedProblems.length} problems</span>
                            </div>
                            <div className="sp-list-items">
                                {savedProblems.map(problem => (
                                    <div
                                        key={problem.id}
                                        className={`sp-problem-card ${selectedProblem?.id === problem.id ? 'active' : ''}`}
                                        onClick={() => setSelectedProblem(problem)}
                                    >
                                        <div className="sp-card-header">
                                            <span
                                                className="sp-card-difficulty"
                                                style={{
                                                    background: getDifficultyColor(problem.difficulty) + '20',
                                                    color: getDifficultyColor(problem.difficulty)
                                                }}
                                            >
                                                {problem.difficulty}
                                            </span>
                                            <span className="sp-card-lang">{problem.language}</span>
                                        </div>
                                        <h4 className="sp-card-title">{problem.problem}</h4>
                                        <p className="sp-card-desc">
                                            {problem.description?.substring(0, 100)}
                                            {problem.description?.length > 100 ? '...' : ''}
                                        </p>
                                        <div className="sp-card-footer">
                                            <span className="sp-card-date">{formatDate(problem.savedAt)}</span>
                                            <button
                                                className="sp-card-delete"
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
                        <div className="sp-problem-detail">
                            {selectedProblem ? (
                                <>
                                    <div className="sp-detail-top">
                                        <div className="sp-detail-title-row">
                                            <h2>{selectedProblem.problem}</h2>
                                            <div className="sp-detail-badges">
                                                <span
                                                    className="sp-badge difficulty"
                                                    style={{
                                                        background: getDifficultyColor(selectedProblem.difficulty) + '20',
                                                        color: getDifficultyColor(selectedProblem.difficulty)
                                                    }}
                                                >
                                                    {selectedProblem.difficulty}
                                                </span>
                                                <span className="sp-badge language">{selectedProblem.language}</span>
                                            </div>
                                        </div>
                                        <span className="sp-detail-date">Saved on {formatDate(selectedProblem.savedAt)}</span>
                                    </div>

                                    <div className="sp-detail-body">
                                        {/* Description */}
                                        {selectedProblem.description && (
                                            <div className="sp-detail-section">
                                                <h3>📝 Description</h3>
                                                <p>{selectedProblem.description}</p>
                                            </div>
                                        )}

                                        {/* Examples */}
                                        {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                                            <div className="sp-detail-section">
                                                <h3>💡 Examples</h3>
                                                <div className="sp-examples-grid">
                                                    {selectedProblem.examples.map((ex, i) => (
                                                        <div key={i} className="sp-example-box">
                                                            <div className="sp-example-num">Example {i + 1}</div>
                                                            <div className="sp-example-content">
                                                                <div className="sp-ex-row">
                                                                    <strong>Input:</strong>
                                                                    <code>{ex.input}</code>
                                                                </div>
                                                                <div className="sp-ex-row">
                                                                    <strong>Output:</strong>
                                                                    <code>{ex.output}</code>
                                                                </div>
                                                                {ex.explain && (
                                                                    <div className="sp-ex-explain">
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
                                            <div className="sp-detail-section">
                                                <h3>⚠️ Constraints</h3>
                                                <ul className="sp-constraints">
                                                    {selectedProblem.constraints.map((c, i) => (
                                                        <li key={i}>{c}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Solution */}
                                        {selectedProblem.solution && (
                                            <div className="sp-detail-section">
                                                <h3>💻 Your Solution ({selectedProblem.language})</h3>
                                                <pre className="sp-code-block">
                                                    <code>{selectedProblem.solution}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sp-detail-actions">
                                        <button
                                            className="sp-action-btn delete"
                                            onClick={(e) => deleteSavedProblem(selectedProblem.id, e)}
                                        >
                                            🗑️ Delete Problem
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="sp-detail-placeholder">
                                    <div className="sp-placeholder-icon">👈</div>
                                    <h3>Select a Problem</h3>
                                    <p>Click on a problem from the list to view its details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SavedProblems;
