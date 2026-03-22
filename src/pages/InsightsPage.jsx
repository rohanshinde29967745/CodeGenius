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

    // Real data from API
    const [stats, setStats] = useState({
        totalProblems: 0,
        totalProjects: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgTimePerProblem: 20
    });

    const [heatmapData, setHeatmapData] = useState([]);
    const [progressData, setProgressData] = useState({
        labels: [],
        datasets: []
    });
    const [skillsData, setSkillsData] = useState({
        labels: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'SQL'],
        datasets: [{
            label: 'Proficiency',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: '#667eea',
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#667eea'
        }]
    });
    const [timeData, setTimeData] = useState({
        labels: ['Problem Solving', 'Projects', 'Learning', 'Code Review'],
        datasets: [{
            data: [25, 25, 25, 25],
            backgroundColor: [
                'rgba(102, 126, 234, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: ['#667eea', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 2
        }]
    });

    // Load all insights data
    useEffect(() => {
        loadInsightsData();
    }, []);

    // Reload progress data when range changes
    useEffect(() => {
        const user = getCurrentUser();
        if (user?.id) {
            loadProgressData(user.id, activeRange);
        }
    }, [activeRange]);

    const loadInsightsData = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = getCurrentUser();
            if (!user?.id) {
                setError("Please log in to view insights");
                setLoading(false);
                return;
            }

            // Load all data in parallel
            const [summaryData, heatmapResult, progressResult, skillsResult, timeResult] = await Promise.all([
                getInsightsSummary(user.id),
                getInsightsHeatmap(user.id),
                getInsightsProgress(user.id, activeRange),
                getInsightsSkills(user.id),
                getInsightsTimeAnalytics(user.id)
            ]);

            // Set summary stats
            if (!summaryData.error) {
                setStats({
                    totalProblems: summaryData.totalProblems || 0,
                    totalProjects: summaryData.totalProjects || 0,
                    totalXP: summaryData.totalXP || 0,
                    currentStreak: summaryData.currentStreak || 0,
                    longestStreak: summaryData.longestStreak || 0,
                    avgTimePerProblem: timeResult.avgTimePerProblem || 20
                });
            }

            // Set heatmap data
            if (Array.isArray(heatmapResult)) {
                setHeatmapData(heatmapResult);
            }

            // Set progress chart data
            if (!progressResult.error) {
                setProgressData({
                    labels: progressResult.labels || [],
                    datasets: [
                        {
                            label: 'XP Gained',
                            data: progressResult.xpData || [],
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Problems Solved',
                            data: progressResult.problemsData || [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                });
            }

            // Set skills radar data
            if (!skillsResult.error) {
                setSkillsData({
                    labels: skillsResult.labels || ['JavaScript', 'Python', 'Java', 'C++', 'React', 'SQL'],
                    datasets: [{
                        label: 'Proficiency',
                        data: skillsResult.data || [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: '#667eea',
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#667eea'
                    }]
                });
            }

            // Set time distribution data
            if (!timeResult.error) {
                setTimeData({
                    labels: timeResult.labels || ['Problem Solving', 'Projects', 'Learning', 'Code Review'],
                    datasets: [{
                        data: timeResult.data || [25, 25, 25, 25],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: ['#667eea', '#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 2
                    }]
                });
            }

        } catch (err) {
            console.error("Error loading insights:", err);
            setError("Failed to load insights data");
        } finally {
            setLoading(false);
        }
    };

    const loadProgressData = async (userId, range) => {
        try {
            const progressResult = await getInsightsProgress(userId, range);
            if (!progressResult.error) {
                setProgressData({
                    labels: progressResult.labels || [],
                    datasets: [
                        {
                            label: 'XP Gained',
                            data: progressResult.xpData || [],
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Problems Solved',
                            data: progressResult.problemsData || [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                });
            }
        } catch (err) {
            console.error("Error loading progress data:", err);
        }
    };

    const generateAIReport = async () => {
        setGeneratingReport(true);
        try {
            const user = getCurrentUser();
            if (!user?.id) {
                setGeneratingReport(false);
                return;
            }

            const report = await getInsightsAIReport(user.id);

            if (!report.error) {
                setAiReport(report);
            } else {
                // Fallback report
                setAiReport({
                    summary: "Keep up the great work! Continue your coding journey with consistent practice.",
                    achievements: ["🎯 Active learner", "📈 Making progress"],
                    improvements: ["Try solving more problems daily"],
                    recommendations: ["Explore different programming languages"]
                });
            }
        } catch (err) {
            console.error("Error generating AI report:", err);
            setAiReport({
                summary: "Keep up the great work! Continue your coding journey.",
                achievements: ["🎯 You're on the right track!"],
                improvements: ["Try solving more problems"],
                recommendations: ["Practice consistently"]
            });
        } finally {
            setGeneratingReport(false);
        }
    };

    const getHeatmapColor = (count) => {
        if (count === 0) return 'var(--heatmap-empty)';
        if (count === 1) return 'var(--heatmap-level-1)';
        if (count === 2) return 'var(--heatmap-level-2)';
        if (count === 3) return 'var(--heatmap-level-3)';
        return 'var(--heatmap-level-4)';
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { size: 12 }
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    backdropColor: 'transparent'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { size: 12 },
                    padding: 15
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="insights-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="insights-page">
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={loadInsightsData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-page">
            {/* Header */}
            <div className="insights-header">
                <button className="insights-back-btn" onClick={() => setPage('dashboard')}>
                    <span>←</span>
                    <span>Back</span>
                </button>
                <div className="insights-title-section">
                    <h1 className="insights-title">📊 Insights & Analytics</h1>
                    <p className="insights-subtitle">Track your coding journey</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card">
                    <span className="stat-icon">🎯</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalProblems}</span>
                        <span className="stat-label">Problems Solved</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📁</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalProjects}</span>
                        <span className="stat-label">Projects</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">⚡</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalXP.toLocaleString()}</span>
                        <span className="stat-label">Total XP</span>
                    </div>
                </div>
                <div className="stat-card streak">
                    <span className="stat-icon">🔥</span>
                    <div className="stat-info">
                        <span className="stat-value">{stats.currentStreak}</span>
                        <span className="stat-label">Day Streak</span>
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="insights-card heatmap-card">
                <div className="card-header">
                    <h3>📅 Activity Heatmap</h3>
                    <span className="heatmap-legend">
                        Less <span className="legend-squares">
                            <span style={{ background: 'var(--heatmap-empty)' }}></span>
                            <span style={{ background: 'var(--heatmap-level-1)' }}></span>
                            <span style={{ background: 'var(--heatmap-level-2)' }}></span>
                            <span style={{ background: 'var(--heatmap-level-3)' }}></span>
                            <span style={{ background: 'var(--heatmap-level-4)' }}></span>
                        </span> More
                    </span>
                </div>
                <div className="heatmap-grid">
                    {heatmapData.map((day, index) => (
                        <div
                            key={index}
                            className="heatmap-cell"
                            style={{ backgroundColor: getHeatmapColor(day.count) }}
                            title={`${day.date}: ${day.count} activities`}
                        />
                    ))}
                </div>
            </div>

            {/* Progress Charts */}
            <div className="insights-card chart-card">
                <div className="card-header">
                    <h3>📈 Progress Over Time</h3>
                    <div className="range-buttons">
                        <button
                            className={activeRange === '7d' ? 'active' : ''}
                            onClick={() => setActiveRange('7d')}
                        >7 Days</button>
                        <button
                            className={activeRange === '30d' ? 'active' : ''}
                            onClick={() => setActiveRange('30d')}
                        >30 Days</button>
                        <button
                            className={activeRange === '90d' ? 'active' : ''}
                            onClick={() => setActiveRange('90d')}
                        >90 Days</button>
                    </div>
                </div>
                <div className="chart-container">
                    <Line data={progressData} options={chartOptions} />
                </div>
            </div>

            {/* Skills & Time Row */}
            <div className="insights-row">
                {/* Skills Radar */}
                <div className="insights-card chart-card">
                    <div className="card-header">
                        <h3>🎯 Skill Proficiency</h3>
                    </div>
                    <div className="chart-container radar-container">
                        <Radar data={skillsData} options={radarOptions} />
                    </div>
                </div>

                {/* Time Analytics */}
                <div className="insights-card chart-card">
                    <div className="card-header">
                        <h3>⏱️ Time Distribution</h3>
                    </div>
                    <div className="chart-container doughnut-container">
                        <Doughnut data={timeData} options={doughnutOptions} />
                    </div>
                    <div className="time-stats">
                        <div className="time-stat">
                            <span className="time-label">Avg per Problem</span>
                            <span className="time-value">{stats.avgTimePerProblem} min</span>
                        </div>
                        <div className="time-stat">
                            <span className="time-label">Longest Streak</span>
                            <span className="time-value">{stats.longestStreak} days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Report */}
            <div className="insights-card ai-report-card">
                <div className="card-header">
                    <h3>🤖 AI-Powered Insights</h3>
                    <button
                        className="generate-report-btn"
                        onClick={generateAIReport}
                        disabled={generatingReport}
                    >
                        {generatingReport ? (
                            <>
                                <span className="spinner-small"></span>
                                Generating...
                            </>
                        ) : (
                            <>✨ Generate Report</>
                        )}
                    </button>
                </div>

                {aiReport ? (
                    <div className="ai-report-content">
                        <div className="report-summary">
                            <p>{aiReport.summary}</p>
                        </div>
                        <div className="report-sections">
                            <div className="report-section achievements">
                                <h4>🏆 Achievements</h4>
                                <ul>
                                    {aiReport.achievements?.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="report-section improvements">
                                <h4>📈 Areas to Improve</h4>
                                <ul>
                                    {aiReport.improvements?.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="report-section recommendations">
                                <h4>💡 Recommendations</h4>
                                <ul>
                                    {aiReport.recommendations?.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="ai-report-placeholder">
                        <span className="placeholder-icon">🤖</span>
                        <p>Click "Generate Report" to get personalized insights powered by AI</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InsightsPage;
