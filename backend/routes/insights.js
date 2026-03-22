import express from "express";
import { query } from "../config/db.js";
import { authenticateToken } from "./auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Get user summary stats
router.get("/summary/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Get user basic stats
        const userResult = await query(
            `SELECT id, full_name, current_level, experience_points, total_points, 
                    current_streak, longest_streak, problems_solved, created_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        // Get projects count
        let projectsCount = 0;
        try {
            const projectsResult = await query(
                "SELECT COUNT(*) FROM projects WHERE user_id = $1",
                [userId]
            );
            projectsCount = parseInt(projectsResult.rows[0].count);
        } catch { projectsCount = 0; }

        // Get badges count
        let badgesCount = 0;
        try {
            const badgesResult = await query(
                "SELECT COUNT(*) FROM user_badges WHERE user_id = $1",
                [userId]
            );
            badgesCount = parseInt(badgesResult.rows[0].count);
        } catch { badgesCount = 0; }

        // Get connections count
        let connectionsCount = 0;
        try {
            const connectionsResult = await query(
                `SELECT COUNT(*) FROM connections 
                 WHERE (requester_id = $1 OR receiver_id = $1) AND status = 'accepted'`,
                [userId]
            );
            connectionsCount = parseInt(connectionsResult.rows[0].count);
        } catch { connectionsCount = 0; }

        // Calculate days since joined
        const daysSinceJoined = Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ) || 1;

        const avgXpPerDay = Math.round((user.experience_points || 0) / daysSinceJoined);

        res.json({
            totalProblems: user.problems_solved || 0,
            totalProjects: projectsCount,
            totalXP: user.experience_points || 0,
            totalPoints: user.total_points || 0,
            currentLevel: user.current_level || 1,
            currentStreak: user.current_streak || 0,
            longestStreak: user.longest_streak || user.current_streak || 0,
            badgesEarned: badgesCount,
            connections: connectionsCount,
            avgXpPerDay: avgXpPerDay,
            memberSince: user.created_at
        });

    } catch (error) {
        console.error("Error fetching insights summary:", error);
        res.status(500).json({ error: "Failed to fetch insights summary" });
    }
});

// Get activity heatmap (last 365 days)
router.get("/heatmap/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Try to get activity from problem_attempts
        let activityData = [];

        try {
            const result = await query(
                `SELECT DATE(attempted_at) as activity_date, COUNT(*) as count
                 FROM problem_attempts 
                 WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL '365 days'
                 GROUP BY DATE(attempted_at)
                 ORDER BY activity_date`,
                [userId]
            );
            activityData = result.rows;
        } catch {
            // Table might not exist
        }

        // Also try to get project uploads
        try {
            const projectResult = await query(
                `SELECT DATE(created_at) as activity_date, COUNT(*) as count
                 FROM projects 
                 WHERE user_id = $1 AND created_at > NOW() - INTERVAL '365 days'
                 GROUP BY DATE(created_at)`,
                [userId]
            );

            // Merge with existing data
            projectResult.rows.forEach(row => {
                const existing = activityData.find(a => a.activity_date === row.activity_date);
                if (existing) {
                    existing.count = parseInt(existing.count) + parseInt(row.count);
                } else {
                    activityData.push(row);
                }
            });
        } catch {
            // Table might not exist
        }

        // Generate full 365 days with counts
        const heatmapData = [];
        const today = new Date();

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const activity = activityData.find(a => {
                const actDate = new Date(a.activity_date).toISOString().split('T')[0];
                return actDate === dateStr;
            });

            heatmapData.push({
                date: dateStr,
                count: activity ? parseInt(activity.count) : 0
            });
        }

        res.json(heatmapData);

    } catch (error) {
        console.error("Error fetching heatmap data:", error);
        res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
});

// Get progress data over time
router.get("/progress/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const range = req.query.range || "30d";

        let interval, groupBy, labels;

        switch (range) {
            case "7d":
                interval = "7 days";
                groupBy = "DATE(attempted_at)";
                labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                break;
            case "90d":
                interval = "90 days";
                groupBy = "DATE_TRUNC('month', attempted_at)";
                labels = ["Month 1", "Month 2", "Month 3"];
                break;
            default: // 30d
                interval = "30 days";
                groupBy = "DATE_TRUNC('week', attempted_at)";
                labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        }

        // Get problems solved over time
        let problemsData = [];
        try {
            const result = await query(
                `SELECT ${groupBy} as period, 
                        COUNT(*) FILTER (WHERE is_correct = true) as problems_solved,
                        SUM(xp_earned) as xp_gained
                 FROM problem_attempts 
                 WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL '${interval}'
                 GROUP BY ${groupBy}
                 ORDER BY period`,
                [userId]
            );
            problemsData = result.rows;
        } catch {
            // Generate empty data
        }

        // Format for chart
        const xpData = problemsData.map(p => parseInt(p.xp_gained) || 0);
        const problemsSolvedData = problemsData.map(p => parseInt(p.problems_solved) || 0);

        // Pad arrays to match labels length
        while (xpData.length < labels.length) xpData.push(0);
        while (problemsSolvedData.length < labels.length) problemsSolvedData.push(0);

        res.json({
            labels,
            xpData: xpData.slice(0, labels.length),
            problemsData: problemsSolvedData.slice(0, labels.length)
        });

    } catch (error) {
        console.error("Error fetching progress data:", error);
        res.status(500).json({ error: "Failed to fetch progress data" });
    }
});

// Get skills radar data
router.get("/skills/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Try to get skills from user_skills table
        let skills = [];

        try {
            const result = await query(
                `SELECT skill_name, proficiency_percent as proficiency_level, problems_solved_in_skill as problems_solved
                 FROM user_skills WHERE user_id = $1
                 ORDER BY proficiency_percent DESC LIMIT 6`,
                [userId]
            );
            skills = result.rows;
        } catch {
            // Table might not exist
        }

        // If no skills data, try to derive from problem attempts
        if (skills.length === 0) {
            try {
                const result = await query(
                    `SELECT language, COUNT(*) as count
                     FROM problem_attempts 
                     WHERE user_id = $1 AND is_correct = true
                     GROUP BY language
                     ORDER BY count DESC LIMIT 6`,
                    [userId]
                );

                const maxCount = result.rows[0]?.count || 1;
                skills = result.rows.map(r => ({
                    skill_name: r.language,
                    proficiency_level: Math.round((parseInt(r.count) / maxCount) * 100),
                    problems_solved: parseInt(r.count)
                }));
            } catch {
                // Default skills
                skills = [
                    { skill_name: "JavaScript", proficiency_level: 0 },
                    { skill_name: "Python", proficiency_level: 0 },
                    { skill_name: "Java", proficiency_level: 0 },
                    { skill_name: "C++", proficiency_level: 0 },
                    { skill_name: "React", proficiency_level: 0 },
                    { skill_name: "SQL", proficiency_level: 0 }
                ];
            }
        }

        res.json({
            labels: skills.map(s => s.skill_name),
            data: skills.map(s => s.proficiency_level || 0)
        });

    } catch (error) {
        console.error("Error fetching skills data:", error);
        res.status(500).json({ error: "Failed to fetch skills data" });
    }
});

// Get time analytics
router.get("/time-analytics/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Calculate time distribution based on activity
        let problemSolvingTime = 0;
        let projectTime = 0;

        // Estimate from problem attempts (avg 20 min per problem)
        try {
            const problemsResult = await query(
                "SELECT COUNT(*) FROM problem_attempts WHERE user_id = $1",
                [userId]
            );
            problemSolvingTime = parseInt(problemsResult.rows[0].count) * 20;
        } catch { problemSolvingTime = 0; }

        // Estimate from projects (avg 120 min per project)
        try {
            const projectsResult = await query(
                "SELECT COUNT(*) FROM projects WHERE user_id = $1",
                [userId]
            );
            projectTime = parseInt(projectsResult.rows[0].count) * 120;
        } catch { projectTime = 0; }

        const learningTime = Math.round((problemSolvingTime + projectTime) * 0.3);
        const codeReviewTime = Math.round((problemSolvingTime + projectTime) * 0.1);

        const total = problemSolvingTime + projectTime + learningTime + codeReviewTime;

        res.json({
            labels: ["Problem Solving", "Projects", "Learning", "Code Review"],
            data: total > 0
                ? [
                    Math.round((problemSolvingTime / total) * 100),
                    Math.round((projectTime / total) * 100),
                    Math.round((learningTime / total) * 100),
                    Math.round((codeReviewTime / total) * 100)
                ]
                : [25, 25, 25, 25],
            totalMinutes: total,
            avgTimePerProblem: problemSolvingTime > 0 ? 20 : 0
        });

    } catch (error) {
        console.error("Error fetching time analytics:", error);
        res.status(500).json({ error: "Failed to fetch time analytics" });
    }
});

// Generate AI report using Gemini
router.get("/ai-report/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Get user stats for the report
        const userResult = await query(
            `SELECT full_name, current_level, experience_points, problems_solved, 
                    current_streak, created_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];

        // Get recent activity
        let recentProblems = 0;
        let recentXP = 0;
        try {
            const recentResult = await query(
                `SELECT COUNT(*) as count, COALESCE(SUM(xp_earned), 0) as xp
                 FROM problem_attempts 
                 WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL '7 days' AND is_correct = true`,
                [userId]
            );
            recentProblems = parseInt(recentResult.rows[0].count) || 0;
            recentXP = parseInt(recentResult.rows[0].xp) || 0;
        } catch { }

        // Get top language
        let topLanguage = "JavaScript";
        try {
            const langResult = await query(
                `SELECT language, COUNT(*) as count FROM problem_attempts 
                 WHERE user_id = $1 GROUP BY language ORDER BY count DESC LIMIT 1`,
                [userId]
            );
            if (langResult.rows.length > 0) {
                topLanguage = langResult.rows[0].language;
            }
        } catch { }

        // Generate AI report using Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Generate a personalized weekly coding progress report for a user named ${user.full_name} with these stats:
- Current Level: ${user.current_level || 1}
- Total XP: ${user.experience_points || 0}
- Problems Solved (This Week): ${recentProblems}
- XP Gained (This Week): ${recentXP}
- Current Streak: ${user.current_streak || 0} days
- Most Used Language: ${topLanguage}
- Total Problems Solved: ${user.problems_solved || 0}

Generate a JSON response with this exact structure:
{
  "summary": "2-3 sentence motivational summary of their progress",
  "achievements": ["achievement 1", "achievement 2", "achievement 3"],
  "improvements": ["area to improve 1", "area to improve 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Keep it encouraging and specific to their stats. Return ONLY valid JSON.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        let report;
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                report = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (parseError) {
            // Fallback report
            report = {
                summary: `Great progress, ${user.full_name}! You've solved ${recentProblems} problems this week and earned ${recentXP} XP. Keep up the momentum!`,
                achievements: [
                    `🔥 ${user.current_streak || 0}-day coding streak`,
                    `📈 ${recentXP} XP gained this week`,
                    `🎯 Level ${user.current_level || 1} achieved`
                ],
                improvements: [
                    "Try solving problems in different languages",
                    "Aim for at least 1 problem per day"
                ],
                recommendations: [
                    `Continue practicing ${topLanguage}`,
                    "Upload a project to showcase your skills"
                ]
            };
        }

        res.json(report);

    } catch (error) {
        console.error("Error generating AI report:", error);
        res.status(500).json({ error: "Failed to generate AI report" });
    }
});

export default router;
