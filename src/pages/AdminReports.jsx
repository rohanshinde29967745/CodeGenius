import React, { useState, useEffect, useCallback } from "react";
import "../App.css";

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const fetchReports = useCallback(async () => {
        try {
            const url = filter === "all"
                ? "http://localhost:4000/api/reports"
                : `http://localhost:4000/api/reports?status=${filter}`;
            const response = await fetch(url);
            const data = await response.json();
            setReports(data.reports || []);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const updateStatus = async (reportId, newStatus) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            await fetch(`http://localhost:4000/api/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, resolvedBy: currentUser?.id }),
            });
            fetchReports();
        } catch (error) {
            console.error("Failed to update:", error);
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm("Delete this report?")) return;
        try {
            await fetch(`http://localhost:4000/api/reports/${reportId}`, { method: 'DELETE' });
            fetchReports();
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const getTypeColor = (type) => ({
        bug: '#ef4444',
        feature: '#3b82f6',
        problem_issue: '#f59e0b',
        other: '#6b7280',
    }[type] || '#6b7280');

    const getStatusStyle = (status) => ({
        pending: { bg: '#fef3c7', color: '#92400e' },
        in_progress: { bg: '#dbeafe', color: '#1e40af' },
        resolved: { bg: '#d1fae5', color: '#065f46' },
        closed: { bg: '#e5e7eb', color: '#374151' },
    }[status] || { bg: '#e5e7eb', color: '#374151' });

    const pendingCount = reports.filter(r => r.status === 'pending').length;

    return (
        <div className="dashboard-container">
            <h1 className="welcome-text">📋 User Reports</h1>
            <p className="sub-text">Manage bug reports and feature requests from users.</p>

            {/* Filter Tabs */}
            <div className="lb-tabs" style={{ marginBottom: '20px' }}>
                {['all', 'pending', 'in_progress', 'resolved'].map(f => (
                    <button
                        key={f}
                        className={filter === f ? "lb-tab active" : "lb-tab"}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'pending' && pendingCount > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.75rem', marginLeft: '6px' }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg, #fff)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '3rem' }}>📭</span>
                    <h3>No reports found</h3>
                    <p style={{ color: '#888' }}>Reports from users will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.map((report) => {
                        const statusStyle = getStatusStyle(report.status);
                        return (
                            <div
                                key={report.id}
                                style={{
                                    background: 'var(--card-bg, #fff)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    borderLeft: `4px solid ${getTypeColor(report.reportType)}`,
                                }}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ background: getTypeColor(report.reportType), color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                            {report.reportType.replace('_', ' ')}
                                        </span>
                                        <strong style={{ fontSize: '1rem' }}>{report.title}</strong>
                                    </div>
                                    <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Description */}
                                <p style={{ margin: '10px 0', color: '#666', lineHeight: '1.5' }}>{report.description}</p>

                                {/* Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <small style={{ color: '#888' }}>
                                        By <strong>{report.userName}</strong> • {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {report.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateStatus(report.id, 'in_progress')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    🔄 In Progress
                                                </button>
                                                <button onClick={() => updateStatus(report.id, 'resolved')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    ✓ Resolve
                                                </button>
                                            </>
                                        )}
                                        {report.status === 'in_progress' && (
                                            <button onClick={() => updateStatus(report.id, 'resolved')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                ✓ Mark Resolved
                                            </button>
                                        )}
                                        <button onClick={() => deleteReport(report.id)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AdminReports;
