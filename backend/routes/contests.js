import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Check if user is eligible for Contest Creation Card
async function checkCardEligibility(userId) {
    try {
        const result = await query(
            `SELECT 
                current_level,
                medium_problems_solved,
                has_creation_card,
                card_expires_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return { eligible: false, reason: "User not found" };
        }

        const user = result.rows[0];
        const levelHierarchy = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
        const userLevelIndex = levelHierarchy.indexOf(user.current_level);
        const silverIndex = levelHierarchy.indexOf('Silver');

        // Check if already has active card
        if (user.has_creation_card && user.card_expires_at && new Date(user.card_expires_at) > new Date()) {
            return {
                eligible: true,
                hasActiveCard: true,
                expiresAt: user.card_expires_at,
                reason: "Already has active Contest Creation Card"
            };
        }

        // Check eligibility: 20+ medium problems AND Silver+ level
        const mediumSolved = user.medium_problems_solved || 0;
        const hasEnoughProblems = mediumSolved >= 20;
        const hasRequiredLevel = userLevelIndex >= silverIndex;

        if (hasEnoughProblems && hasRequiredLevel) {
            // Determine card validity based on level
            const isPlatinum = user.current_level === 'Platinum' || user.current_level === 'Diamond';
            const validityHours = isPlatinum ? 24 : 6;

            return {
                eligible: true,
                hasActiveCard: false,
                levelMet: true,
                validityHours,
                userLevel: user.current_level,
                mediumSolved,
                reason: `Eligible for ${validityHours}-hour Contest Creation Card`
            };
        }

        return {
            eligible: false,
            hasActiveCard: false,
            levelMet: hasRequiredLevel,
            mediumSolved,
            userLevel: user.current_level,
            requiredProblems: 20,
            requiredLevel: 'Silver',
            reason: `Need ${Math.max(0, 20 - mediumSolved)} more medium problems and ${hasRequiredLevel ? '' : 'Silver level'}`
        };

    } catch (error) {
        console.error("Error checking card eligibility:", error);
        return { eligible: false, reason: "Error checking eligibility" };
    }
}

// Update contest status based on time
async function updateContestStatuses() {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

        // 1. Move UPCOMING to LIVE
        const newlyLiveResult = await query(
            `UPDATE contests 
             SET status = 'LIVE', updated_at = NOW() 
             WHERE status = 'UPCOMING' AND start_time <= $1
             RETURNING id, title`,
            [now]
        );

        // Notify participants of contests starting now
        for (const c of newlyLiveResult.rows) {
            const participants = await query(`SELECT user_id FROM contest_participants WHERE contest_id = $1`, [c.id]);
            for (const p of participants.rows) {
                await createContestNotification(p.user_id, c.id, 'CONTEST_STARTED',
                    'Contest Started!', `"${c.title}" is now LIVE. Good luck!`);
            }
        }

        // 2. Move LIVE to FINISHED
        const newlyFinishedResult = await query(
            `UPDATE contests 
             SET status = 'FINISHED', updated_at = NOW() 
             WHERE status = 'LIVE' AND end_time <= $1
             RETURNING id, title`,
            [now]
        );

        // Process results for finished contests
        for (const c of newlyFinishedResult.rows) {
            await processContestResults(c.id);
        }

        // 3. Expire old creation cards
        await query(
            `UPDATE users 
             SET has_creation_card = false 
             WHERE has_creation_card = true AND card_expires_at <= $1`,
            [now]
        );

        // 4. Handle Reminders (1 Hour)
        const upcomingOneHour = await query(
            `SELECT c.id, c.title, cp.user_id 
             FROM contests c
             JOIN contest_participants cp ON c.id = cp.contest_id
             WHERE c.status = 'UPCOMING' 
             AND c.start_time <= $1 
             AND NOT EXISTS (
                 SELECT 1 FROM contest_notifications 
                 WHERE contest_id = c.id AND user_id = cp.user_id AND notification_type = 'CONTEST_REMINDER_1H'
             )`,
            [oneHourLater]
        );

        for (const row of upcomingOneHour.rows) {
            await createContestNotification(row.user_id, row.id, 'CONTEST_REMINDER_1H',
                'Contest Reminder', `"${row.title}" starts in 1 hour!`);
        }

        // 5. Handle Reminders (15 Mins)
        const upcomingFifteenMins = await query(
            `SELECT c.id, c.title, cp.user_id 
             FROM contests c
             JOIN contest_participants cp ON c.id = cp.contest_id
             WHERE c.status = 'UPCOMING' 
             AND c.start_time <= $1 
             AND NOT EXISTS (
                 SELECT 1 FROM contest_notifications 
                 WHERE contest_id = c.id AND user_id = cp.user_id AND notification_type = 'CONTEST_REMINDER_15M'
             )`,
            [fifteenMinsLater]
        );

        for (const row of upcomingFifteenMins.rows) {
            await createContestNotification(row.user_id, row.id, 'CONTEST_REMINDER_15M',
                'Contest Ready!', `"${row.title}" starts in 15 minutes. Prepare yourself!`);
        }

    } catch (error) {
        console.error("Error updating contest statuses:", error);
    }
}

// Run every minute
setInterval(updateContestStatuses, 60000);
// Run once on startup
updateContestStatuses();

// Add internal notification and push to general notifications
async function createContestNotification(userId, contestId, type, title, message) {
    try {
        // 1. Log in contest_notifications (for tracking)
        await query(
            `INSERT INTO contest_notifications (user_id, contest_id, notification_type, title, message)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, contestId, type, title, message]
        );

        // 2. Push to main notifications table (for UI)
        await query(
            `INSERT INTO notifications (user_id, type, title, message, related_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'contest', title, message, contestId]
        );
    } catch (error) {
        console.error("Error creating contest notification:", error);
    }
}

// Award a contest badge
async function awardContestBadge(userId, contestId, badgeType, badgeName, badgeIcon, badgeColor, description) {
    try {
        // Check if user already has this badge for this contest
        const existing = await query(
            `SELECT id FROM contest_badges 
             WHERE user_id = $1 AND contest_id = $2 AND badge_type = $3`,
            [userId, contestId, badgeType]
        );

        if (existing.rows.length === 0) {
            await query(
                `INSERT INTO contest_badges (user_id, contest_id, badge_type, badge_name, badge_icon, badge_color, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, contestId, badgeType, badgeName, badgeIcon, badgeColor, description]
            );

            // Also create a notification
            await createContestNotification(userId, contestId, 'BADGE_EARNED',
                '🏆 New Badge!', `You earned the "${badgeName}" badge in the contest!`);
        }
    } catch (error) {
        console.error("Error awarding contest badge:", error);
    }
}

// Process contest results when it ends
async function processContestResults(contestId) {
    try {
        console.log(`🏁 Processing results for contest ${contestId}...`);

        // 1. Get leaderboard
        const leaderboardRows = await query(
            `SELECT cp.user_id, cp.total_score, cp.problems_solved, cp.penalty_time, u.full_name
             FROM contest_participants cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.contest_id = $1
             ORDER BY cp.total_score DESC, cp.penalty_time ASC`,
            [contestId]
        );

        if (leaderboardRows.rows.length === 0) return;

        const participants = leaderboardRows.rows;
        const problemsCountResult = await query(`SELECT COUNT(*) FROM contest_problems WHERE contest_id = $1`, [contestId]);
        const totalProblems = parseInt(problemsCountResult.rows[0].count);

        // 2. Award Winners and Podium
        for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            const rank = i + 1;

            // Set final rank
            await query(`UPDATE contest_participants SET final_rank = $1 WHERE contest_id = $2 AND user_id = $3`, [rank, contestId, p.user_id]);

            // Winner (1st)
            if (rank === 1 && p.total_score > 0) {
                await awardContestBadge(p.user_id, contestId, 'CONTEST_WINNER', 'Contest Champion', '🏆', '#FFD700', 'First place in contest!');
                await query('UPDATE users SET contests_won = COALESCE(contests_won, 0) + 1 WHERE id = $1', [p.user_id]);
            }

            // Podium (Top 3)
            if (rank <= 3 && p.total_score > 0) {
                const icon = rank === 2 ? '🥈' : '🥉';
                const color = rank === 2 ? '#C0C0C0' : '#CD7F32';
                await awardContestBadge(p.user_id, contestId, 'CONTEST_PODIUM', 'Podium Finisher', icon, color, `Top 3 finish (#${rank})`);
            }

            // Perfect Score
            if (parseInt(p.problems_solved) === totalProblems && totalProblems > 0) {
                await awardContestBadge(p.user_id, contestId, 'PERFECT_SCORE', 'Perfect Score', '💯', '#FF4500', 'Solved all problems in the contest!');
            }

            // Update user global stats
            await query(`
                UPDATE users SET 
                    contests_participated = COALESCE(contests_participated, 0) + 1,
                    best_contest_rank = LEAST(COALESCE(best_contest_rank, 999999), $1)
                WHERE id = $2
            `, [rank, p.user_id]);
        }

        // 3. Notify all participants
        for (const p of participants) {
            await createContestNotification(p.user_id, contestId, 'CONTEST_ENDED', 'Contest Ended', 'Results are now available on the leaderboard!');
        }

    } catch (error) {
        console.error("Error processing contest results:", error);
    }
}

// =====================================================
// CONTEST ENDPOINTS
// =====================================================

// GET /api/contests - List all contests
router.get("/", async (req, res) => {
    try {
        await updateContestStatuses(); // Update statuses first

        const { status, type, limit = 20, offset = 0 } = req.query;

        let queryStr = `
            SELECT 
                c.*,
                u.full_name as creator_name,
                u.current_level as creator_level,
                (SELECT COUNT(*) FROM contest_participants cp WHERE cp.contest_id = c.id) as participant_count,
                (SELECT COUNT(*) FROM contest_problems cp WHERE cp.contest_id = c.id) as problem_count
            FROM contests c
            LEFT JOIN users u ON c.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            queryStr += ` AND c.status = $${paramIndex++}`;
            params.push(status);
        }

        if (type) {
            queryStr += ` AND c.contest_type = $${paramIndex++}`;
            params.push(type);
        }

        queryStr += ` ORDER BY 
            CASE c.status 
                WHEN 'LIVE' THEN 1 
                WHEN 'UPCOMING' THEN 2 
                WHEN 'FINISHED' THEN 3 
            END,
            c.start_time DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(queryStr, params);

        res.json({
            success: true,
            contests: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).json({ error: "Failed to fetch contests" });
    }
});

// =====================================================
// CARD ROUTES - MUST BE BEFORE /:id to avoid routing conflict
// =====================================================

// GET /api/contests/check-card/:userId - Check if user can get/has Creation Card
router.get("/check-card/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if this user is an admin — admins bypass card requirement entirely
        const userResult = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length > 0 && userResult.rows[0].role === 'Admin') {
            return res.json({
                eligible: true,
                hasActiveCard: true,
                isAdmin: true,
                reason: "Admin users can always create contests"
            });
        }

        const eligibility = await checkCardEligibility(userId);
        res.json({ ...eligibility, isAdmin: false });
    } catch (error) {
        console.error("Error checking card:", error);
        res.status(500).json({ error: "Failed to check card eligibility" });
    }
});

// POST /api/contests/claim-card - Claim Contest Creation Card
router.post("/claim-card", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }

        const eligibility = await checkCardEligibility(userId);

        if (!eligibility.eligible) {
            return res.status(400).json({
                error: "Not eligible for Contest Creation Card",
                details: eligibility
            });
        }

        if (eligibility.hasActiveCard) {
            return res.json({
                success: true,
                message: "You already have an active card!",
                expiresAt: eligibility.expiresAt
            });
        }

        // Calculate expiry
        const now = new Date();
        const expiresAt = new Date(now.getTime() + eligibility.validityHours * 60 * 60 * 1000);

        // Grant the card
        await query(
            `UPDATE users 
             SET has_creation_card = true, 
                 card_expires_at = $1,
                 problems_solved_at_last_card = problems_solved
             WHERE id = $2`,
            [expiresAt, userId]
        );

        // Log the card grant
        await query(
            `INSERT INTO contest_creation_cards (user_id, expires_at, validity_hours, user_level, earned_reason)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, expiresAt, eligibility.validityHours, eligibility.userLevel,
                `Earned by solving ${eligibility.mediumSolved} medium problems with ${eligibility.userLevel} level`]
        );

        res.json({
            success: true,
            message: `🎉 Congratulations! You've earned a Contest Creation Card!`,
            card: {
                validityHours: eligibility.validityHours,
                expiresAt,
                userLevel: eligibility.userLevel
            }
        });

    } catch (error) {
        console.error("Error claiming card:", error);
        res.status(500).json({ error: "Failed to claim card" });
    }
});

// GET /api/contests/:id - Get single contest details
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let userId = req.query.userId;
        if (userId === "undefined" || userId === "null") userId = null;

        const contestResult = await query(
            `SELECT 
                c.*,
                u.full_name as creator_name,
                u.current_level as creator_level
             FROM contests c
             LEFT JOIN users u ON c.created_by = u.id
             WHERE c.id = $1`,
            [id]
        );

        if (contestResult.rows.length === 0) {
            return res.status(404).json({ error: "Contest not found" });
        }

        const contest = contestResult.rows[0];

        // Check if user is registered or admin (for problem visibility)
        let isRegistered = false;
        let userStats = null;
        let isUserAdmin = false;

        if (userId) {
            const participantResult = await query(
                `SELECT * FROM contest_participants WHERE contest_id = $1 AND user_id = $2`,
                [id, userId]
            );
            isRegistered = participantResult.rows.length > 0;
            userStats = participantResult.rows[0] || null;

            // Check if user is admin
            const userRoleRes = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
            isUserAdmin = userRoleRes.rows[0]?.role === 'Admin';
        }

        // Get problems — show full details if: LIVE, FINISHED, registered user, or admin
        const showFullDetails = contest.status === 'LIVE' || contest.status === 'FINISHED' || isRegistered || isUserAdmin;

        let problemsQuery;
        if (showFullDetails) {
            problemsQuery = `
                SELECT id, title, description, difficulty, problem_type, points, examples, constraints, test_cases, code_templates,
                       time_limit_ms, memory_limit_kb, order_index, solve_count, attempt_count, hints
                FROM contest_problems
                WHERE contest_id = $1
                ORDER BY order_index
            `;
        } else {
            // Public view — hide problem details
            problemsQuery = `
                SELECT id, title, difficulty, points, order_index, solve_count, attempt_count
                FROM contest_problems
                WHERE contest_id = $1
                ORDER BY order_index
            `;
        }


        const problemsResult = await query(problemsQuery, [id]);

        // Get participant count
        const countResult = await query(
            `SELECT COUNT(*) as count FROM contest_participants WHERE contest_id = $1`,
            [id]
        );

        res.json({
            success: true,
            contest: {
                ...contest,
                problems: problemsResult.rows,
                participantCount: parseInt(countResult.rows[0].count),
                isRegistered,
                userStats
            }
        });


    } catch (error) {
        console.error("Error fetching contest:", error.stack);
        res.status(500).json({ error: "Failed to fetch contest" });
    }
});

// POST /api/contests - Create new contest
router.post("/", async (req, res) => {
    try {
        const {
            userId,
            title,
            description,
            startTime,
            endTime,
            contestType = 'ADMIN', // ADMIN or USER
            visibility = 'PUBLIC', // PUBLIC or PRIVATE
            difficultyMix,
            problemTypes,
            languages,
            problemCount = 5,
            invitedFriends = []
        } = req.body;

        if (!userId || !title || !startTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if user can create contest
        const userResult = await query(
            `SELECT role, current_level, has_creation_card, card_expires_at FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];
        const isAdmin = user.role === 'Admin';

        // Non-admin users need active Creation Card
        if (!isAdmin) {
            if (!user.has_creation_card || !user.card_expires_at || new Date(user.card_expires_at) <= new Date()) {
                return res.status(403).json({
                    error: "You need an active Contest Creation Card to create contests",
                    canEarnCard: true
                });
            }
        }

        // Calculate end time if not provided (default 90 minutes)
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date(start.getTime() + 90 * 60000);

        // Create contest
        const contestResult = await query(
            `INSERT INTO contests (
                title, description, start_time, end_time, duration_minutes,
                contest_type, visibility, created_by, 
                difficulty_mix, problem_types, languages, problem_count
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                title, description, start, end,
                Math.round((end - start) / 60000),
                isAdmin ? 'ADMIN' : 'USER',
                visibility,
                userId,
                difficultyMix,
                problemTypes || ['DSA'],
                languages || ['JavaScript', 'Python'],
                problemCount
            ]
        );

        const contest = contestResult.rows[0];

        // If USER contest, mark card as used (but don't invalidate - can create multiple in validity period)
        if (!isAdmin) {
            await query(
                `INSERT INTO contest_creation_cards (user_id, earned_at, expires_at, validity_hours, user_level, used_for_contest_id)
                 VALUES ($1, NOW(), $2, $3, $4, $5)`,
                [userId, user.card_expires_at, user.current_level === 'Platinum' ? 24 : 6, user.current_level, contest.id]
            );
        }

        // Auto-register creator
        await query(
            `INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2)`,
            [contest.id, userId]
        );

        // If private contest, create invitations
        if (visibility === 'PRIVATE' && invitedFriends.length > 0) {
            for (const friendId of invitedFriends) {
                await query(
                    `INSERT INTO contest_invitations (contest_id, invited_user_id, invited_by)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [contest.id, friendId, userId]
                );
            }
        }

        // Award badge for creating contest
        const badgeType = isAdmin ? 'CONTEST_CREATOR' : 'COMMUNITY_CREATOR';
        await query(
            `INSERT INTO contest_badges (user_id, badge_type, badge_name, badge_icon, contest_id, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, badgeType, isAdmin ? 'Official Contest Creator' : 'Community Contest Creator',
                isAdmin ? '🏆' : '🌟', contest.id, `Created contest: ${title}`]
        );

        res.json({
            success: true,
            contest,
            message: "Contest created successfully!"
        });

    } catch (error) {
        console.error("Error creating contest:", error);
        res.status(500).json({ error: "Failed to create contest" });
    }
});

// POST /api/contests/:id/register - Register for contest
router.post("/:id/register", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }

        // Check if contest exists and is open for registration
        const contestResult = await query(
            `SELECT * FROM contests WHERE id = $1`,
            [id]
        );

        if (contestResult.rows.length === 0) {
            return res.status(404).json({ error: "Contest not found" });
        }

        const contest = contestResult.rows[0];

        if (contest.status === 'FINISHED') {
            return res.status(400).json({ error: "This contest has already ended" });
        }

        // Allow users to join private contests without strict invitation check (as requested)
        if (contest.visibility === 'PRIVATE') {
            // Check if they have an invitation to mark it as accepted later
            const inviteResult = await query(
                `SELECT * FROM contest_invitations 
                 WHERE contest_id = $1 AND invited_user_id = $2`,
                [id, userId]
            );
            // No longer blocking registration if invite is missing
        }

        // Register user
        const result = await query(
            `INSERT INTO contest_participants (contest_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (contest_id, user_id) DO NOTHING
             RETURNING *`,
            [id, userId]
        );

        // Update registered count
        await query(
            `UPDATE contests SET registered_count = registered_count + 1 WHERE id = $1`,
            [id]
        );

        // If invited, mark invitation as accepted
        await query(
            `UPDATE contest_invitations 
             SET status = 'ACCEPTED', responded_at = NOW()
             WHERE contest_id = $1 AND invited_user_id = $2`,
            [id, userId]
        );

        res.json({
            success: true,
            message: "Successfully registered for contest!",
            participant: result.rows[0]
        });

    } catch (error) {
        console.error("Error registering for contest:", error);
        res.status(500).json({ error: "Failed to register" });
    }
});

// GET /api/contests/:id/leaderboard - Get contest leaderboard
router.get("/:id/leaderboard", async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        const result = await query(
            `SELECT 
                cp.user_id,
                u.full_name,
                u.email,
                u.current_level,
                cp.total_score,
                cp.problems_solved,
                cp.penalty_time,
                cp.first_submission_at,
                cp.last_submission_at,
                RANK() OVER (ORDER BY cp.total_score DESC, cp.penalty_time ASC) as rank
             FROM contest_participants cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.contest_id = $1
             ORDER BY rank
             LIMIT $2`,
            [id, parseInt(limit)]
        );

        res.json({
            success: true,
            leaderboard: result.rows
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// Note: check-card and claim-card routes have been moved ABOVE /:id to prevent routing conflicts.

// POST /api/contests/:id/problems - Add problems to a contest
router.post("/:id/problems", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, problem_type, examples, constraints, points, order_index, test_cases } = req.body;

        const result = await query(
            `INSERT INTO contest_problems 
             (contest_id, title, description, difficulty, problem_type, examples, constraints, test_cases, points, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [id, title, description, difficulty, problem_type,
                JSON.stringify(examples || []),
                JSON.stringify(constraints || []),
                JSON.stringify(test_cases || []),
                points || 100,
                order_index || 0]
        );

        const problem = result.rows[0];

        // Update problem count
        await query(
            `UPDATE contests SET problem_count = (
                SELECT COUNT(*) FROM contest_problems WHERE contest_id = $1
            ) WHERE id = $1`,
            [id]
        );

        res.json({
            success: true,
            problem
        });

    } catch (error) {
        console.error("Error adding problem:", error);
        res.status(500).json({ error: "Failed to add problem" });
    }
});

// POST /api/contests/:id/submit - Submit solution for a problem
router.post("/:id/submit", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, problemId, code, language, isPractice } = req.body;

        if (!userId || !problemId || !code) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get contest and verify it's live (unless practicing after it finished)
        const contestResult = await query(
            `SELECT * FROM contests WHERE id = $1`,
            [id]
        );

        if (contestResult.rows.length === 0) {
            return res.status(404).json({ error: "Contest not found" });
        }

        const contest = contestResult.rows[0];
        
        if (contest.status !== "LIVE" && !isPractice) {
            return res.status(400).json({ error: "Contest is not live" });
        }

        // Get problem and test cases
        const problemResult = await query(
            `SELECT * FROM contest_problems WHERE id = $1 AND contest_id = $2`,
            [problemId, id]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found" });
        }

        const problem = problemResult.rows[0];

        // Get test cases (including hidden ones for judging) directly from DB JSON column
        let testCases = [];

        if (problem.test_cases && typeof problem.test_cases === 'string') {
            try { testCases = JSON.parse(problem.test_cases); } catch (e) { }
        } else if (problem.test_cases) {
            testCases = problem.test_cases;
        }

        // If no test cases, fall back to examples
        if ((!testCases || testCases.length === 0) && problem.examples) {
            const examples = typeof problem.examples === 'string'
                ? JSON.parse(problem.examples)
                : problem.examples;
            testCases = examples.map(ex => ({
                input: ex.input,
                expected_output: ex.output,
                is_hidden: false
            }));
        }

        // Call the bulk test API to properly handle Judge0 test suite (or simulations) natively 
        let passedCount = 0;
        let totalCount = testCases.length;
        let allPassed = false;

        try {
            const execRes = await fetch("http://localhost:4000/api/execute/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    testCases: testCases.map(tc => ({
                        input: tc.input,
                        expectedOutput: tc.expected_output
                    }))
                })
            });

            const execData = await execRes.json();

            if (execData.success) {
                passedCount = execData.passedCount || 0;
                allPassed = execData.allPassed || false;
            }
        } catch (execErr) {
            console.error("Test execution block failed:", execErr);
            allPassed = false;
        }

        const solved = allPassed && passedCount === totalCount;
        const score = (solved && !isPractice) ? problem.points : 0; // No individual points in practice mode, only completion bonus

        // Record submission
        await query(
            `INSERT INTO contest_submissions 
             (contest_id, problem_id, user_id, code, language, verdict, passed_tests, total_tests, points_earned, is_best)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, problemId, userId, code, language, solved ? 'Accepted' : 'Wrong Answer', passedCount, totalCount, score, solved]
        );

        // Update participant stats if solved
        if (solved && !isPractice) {
            // Check if already solved
            const previousSolve = await query(
                `SELECT * FROM contest_submissions 
                 WHERE contest_id = $1 AND problem_id = $2 AND user_id = $3 AND verdict = 'Accepted'
                 ORDER BY submitted_at LIMIT 1`,
                [id, problemId, userId]
            );

            // Only update if first accepted submission
            if (previousSolve.rows.length <= 1) {
                // Calculate penalty time (minutes since contest start)
                const contestStart = new Date(contest.start_time);
                const now = new Date();
                const penaltyMinutes = Math.floor((now - contestStart) / 60000);

                await query(
                    `UPDATE contest_participants 
                     SET total_score = total_score + $1,
                         problems_solved = problems_solved + 1,
                         penalty_time = penalty_time + $2,
                         last_submission_at = NOW()
                     WHERE contest_id = $3 AND user_id = $4`,
                    [score, penaltyMinutes, id, userId]
                );

                // Update problem solve count
                await query(
                    `UPDATE contest_problems SET solve_count = solve_count + 1 WHERE id = $1`,
                    [problemId]
                );

                // Check for "First to Solve" badge
                const solveCountResult = await query(
                    `SELECT solve_count FROM contest_problems WHERE id = $1`,
                    [problemId]
                );

                if (parseInt(solveCountResult.rows[0].solve_count) === 1) {
                    await awardContestBadge(userId, id, 'FIRST_TO_SOLVE', 'First to Solve', '🚀', '#00BFFF',
                        `First person to solve "${problem.title}" during the contest!`);
                }
            }
        }

        // Update global user stats (Only for active contests, practice will have its own reward)
        if (!isPractice) {
            try {
                await query(
                    `UPDATE users SET 
                     total_points = total_points + $1,
                     problems_solved = CASE WHEN $2 = true AND NOT EXISTS (
                         SELECT 1 FROM contest_submissions 
                         WHERE user_id = $3 AND problem_id = $4 AND verdict = 'Accepted' AND id != (
                            SELECT id FROM contest_submissions WHERE user_id = $3 AND problem_id = $4 ORDER BY id DESC LIMIT 1
                         )
                     ) THEN problems_solved + 1 ELSE problems_solved END,
                     current_xp = current_xp + $1,
                     experience_points = experience_points + $1,
                     total_submissions = total_submissions + 1,
                     accepted_submissions = CASE WHEN $2 = true THEN accepted_submissions + 1 ELSE accepted_submissions END,
                     last_submission_date = CURRENT_DATE
                     WHERE id = $3`,
                    [score, solved, userId, problemId]
                );

                // Recalculate accuracy
                await query(
                    `UPDATE users SET 
                     accuracy_rate = CASE 
                        WHEN total_submissions > 0 THEN (CAST(accepted_submissions AS FLOAT) / total_submissions) * 100 
                        ELSE 0 
                     END
                     WHERE id = $1`,
                    [userId]
                );
            } catch (statErr) {
                console.error("Failed to update user stats:", statErr);
            }
        }

        // Record Activity
        try {
            await query(
                `INSERT INTO activity_logs (user_id, activity_type, description, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [userId, solved ? 'problem_solved' : 'problem_attempted',
                    `${solved ? 'Solved' : 'Attempted'} problem "${problem.title}" in ${contest.title}${isPractice ? ' (Practice)' : ''}`]
            );
        } catch (logErr) {
            console.error("Failed to log activity:", logErr);
        }

        res.json({
            success: true,
            solved,
            score,
            passedCount,
            totalCount,
            message: solved ? "🎉 Accepted! Well done!" : "Wrong Answer. Keep trying!"
        });

    } catch (error) {
        console.error("Submission processing error:", error);
        res.status(500).json({ error: "Failed to submit solution" });
    }
});

// POST /api/contests/:id/practice-complete - Reward user 10 points for finishing all problems in practice
router.post("/:id/practice-complete", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: "Missing user ID" });

        // Verify if user actually solved all problems
        const allProbs = await query('SELECT id FROM contest_problems WHERE contest_id = $1', [id]);
        const solvedProbs = await query(`SELECT DISTINCT problem_id FROM contest_submissions WHERE contest_id=$1 AND user_id=$2 AND verdict='Accepted'`, [id, userId]);

        if (solvedProbs.rows.length >= allProbs.rows.length && allProbs.rows.length > 0) {
            // Check if they already got the practice complete reward (maybe log it in activity logs)
            const checkReward = await query(`
                SELECT id FROM activity_logs 
                WHERE user_id = $1 AND activity_type = 'contest_practice_completed' 
                AND description LIKE $2
            `, [userId, `%contest ${id}%`]);

            if (checkReward.rows.length === 0) {
                // Award 10 points!
                await query(`
                    UPDATE users SET 
                        total_points = total_points + 10,
                        current_xp = current_xp + 10,
                        experience_points = experience_points + 10
                    WHERE id = $1
                `, [userId]);

                await query(`
                    INSERT INTO activity_logs (user_id, activity_type, description, created_at)
                    VALUES ($1, $2, $3, NOW())
                `, [userId, 'contest_practice_completed', `Completed all problems in contest ${id} (Practice)`]);

                return res.json({ success: true, rewarded: true, pointsAwarded: 10, message: "Contest Practice Complted! You earned 10 points." });
            } else {
                return res.json({ success: true, rewarded: false, message: "Already rewarded for this contest." });
            }
        } else {
            return res.json({ success: false, rewarded: false, message: "Not all problems solved yet." });
        }
    } catch (error) {
        console.error("Practice completion error:", error);
        res.status(500).json({ error: "Failed to process practice completion" });
    }
});

// GET /api/contests/:id/progress/:userId - Get user's progress in contest
router.get("/:id/progress/:userId", async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Get all accepted submissions for this user in this contest
        const submissionsResult = await query(
            `SELECT DISTINCT ON (problem_id) 
                problem_id, verdict, points_earned
             FROM contest_submissions
             WHERE contest_id = $1 AND user_id = $2 AND verdict = 'Accepted'
             ORDER BY problem_id, submitted_at ASC`,
            [id, userId]
        );

        // Get attempt counts per problem
        const attemptsResult = await query(
            `SELECT problem_id, COUNT(*) as attempts
             FROM contest_submissions
             WHERE contest_id = $1 AND user_id = $2
             GROUP BY problem_id`,
            [id, userId]
        );

        const progress = {};

        // Initialize with attempts
        attemptsResult.rows.forEach(row => {
            progress[row.problem_id] = {
                solved: false,
                attempts: parseInt(row.attempts),
                score: 0
            };
        });

        // Update with solved status
        submissionsResult.rows.forEach(row => {
            const problemId = row.problem_id;
            const isSolved = row.verdict === 'Accepted';

            if (progress[problemId]) {
                progress[problemId].solved = isSolved;
                progress[problemId].score = parseInt(row.points_earned) || 0;
            } else {
                progress[problemId] = {
                    solved: isSolved,
                    attempts: 1,
                    score: parseInt(row.points_earned) || 0
                };
            }
        });

        res.json({
            success: true,
            progress
        });

    } catch (error) {
        console.error("Error fetching progress:", error);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});

// GET /api/contests/:id/submissions/:userId - Get user's submissions
router.get("/:id/submissions/:userId", async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { problemId } = req.query;

        let queryStr = `
            SELECT cs.*, cp.title as problem_title
            FROM contest_submissions cs
            JOIN contest_problems cp ON cs.problem_id = cp.id
            WHERE cs.contest_id = $1 AND cs.user_id = $2
        `;
        const params = [id, userId];

        if (problemId) {
            queryStr += ` AND cs.problem_id = $3`;
            params.push(problemId);
        }

        queryStr += ` ORDER BY cs.submitted_at DESC LIMIT 50`;

        const result = await query(queryStr, params);

        res.json({
            success: true,
            submissions: result.rows
        });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
});

// POST /api/contests/:id/violation - Report a contest violation (tab switch)
router.post("/:id/violation", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, type } = req.body;

        if (!userId) return res.status(400).json({ error: "User ID required" });

        const result = await query(
            `UPDATE contest_participants 
             SET warnings = COALESCE(warnings, 0) + 1,
                 is_disqualified = CASE WHEN COALESCE(warnings, 0) + 1 >= 3 THEN TRUE ELSE FALSE END
             WHERE contest_id = $1 AND user_id = $2
             RETURNING warnings, is_disqualified`,
            [id, userId]
        );

        if (result.rows.length > 0) {
            const { warnings, is_disqualified } = result.rows[0];

            // Log violation
            await query(
                `INSERT INTO activity_logs (user_id, activity_type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [userId, 'contest_violation', `Violation type: ${type} (Warning #${warnings})`, JSON.stringify({ contestId: id, type })]
            );

            if (is_disqualified) {
                await createContestNotification(userId, id, 'DISQUALIFIED',
                    '🚫 Disqualified!', 'You have been disqualified from the contest for multiple violations.');
            } else {
                await createContestNotification(userId, id, 'VIOLATION_WARNING',
                    '⚠️ Warning!', `We detected a tab switch. This is warning #${warnings}/3. Further violations will result in disqualification.`);
            }

            res.json({ success: true, warnings, isDisqualified: is_disqualified });
        } else {
            res.status(404).json({ error: "Participant not found" });
        }
    } catch (error) {
        console.error("Error reporting violation:", error);
        res.status(500).json({ error: "Failed to report violation" });
    }
});

// GET /api/contests/user/:userId/badges - Get all contest badges for a user
router.get("/user/:userId/badges", async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await query(
            `SELECT cb.*, c.title as contest_title 
             FROM contest_badges cb
             JOIN contests c ON cb.contest_id = c.id
             WHERE cb.user_id = $1
             ORDER BY cb.earned_at DESC`,
            [userId]
        );
        res.json({ success: true, badges: result.rows });
    } catch (error) {
        console.error("Error fetching contest badges:", error);
        res.status(500).json({ error: "Failed to fetch badges" });
    }
});

// =====================================================
// ADMIN-ONLY ROUTES
// =====================================================

// GET /api/contests/:id/admin/participants - Full participants list for admin
router.get("/:id/admin/participants", async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.query;

        // Verify admin
        if (adminId) {
            const adminCheck = await query(`SELECT role FROM users WHERE id = $1`, [adminId]);
            if (!adminCheck.rows.length || adminCheck.rows[0].role !== 'Admin') {
                return res.status(403).json({ error: "Admin access required" });
            }
        }

        const result = await query(
            `SELECT 
                cp.user_id,
                cp.total_score,
                cp.problems_solved,
                cp.penalty_time,
                cp.first_submission_at,
                cp.last_submission_at,
                COALESCE(cp.warnings, 0) as warnings,
                COALESCE(cp.is_disqualified, false) as is_disqualified,
                cp.registered_at as joined_at,
                u.full_name,
                u.email,
                u.current_level,
                u.profile_photo_url,
                (SELECT COUNT(*) FROM contest_submissions cs 
                 WHERE cs.contest_id = cp.contest_id AND cs.user_id = cp.user_id) as submission_count,
                RANK() OVER (ORDER BY cp.total_score DESC, cp.penalty_time ASC) as rank
             FROM contest_participants cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.contest_id = $1
             ORDER BY rank`,
            [id]
        );

        res.json({ success: true, participants: result.rows });
    } catch (error) {
        console.error("Error fetching participants:", error);
        res.status(500).json({ error: "Failed to fetch participants" });
    }
});

// GET /api/contests/:id/admin/submissions - All submissions feed for admin
router.get("/:id/admin/submissions", async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, limit = 50 } = req.query;

        // Verify admin
        if (adminId) {
            const adminCheck = await query(`SELECT role FROM users WHERE id = $1`, [adminId]);
            if (!adminCheck.rows.length || adminCheck.rows[0].role !== 'Admin') {
                return res.status(403).json({ error: "Admin access required" });
            }
        }

        const result = await query(
            `SELECT 
                cs.id,
                cs.submitted_at,
                cs.language,
                cs.passed_tests,
                cs.total_tests,
                COALESCE(cs.score, cs.points_earned, 0) as score,
                COALESCE(cs.is_accepted, (cs.verdict = 'Accepted'), false) as is_accepted,
                u.full_name,
                u.current_level,
                cp_prob.title as problem_title,
                cp_prob.difficulty
             FROM contest_submissions cs
             JOIN users u ON cs.user_id = u.id
             JOIN contest_problems cp_prob ON cs.problem_id = cp_prob.id
             WHERE cs.contest_id = $1
             ORDER BY cs.submitted_at DESC
             LIMIT $2`,
            [id, parseInt(limit)]
        );


        res.json({ success: true, submissions: result.rows });
    } catch (error) {
        console.error("Error fetching admin submissions:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
});

// GET /api/contests/:id/admin/stats - Live stats for admin dashboard
router.get("/:id/admin/stats", async (req, res) => {
    try {
        const { id } = req.params;

        const contestRes = await query(`SELECT * FROM contests WHERE id = $1`, [id]);

        // Safe query for participant stats
        let participantData = { total: '0', active: '0', disqualified: '0' };
        try {
            const pr = await query(
                `SELECT COUNT(*) as total,
                 COUNT(CASE WHEN problems_solved > 0 THEN 1 END) as active
                 FROM contest_participants WHERE contest_id = $1`, [id]
            );
            if (pr.rows[0]) participantData = { ...participantData, ...pr.rows[0] };
        } catch (pe) {
            console.warn('Participant stats error:', pe.message);
        }

        // Safe query for submission stats
        let submissionData = { total: '0', accepted: '0', last5min: '0' };
        try {
            const sr = await query(
                `SELECT COUNT(*) as total,
                 COUNT(CASE WHEN is_accepted = true THEN 1 END) as accepted,
                 COUNT(CASE WHEN submitted_at > NOW() - INTERVAL '5 minutes' THEN 1 END) as last5min
                 FROM contest_submissions WHERE contest_id = $1`, [id]
            );
            if (sr.rows[0]) submissionData = sr.rows[0];
        } catch (se) {
            // Fallback without is_accepted
            try {
                const sr2 = await query(
                    `SELECT COUNT(*) as total,
                     COUNT(CASE WHEN submitted_at > NOW() - INTERVAL '5 minutes' THEN 1 END) as last5min
                     FROM contest_submissions WHERE contest_id = $1`, [id]
                );
                if (sr2.rows[0]) submissionData = { ...submissionData, ...sr2.rows[0] };
            } catch (se2) {
                console.warn('Submission stats error:', se2.message);
            }
        }

        res.json({
            success: true,
            stats: {
                contest: contestRes.rows[0] || null,
                participants: participantData,
                submissions: submissionData
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/contests/:id/admin/control - Admin controls (start/extend/end)
router.post("/:id/admin/control", async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, action, extraMinutes } = req.body;

        // Verify admin
        const adminCheck = await query(`SELECT role FROM users WHERE id = $1`, [adminId]);
        if (!adminCheck.rows.length || adminCheck.rows[0].role !== 'Admin') {
            return res.status(403).json({ error: "Admin access required" });
        }

        const contestRes = await query(`SELECT * FROM contests WHERE id = $1`, [id]);
        if (!contestRes.rows.length) {
            return res.status(404).json({ error: "Contest not found" });
        }

        let updateQuery = '';
        let message = '';

        if (action === 'start_early') {
            const now = new Date();
            const contest = contestRes.rows[0];
            const duration = contest.duration_minutes || 90;
            const newEnd = new Date(now.getTime() + duration * 60000);
            updateQuery = `UPDATE contests SET status = 'LIVE', start_time = NOW(), end_time = $2, updated_at = NOW() WHERE id = $1 RETURNING *`;
            message = 'Contest started early!';
            const result = await query(updateQuery, [id, newEnd]);
            return res.json({ success: true, message, contest: result.rows[0] });
        } else if (action === 'extend') {
            const mins = parseInt(extraMinutes) || 15;
            updateQuery = `UPDATE contests SET end_time = end_time + INTERVAL '${mins} minutes', duration_minutes = duration_minutes + ${mins}, updated_at = NOW() WHERE id = $1 RETURNING *`;
            message = `Contest extended by ${mins} minutes!`;
        } else if (action === 'end_now') {
            updateQuery = `UPDATE contests SET status = 'FINISHED', end_time = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`;
            message = 'Contest ended!';
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        const result = await query(updateQuery, [id]);
        res.json({ success: true, message, contest: result.rows[0] });
    } catch (error) {
        console.error("Error applying admin control:", error);
        res.status(500).json({ error: "Failed to apply control" });
    }
});

// POST /api/contests/:id/admin/remove-participant - Remove a participant
router.post("/:id/admin/remove-participant", async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, targetUserId } = req.body;

        const adminCheck = await query(`SELECT role FROM users WHERE id = $1`, [adminId]);
        if (!adminCheck.rows.length || adminCheck.rows[0].role !== 'Admin') {
            return res.status(403).json({ error: "Admin access required" });
        }

        await query(`DELETE FROM contest_participants WHERE contest_id = $1 AND user_id = $2`, [id, targetUserId]);
        res.json({ success: true, message: "Participant removed" });
    } catch (error) {
        console.error("Error removing participant:", error);
        res.status(500).json({ error: "Failed to remove participant" });
    }
});

export default router;

