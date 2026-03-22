// CreateContest.jsx - Create New Contest Page
import React, { useState, useEffect } from "react";
import "../App.css";
import { getCurrentUser } from "../services/api";

function CreateContest({ setPage }) {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === "Admin";
    const [loading, setLoading] = useState(false);
    const [generatingProblems, setGeneratingProblems] = useState(false);
    const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
    const [cardStatus, setCardStatus] = useState(null);
    const [cardLoading, setCardLoading] = useState(true); // start true to avoid lock flash
    const [friends, setFriends] = useState([]);
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Problems, 3: Review

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        duration: 90,
        visibility: "PUBLIC",
        problemCount: 5,
        difficultyMix: "1-easy,3-medium,1-hard",
        problemTypes: ["DSA"],
        languages: ["JavaScript", "Python"],
        invitedFriends: []
    });

    const [generatedProblems, setGeneratedProblems] = useState([]);
    const [error, setError] = useState("");

    const problemTypeOptions = [
        "DSA", "Array", "String", "Dynamic Programming", "Graph",
        "Tree", "Sorting", "Searching", "Math", "Recursion"
    ];

    const languageOptions = ["JavaScript", "Python", "C++", "Java"];

    const difficultyMixOptions = [
        // 5 problems
        { value: "2-easy,2-medium,1-hard", label: "Balanced â¸º 2E 2M 1H", count: 5 },
        { value: "3-easy,2-medium", label: "Beginner Friendly â¸º 3E 2M", count: 5 },
        { value: "1-easy,2-medium,2-hard", label: "Challenge Mode â¸º 1E 2M 2H", count: 5 },
        { value: "5-medium", label: "All Medium â¸º 5M", count: 5 },
        { value: "3-medium,2-hard", label: "Advanced â¸º 3M 2H", count: 5 },
        // 6 problems
        { value: "2-easy,3-medium,1-hard", label: "Balanced â¸º 2E 3M 1H", count: 6 },
        { value: "3-easy,2-medium,1-hard", label: "Beginner Friendly â¸º 3E 2M 1H", count: 6 },
        { value: "2-easy,2-medium,2-hard", label: "Challenge Mode â¸º 2E 2M 2H", count: 6 },
        { value: "6-medium", label: "All Medium â¸º 6M", count: 6 },
        { value: "3-medium,3-hard", label: "Advanced â¸º 3M 3H", count: 6 },
        // 7 problems
        { value: "3-easy,3-medium,1-hard", label: "Balanced â¸º 3E 3M 1H", count: 7 },
        { value: "4-easy,2-medium,1-hard", label: "Beginner Friendly â¸º 4E 2M 1H", count: 7 },
        { value: "2-easy,3-medium,2-hard", label: "Challenge Mode â¸º 2E 3M 2H", count: 7 },
        { value: "7-medium", label: "All Medium â¸º 7M", count: 7 },
        { value: "3-medium,4-hard", label: "Advanced â¸º 3M 4H", count: 7 },
    ];

    // Count presets: pick count â†’ auto-select first matching difficultyMix
    const handleCountSelect = (count) => {
        const match = difficultyMixOptions.find(o => o.count === count);
        if (match) {
            setFormData(prev => ({ ...prev, problemCount: count, difficultyMix: match.value }));
        }
    };


    useEffect(() => {
        checkCardStatus();
        fetchFriends();

        // Set default date/time (tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        setFormData(prev => ({
            ...prev,
            startDate: tomorrow.toISOString().split("T")[0],
            startTime: "14:00"
        }));
    }, []);

    const checkCardStatus = async () => {
        try {
            const res = await fetch(`http://localhost:4000/api/contests/check-card/${currentUser?.id}`);
            const data = await res.json();
            setCardStatus(data);
        } catch (err) {
            console.error("Failed to check card:", err);
            // If check fails, let admin through anyway
            if (isAdmin) {
                setCardStatus({ hasActiveCard: true, isAdmin: true, eligible: true });
            }
        } finally {
            setCardLoading(false);
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await fetch(`http://localhost:4000/api/connections?userId=${currentUser?.id}&type=friends`);
            const data = await res.json();
            if (data.connections) {
                setFriends(data.connections);
            }
        } catch (err) {
            console.error("Failed to fetch friends:", err);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleProblemType = (type) => {
        setFormData(prev => {
            const types = prev.problemTypes.includes(type)
                ? prev.problemTypes.filter(t => t !== type)
                : [...prev.problemTypes, type];
            return { ...prev, problemTypes: types.length ? types : ["DSA"] };
        });
    };

    const toggleLanguage = (lang) => {
        setFormData(prev => {
            const langs = prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang];
            return { ...prev, languages: langs.length ? langs : ["JavaScript"] };
        });
    };

    const toggleFriend = (friendId) => {
        setFormData(prev => {
            const invited = prev.invitedFriends.includes(friendId)
                ? prev.invitedFriends.filter(id => id !== friendId)
                : [...prev.invitedFriends, friendId];
            return { ...prev, invitedFriends: invited };
        });
    };

    const generateProblems = async () => {
        setGeneratingProblems(true);
        setError("");

        try {
            // Parse difficulty mix
            const diffParts = formData.difficultyMix.split(",");
            const problems = [];

            // Count total problems to generate
            let totalCount = 0;
            const plan = [];
            for (const part of diffParts) {
                const [count, difficulty] = part.trim().split("-");
                const numCount = parseInt(count);
                totalCount += numCount;
                for (let i = 0; i < numCount; i++) {
                    plan.push(difficulty);
                }
            }

            setGenProgress({ current: 0, total: totalCount });

            for (let i = 0; i < plan.length; i++) {
                const difficulty = plan[i];
                const randomType = formData.problemTypes[
                    Math.floor(Math.random() * formData.problemTypes.length)
                ];

                // Retry up to 2 times on rate limit
                let data = null;
                let lastErr = null;
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        if (i > 0 || attempt > 0) {
                            // Small delay to avoid Gemini rate limits
                            await new Promise(r => setTimeout(r, attempt > 0 ? 3000 : 1200));
                        }
                        const res = await fetch("http://localhost:4000/api/problem-generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                                language: formData.languages[0],
                                problemType: randomType
                            })
                        });
                        const json = await res.json();
                        if (json.title) {
                            data = json;
                            break;
                        }
                        lastErr = json.error || "No title returned";
                    } catch (e) {
                        lastErr = e.message;
                    }
                }

                if (data?.title) {
                    problems.push({
                        title: data.title,
                        description: data.description,
                        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                        problem_type: randomType,
                        examples: data.examples || [],
                        constraints: data.constraints || [],
                        points: difficulty === "easy" ? 100 : difficulty === "medium" ? 200 : 300,
                        order_index: problems.length
                    });
                } else {
                    console.warn(`Problem ${i + 1} generation failed: ${lastErr}`);
                    // Still proceed â€” skip this problem rather than abort everything
                }

                setGenProgress({ current: i + 1, total: totalCount });
            }

            if (problems.length === 0) {
                throw new Error("No problems were generated. The AI service may be temporarily unavailable. Please try again.");
            }

            setGeneratedProblems(problems);
            setStep(2);
        } catch (err) {
            console.error("Failed to generate problems:", err);
            setError(err.message || "Failed to generate problems. Please try again.");
        } finally {
            setGeneratingProblems(false);
            setGenProgress({ current: 0, total: 0 });
        }
    };


    const createContest = async () => {

        setLoading(true);
        setError("");

        try {

            // Combine date and time
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

            const contestData = {
                userId: currentUser.id,
                title: formData.title,
                description: formData.description,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                visibility: formData.visibility,
                difficultyMix: formData.difficultyMix,
                problemTypes: formData.problemTypes,
                languages: formData.languages,
                problemCount: formData.problemCount,
                invitedFriends: formData.invitedFriends
            };

            const token = localStorage.getItem("token");

            // Create contest
            const res = await fetch("http://localhost:4000/api/contests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(contestData)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create contest");
            }

            // Add problems to contest
            for (const problem of generatedProblems) {

                const pRes = await fetch(`http://localhost:4000/api/contests/${data.contest.id}/problems`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    },
                    body: JSON.stringify({
                        ...problem,
                        test_cases: problem.examples?.map(ex => ({
                            input: ex.input,
                            output: ex.output,
                            is_hidden: false
                        })) || []
                    })
                });
                const pData = await pRes.json();
                if (!pRes.ok) {
                    console.warn("Problem add warning:", pData.error);
                }
            }

            alert("ðŸŽ‰ Contest created successfully!");
            setPage("contests");
        } catch (err) {
            console.error("Failed to create contest:", err);
            setError(err.message || "Failed to create contest. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const canCreateContest = () => {
        // Admin can always create; others need a card
        if (isAdmin) return true;
        return cardStatus?.hasActiveCard === true;
    };

    // Show loading spinner while checking card status (prevents the lock screen flickering for admins)
    if (cardLoading) {
        return (
            <div className="create-contest-page">
                <div className="no-card-message">
                    <span className="lock-icon" style={{ fontSize: '2rem' }}>â³</span>
                    <h2>Loading...</h2>
                    <p>Checking access permissions...</p>
                </div>
            </div>
        );
    }

    const renderStep1 = () => (
        <div className="create-contest-step">
            <h2 className="step-title">
                <span className="step-number">1</span>
                Contest Details
            </h2>

            <div className="form-group">
                <label>Contest Title *</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Weekly Code Challenge #42"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Welcome to this week's coding challenge! Test your skills..."
                    className="form-textarea"
                    rows={3}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Start Date *</label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Start Time *</label>
                    <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Duration (minutes)</label>
                    <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                        className="form-select"
                    >
                        <option value={60}>60 min (1 hour)</option>
                        <option value={90}>90 min (1.5 hours)</option>
                        <option value={120}>120 min (2 hours)</option>
                        <option value={150}>150 min (2.5 hours)</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Visibility</label>
                <div className="visibility-options">
                    <button
                        className={`visibility-btn ${formData.visibility === "PUBLIC" ? "active" : ""}`}
                        onClick={() => handleInputChange("visibility", "PUBLIC")}
                    >
                        <span className="vis-icon">ðŸŒ</span>
                        <span className="vis-label">Global</span>
                        <span className="vis-desc">Anyone can join</span>
                    </button>
                    <button
                        className={`visibility-btn ${formData.visibility === "PRIVATE" ? "active" : ""}`}
                        onClick={() => handleInputChange("visibility", "PRIVATE")}
                    >
                        <span className="vis-icon">ðŸ‘¥</span>
                        <span className="vis-label">Friends Only</span>
                        <span className="vis-desc">Invite-only contest</span>
                    </button>
                </div>
            </div>

            {/* Friends Selection for Private Contest */}
            {formData.visibility === "PRIVATE" && friends.length > 0 && (
                <div className="form-group">
                    <label>Invite Friends ({formData.invitedFriends.length} selected)</label>
                    <div className="friends-grid">
                        {friends.map(friend => (
                            <button
                                key={friend.id}
                                className={`friend-chip ${formData.invitedFriends.includes(friend.id) ? "selected" : ""}`}
                                onClick={() => toggleFriend(friend.id)}
                            >
                                <span className="friend-avatar">
                                    {friend.full_name?.charAt(0) || "?"}
                                </span>
                                <span className="friend-name">{friend.full_name}</span>
                                {formData.invitedFriends.includes(friend.id) && (
                                    <span className="check-icon">âœ“</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* ADMIN-ONLY: Number of AI Problems to Generate */}
            {isAdmin && (
                <div className="form-group">
                    <label>Number of Problems <span className="admin-only-badge">Admin</span></label>
                    <div className="problem-count-row">
                        {[5, 6, 7].map(n => (
                            <button
                                key={n}
                                className={`count-btn ${formData.problemCount === n ? 'active' : ''}`}
                                onClick={() => handleCountSelect(n)}
                            >
                                {n} Problems
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-group">
                <label>Difficulty Mix</label>
                <select
                    value={formData.difficultyMix}
                    onChange={(e) => handleInputChange("difficultyMix", e.target.value)}
                    className="form-select"
                >
                    {difficultyMixOptions
                        .filter(opt => !isAdmin || opt.count === formData.problemCount)
                        .map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                </select>
            </div>

            <div className="form-group">
                <label>Problem Types</label>
                <div className="tags-grid">
                    {problemTypeOptions.map(type => (
                        <button
                            key={type}
                            className={`tag-btn ${formData.problemTypes.includes(type) ? "active" : ""}`}
                            onClick={() => toggleProblemType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Allowed Languages</label>
                <div className="tags-grid">
                    {languageOptions.map(lang => (
                        <button
                            key={lang}
                            className={`tag-btn ${formData.languages.includes(lang) ? "active" : ""}`}
                            onClick={() => toggleLanguage(lang)}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <div className="step-actions">
                <button className="secondary-btn" onClick={() => setPage("contests")}>
                    Cancel
                </button>
                <button
                    className="primary-btn"
                    onClick={generateProblems}
                    disabled={!formData.title || !formData.startDate || generatingProblems}
                >
                    {generatingProblems ? (
                        <>
                            <span className="btn-spinner"></span>
                            {genProgress.total > 0
                                ? `Generating ${genProgress.current}/${genProgress.total}...`
                                : "Starting..."}
                        </>
                    ) : (
                        <>Generate {formData.problemCount} Problems <span>→</span></>
                    )}
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="create-contest-step">
            <h2 className="step-title">
                <span className="step-number">2</span>
                Review Generated Problems
            </h2>

            <div className="generated-problems-list">
                {generatedProblems.map((problem, index) => (
                    <div key={index} className="generated-problem-card">
                        <div className="problem-header">
                            <span className="problem-index">#{index + 1}</span>
                            <h3 className="problem-title">{problem.title}</h3>
                            <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                                {problem.difficulty}
                            </span>
                            <span className="points-badge">{problem.points} pts</span>
                        </div>
                        <p className="problem-description">{problem.description?.substring(0, 200)}...</p>
                        <div className="problem-meta">
                            <span className="meta-tag">{problem.problem_type}</span>
                            <span className="meta-tag">{problem.examples?.length || 0} examples</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="step-actions">
                <button className="secondary-btn" onClick={() => setStep(1)}>
                    <span>←</span> Back
                </button>
                <button
                    className="regenerate-btn"
                    onClick={generateProblems}
                    disabled={generatingProblems}
                >
                    {generatingProblems ? "Regenerating..." : "🔄 Regenerate All"}
                </button>
                <button className="primary-btn" onClick={() => setStep(3)}>
                    Continue to Review <span>→</span>
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="create-contest-step">
            <h2 className="step-title">
                <span className="step-number">3</span>
                Final Review
            </h2>

            <div className="review-summary">
                <div className="summary-card">
                    <h3>Contest Details</h3>
                    <div className="summary-item">
                        <span className="summary-label">Title:</span>
                        <span className="summary-value">{formData.title}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Start:</span>
                        <span className="summary-value">
                            {new Date(`${formData.startDate}T${formData.startTime}`).toLocaleString()}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Duration:</span>
                        <span className="summary-value">{formData.duration} minutes</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Visibility:</span>
                        <span className="summary-value">
                            {formData.visibility === "PUBLIC" ? "🌍 Global" : "👥 Friends Only"}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Problems:</span>
                        <span className="summary-value">{generatedProblems.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Languages:</span>
                        <span className="summary-value">{formData.languages.join(", ")}</span>
                    </div>
                </div>

                <div className="summary-card">
                    <h3>Problems Summary</h3>
                    {generatedProblems.map((p, i) => (
                        <div key={i} className="problem-summary-row">
                            <span className="ps-index">#{i + 1}</span>
                            <span className="ps-title">{p.title}</span>
                            <span className={`ps-diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                            <span className="ps-points">{p.points} pts</span>
                        </div>
                    ))}
                    <div className="total-points">
                        Total: {generatedProblems.reduce((sum, p) => sum + p.points, 0)} points
                    </div>
                </div>
            </div>

            <div className="step-actions">
                <button className="secondary-btn" onClick={() => setStep(2)}>
                    <span>←</span> Back
                </button>
                <button
                    className="create-btn"
                    onClick={createContest}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Creating Contest...
                        </>
                    ) : (
                        <>
                            <span>🏆</span> Create Contest
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    if (!canCreateContest()) {
        return (
            <div className="create-contest-page">
                <div className="no-card-message">
                    <span className="lock-icon">🔒</span>
                    <h2>Contest Creation Card Required</h2>
                    <p>You need an active Contest Creation Card to create contests.</p>
                    <div className="requirements-box">
                        <h4>How to get a Creation Card:</h4>
                        <ul>
                            <li>✅ Solve 20+ medium-level problems</li>
                            <li>✅ Reach Silver level or higher</li>
                        </ul>
                    </div>
                    <button className="back-btn" onClick={() => setPage("contests")}>
                        ← Back to Contests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="create-contest-page">
            {/* Header */}
            <div className="create-contest-header">
                <button className="back-btn" onClick={() => setPage("contests")}>
                    <span>←</span> Back to Contests
                </button>
                <h1 className="page-title">
                    <span>🏆</span> Create New Contest
                </h1>
                {cardStatus?.hasActiveCard && (
                    <div className="card-info-badge">
                        <span>🎴</span>
                        Card expires: {new Date(cardStatus.expiresAt).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
                <div className={`progress-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                    <span className="step-circle">1</span>
                    <span className="step-label">Details</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
                    <span className="step-circle">2</span>
                    <span className="step-label">Problems</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
                    <span className="step-circle">3</span>
                    <span className="step-label">Review</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Step Content */}
            <div className="step-content">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
}

export default CreateContest;
