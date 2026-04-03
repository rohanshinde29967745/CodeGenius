import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import {
    getCurrentUser,
    getInsightsSummary,
    getInsightsHeatmap,
    getInsightsProgress,
    getInsightsSkills,
    getInsightsTimeAnalytics,
    getInsightsAIReport
} from '../services/api';

import "./InsightsPage.css"; // Isolated CSS

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

function InsightsPage({ setPage }) {
    const [activeRange, setActiveRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [aiReport, setAiReport] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState({
        totalProblems: 0,
        totalProjects: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgTimePerProblem: 20
    });

    const [heatmapData, setHeatmapData] = useState([]);
    const [progressData, setProgressData] = useState({ labels: [], datasets: [] });
    const [skillsData, setSkillsData] = useState({
        labels: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'SQL'],
        datasets: [{
            label: 'Proficiency',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: '#4f46e5',
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#4f46e5'
        }]
    });
    const [timeData, setTimeData] = useState({
        labels: ['Problem Solving', 'Projects', 'Learning', 'Misc'],
        datasets: [{
            data: [25, 25, 25, 25],
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
            borderColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    });

    useEffect(() => { loadInsightsData(); }, []);

    useEffect(() => {
        const user = getCurrentUser();
        if (user?.id) { loadProgressData(user.id, activeRange); }
    }, [activeRange]);

    const loadInsightsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = getCurrentUser();
            if (!user?.id) { setError("Please log in to view insights"); setLoading(false); return; }

            const [summaryData, heatmapResult, progressResult, skillsResult, timeResult] = await Promise.all([
                getInsightsSummary(user.id).catch(() => ({})),
                getInsightsHeatmap(user.id).catch(() => ([])),
                getInsightsProgress(user.id, activeRange).catch(() => ({})),
                getInsightsSkills(user.id).catch(() => ({})),
                getInsightsTimeAnalytics(user.id).catch(() => ({}))
            ]);

            if (summaryData && !summaryData.error) {
                setStats({
                    totalProblems: summaryData.totalProblems || 0,
                    totalProjects: summaryData.totalProjects || 0,
                    totalXP: summaryData.totalXP || 0,
                    currentStreak: summaryData.currentStreak || 0,
                    longestStreak: summaryData.longestStreak || 0,
                    avgTimePerProblem: timeResult.avgTimePerProblem || 20
                });
            }

            if (Array.isArray(heatmapResult)) setHeatmapData(heatmapResult);

            if (progressResult && !progressResult.error) {
                setProgressData({
                    labels: progressResult.labels || [],
                    datasets: [
                        { label: 'XP Gained', data: progressResult.xpData || [], borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Problems Solved', data: progressResult.problemsData || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
                    ]
                });
            }

            if (skillsResult && !skillsResult.error) {
                setSkillsData({
                    labels: skillsResult.labels || ['JavaScript', 'Python', 'Java', 'C++', 'React', 'SQL'],
                    datasets: [{
                        label: 'Proficiency',
                        data: skillsResult.data || [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(79, 70, 229, 0.2)',
                        borderColor: '#4f46e5',
                        pointBackgroundColor: '#4f46e5',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#4f46e5'
                    }]
                });
            }

            if (timeResult && !timeResult.error) {
                setTimeData({
                    labels: timeResult.labels || ['Problem Solving', 'Projects', 'Learning', 'Misc'],
                    datasets: [{
                        data: timeResult.data || [25, 25, 25, 25],
                        backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
                        borderColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                });
            }
        } catch (err) {
            console.error("Error loading insights:", err);
            setError("Failed to load insights data");
        } finally { setLoading(false); }
    };

    const loadProgressData = async (userId, range) => {
        try {
            const progressResult = await getInsightsProgress(userId, range);
            if (!progressResult.error) {
                setProgressData({
                    labels: progressResult.labels || [],
                    datasets: [
                        { label: 'XP Gained', data: progressResult.xpData || [], borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Problems Solved', data: progressResult.problemsData || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
                    ]
                });
            }
        } catch (err) { console.error("Error loading progress data:", err); }
    };

    const generateAIReport = async () => {
        setGeneratingReport(true);
        try {
            const user = getCurrentUser();
            if (!user?.id) { setGeneratingReport(false); return; }
            const report = await getInsightsAIReport(user.id);
            if (!report.error) setAiReport(report);
            else {
                setAiReport({ summary: "Keep up the great work! Continue your coding journey with consistent practice." });
            }
        } catch (err) { console.error("Error generating AI report:", err); } 
        finally { setGeneratingReport(false); }
    };

    const getHeatmapColor = (count) => {
        if (count === 0) return '#1a1f2e';
        if (count === 1) return '#312e81';
        if (count === 2) return '#4338ca';
        if (count === 3) return '#4f46e5';
        return '#6366f1';
    };

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { display: false } }
    };

    if (loading) return <div className="ins-loading"><div className="ins-spinner"></div> Loading Insights...</div>;
    if (error) return <div className="ins-page"><div className="ins-error">{error} <button onClick={loadInsightsData}>Retry</button></div></div>;

    const heatmapCells = Array.isArray(heatmapData) && heatmapData.length > 0 
        ? heatmapData 
        : Array.from({ length: 60 }, (_, i) => ({ count: 0, date: `Day ${i + 1}` }));

    return (
        <div className="ins-page">
            
            {/* 1. Header Section */}
            <div className="ins-header">
                <button className="ins-back-btn" onClick={() => setPage('dashboard')}>Back</button>
                <div className="ins-title-section">
                    <h1 className="ins-title">Insights & Analytics</h1>
                    <p className="ins-subtitle">Track your coding journey</p>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="ins-stats-grid">
                <div className="ins-stat-card problems">
                    <span className="ins-stat-icon">🎯</span>
                    <span className="ins-stat-val">{stats.totalProblems}</span>
                    <span className="ins-stat-label">Problems Solved</span>
                </div>
                <div className="ins-stat-card projects">
                    <span className="ins-stat-icon">📁</span>
                    <span className="ins-stat-val">{stats.totalProjects}</span>
                    <span className="ins-stat-label">Projects</span>
                </div>
                <div className="ins-stat-card streak">
                    <span className="ins-stat-icon">🔥</span>
                    <span className="ins-stat-val">{stats.currentStreak}</span>
                    <span className="ins-stat-label">Day Streak</span>
                </div>
                <div className="ins-stat-card xp">
                    <span className="ins-stat-icon">⚡</span>
                    <span className="ins-stat-val">{(stats.totalXP / 1000).toFixed(1)}k</span>
                    <span className="ins-stat-label">Total XP</span>
                </div>
                <div className="ins-stat-card problems">
                    <span className="ins-stat-icon">⚡</span>
                    <span className="ins-stat-val">{stats.totalXP.toLocaleString()}</span>
                    <span className="ins-stat-label">Total XP</span>
                </div>
                <div className="ins-stat-card streak">
                    <span className="ins-stat-icon">🔥</span>
                    <span className="ins-stat-val">{stats.currentStreak}</span>
                    <span className="ins-stat-label">Day Streak</span>
                </div>
            </div>

            {/* 3. Main Analytics Grid (2 Columns) */}
            <div className="ins-main-grid">
                
                {/* Left Column (Activity + Progress) */}
                <div className="ins-col-left">
                    
                    {/* Activity Heatmap Card */}
                    <div className="ins-card">
                        <div className="ins-card-header">
                            <h3 className="ins-card-title">Activity</h3>
                            <div className="ins-filters">
                                <button className={`ins-filter-btn ${activeRange === '7d' ? 'active' : ''}`} onClick={() => setActiveRange('7d')}>7 Days</button>
                                <button className={`ins-filter-btn ${activeRange === '30d' ? 'active' : ''}`} onClick={() => setActiveRange('30d')}>30 Days</button>
                                <button className={`ins-filter-btn ${activeRange === '90d' ? 'active' : ''}`} onClick={() => setActiveRange('90d')}>90 Days</button>
                            </div>
                        </div>
                        <div className="ins-heatmap-container">
                            <div className="ins-heatmap-grid">
                                {heatmapCells.map((day, idx) => (
                                    <div key={idx} className="ins-heatmap-cell" 
                                         style={{ backgroundColor: getHeatmapColor(day.count) }}
                                         title={`${day.date}: ${day.count} actions`}></div>
                                ))}
                            </div>
                            <div className="ins-legend-box">
                                <div className="ins-legend-item"><span className="ins-lg-dot xp"></span> XP Gained</div>
                                <div className="ins-legend-item"><span className="ins-lg-dot solved"></span> Problems Solved</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Chart Card */}
                    <div className="ins-card">
                        <div className="ins-card-header">
                            <h3 className="ins-card-title">Progress Over Time</h3>
                        </div>
                        <div className="ins-chart-box">
                            <Line data={progressData} options={commonChartOptions} />
                        </div>
                    </div>

                </div>

                {/* Right Column (Skill Proficiency) */}
                <div className="ins-card">
                    <div className="ins-card-header">
                        <h3 className="ins-card-title">Skill Proficiency</h3>
                    </div>
                    <div className="ins-skill-box">
                        {skillsData.labels.map((skill, i) => (
                             <div key={i} className="ins-skill-item">
                                <div className="ins-skill-label">
                                    <span>{skill}</span>
                                    <span>{(skillsData.datasets[0].data[i] || 90) + Math.floor(Math.random() * 20)}</span>
                                </div>
                                <div className="ins-skill-bar-bg">
                                    <div className="ins-skill-bar-fill" style={{ width: `${Math.min(100, (skillsData.datasets[0].data[i] || 80) + 10)}%` }}></div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* 4. Bottom Analytics Section (2 Columns) */}
            <div className="ins-bottom-grid">
                
                {/* Time Distribution (Left) */}
                <div className="ins-card">
                    <div className="ins-card-header">
                        <h3 className="ins-card-title">Time Distribution</h3>
                    </div>
                    <div className="ins-time-content">
                        <div className="ins-donut-box">
                            <Doughnut data={timeData} options={doughnutOptions} />
                        </div>
                        <div className="ins-time-metrics">
                            <div className="ins-metric-item">
                                <span className="ins-metric-label">Avg per Problem</span>
                                <span className="ins-metric-val">{stats.avgTimePerProblem} min</span>
                            </div>
                            <div className="ins-metric-item">
                                <span className="ins-metric-label">Longest Streak</span>
                                <span className="ins-metric-val">{stats.longestStreak} days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insights (Right) */}
                <div className="ins-card ins-ai-card">
                    <div className="ins-card-header">
                        <h3 className="ins-card-title">AI Insights</h3>
                        <button className="ins-gen-btn" onClick={generateAIReport} disabled={generatingReport}>
                             {generatingReport ? "Generating..." : "Generate Report"}
                        </button>
                    </div>
                    <div className="ins-ai-placeholder">
                        <div className="ins-ai-icon">🤖</div>
                        <p className="ins-ai-text">
                            {aiReport?.summary || "Generate detailed reports powered by AI."}
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}

export default InsightsPage;
