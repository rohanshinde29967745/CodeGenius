import React, { useState } from 'react';
import { getCurrentUser } from '../services/api';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose }) => {
    const [reportType, setReportType] = useState('bug');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const reportTypes = [
        { value: 'bug', label: '🐛 Bug Report', description: 'Something is broken or not working' },
        { value: 'feature', label: '💡 Feature Request', description: 'Suggest a new feature' },
        { value: 'problem_issue', label: '⚠️ Problem Issue', description: 'Incorrect test case or solution' },
        { value: 'other', label: '📝 Other', description: 'General feedback or question' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const currentUser = getCurrentUser();
            const response = await fetch('http://localhost:4000/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?.id,
                    reportType,
                    title: title.trim(),
                    description: description.trim(),
                    pageUrl: window.location.href,
                }),
            });

            if (!response.ok) throw new Error('Failed to submit');

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setTitle('');
                setDescription('');
                setReportType('bug');
            }, 2000);
        } catch (err) {
            setError('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <button className="report-modal-close" onClick={onClose}>×</button>

                <h2 className="report-modal-title">📋 Submit a Report</h2>
                <p className="report-modal-subtitle">Help us improve CodeGenius!</p>

                {success ? (
                    <div className="report-success">
                        <span className="success-icon">✅</span>
                        <h3>Report Submitted!</h3>
                        <p>Thank you for your feedback. We'll review it soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="report-error">{error}</div>}

                        <div className="report-type-grid">
                            {reportTypes.map((type) => (
                                <label
                                    key={type.value}
                                    className={`report-type-option ${reportType === type.value ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value={type.value}
                                        checked={reportType === type.value}
                                        onChange={(e) => setReportType(e.target.value)}
                                    />
                                    <span className="type-label">{type.label}</span>
                                    <span className="type-desc">{type.description}</span>
                                </label>
                            ))}
                        </div>

                        <label className="report-label">
                            Title
                            <input
                                type="text"
                                className="report-input"
                                placeholder="Brief summary of your report"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                            />
                        </label>

                        <label className="report-label">
                            Description
                            <textarea
                                className="report-textarea"
                                placeholder="Please describe in detail..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                            />
                        </label>

                        <button type="submit" className="report-submit" disabled={loading}>
                            {loading ? 'Submitting...' : '📨 Submit Report'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
