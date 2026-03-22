-- =====================================================
-- WEEKLY CONTEST SYSTEM - DATABASE SCHEMA
-- CodeGenius Platform
-- =====================================================

-- =====================================================
-- 1. CONTESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Contest timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 90,
    
    -- Contest status: UPCOMING, LIVE, FINISHED, CANCELLED
    status VARCHAR(20) DEFAULT 'UPCOMING',
    
    -- Contest type: ADMIN (official) or USER (community)
    contest_type VARCHAR(20) DEFAULT 'ADMIN',
    
    -- Visibility: PUBLIC (global) or PRIVATE (friends only)
    visibility VARCHAR(20) DEFAULT 'PUBLIC',
    
    -- Creator info
    created_by INT REFERENCES users(id),
    creator_name VARCHAR(255),
    
    -- Problem generation settings (for USER contests)
    difficulty_mix VARCHAR(50), -- e.g., "2-easy,2-medium,1-hard"
    problem_types TEXT[], -- e.g., {"DSA", "Array", "String"}
    languages TEXT[], -- e.g., {"Python", "JavaScript", "C++", "Java"}
    problem_count INT DEFAULT 5,
    
    -- Stats
    max_participants INT,
    registered_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_start_time ON contests(start_time);
CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);

-- =====================================================
-- 2. CONTEST PROBLEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_problems (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    
    -- Problem details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL, -- Easy, Medium, Hard
    problem_type VARCHAR(50), -- DSA, Array, String, DP, etc.
    
    -- Points and limits
    points INT DEFAULT 100,
    time_limit_ms INT DEFAULT 2000,
    memory_limit_kb INT DEFAULT 262144,
    
    -- Order in contest
    order_index INT DEFAULT 0,
    
    -- Test cases (JSONB for flexibility)
    -- Format: [{"input": "...", "output": "...", "is_hidden": true/false}]
    test_cases JSONB DEFAULT '[]',
    
    -- Sample code templates
    code_templates JSONB DEFAULT '{}',
    
    -- Hints (optional)
    hints TEXT[],
    
    -- Stats
    solve_count INT DEFAULT 0,
    attempt_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contest_problems_contest ON contest_problems(contest_id);

-- =====================================================
-- 3. CONTEST PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_participants (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Registration
    registered_at TIMESTAMP DEFAULT NOW(),
    
    -- Scoring
    total_score INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    
    -- Penalty time in minutes (for tie-breaking)
    penalty_time INT DEFAULT 0,
    
    -- Final rank (calculated when contest ends)
    final_rank INT,
    
    -- Timestamps
    first_submission_at TIMESTAMP,
    last_submission_at TIMESTAMP,
    
    -- Unique constraint: one registration per user per contest
    UNIQUE(contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user ON contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_score ON contest_participants(total_score DESC);

-- =====================================================
-- 4. CONTEST SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_submissions (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    problem_id INT REFERENCES contest_problems(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Submission details
    code TEXT NOT NULL,
    language VARCHAR(30) NOT NULL,
    
    -- Verdict: Accepted, Wrong Answer, TLE, Runtime Error, Compilation Error
    verdict VARCHAR(30) DEFAULT 'Pending',
    
    -- Test results
    passed_tests INT DEFAULT 0,
    total_tests INT DEFAULT 0,
    
    -- Performance
    execution_time_ms INT,
    memory_kb INT,
    
    -- Points earned for this submission
    points_earned INT DEFAULT 0,
    
    -- Is this the best submission for this problem?
    is_best BOOLEAN DEFAULT false,
    
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_user ON contest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_problem ON contest_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_verdict ON contest_submissions(verdict);

-- =====================================================
-- 5. CONTEST CREATION CARD TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_creation_cards (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Card status
    is_active BOOLEAN DEFAULT true,
    
    -- When the card was earned
    earned_at TIMESTAMP DEFAULT NOW(),
    
    -- When the card expires
    expires_at TIMESTAMP NOT NULL,
    
    -- Validity duration in hours (6 for Silver/Gold, 24 for Platinum)
    validity_hours INT DEFAULT 6,
    
    -- User's level when card was earned
    user_level VARCHAR(20),
    
    -- How it was earned
    earned_reason TEXT,
    
    -- Has this card been used to create a contest?
    used_for_contest_id INT REFERENCES contests(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contest_cards_user ON contest_creation_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_cards_active ON contest_creation_cards(is_active, expires_at);

-- =====================================================
-- 6. CONTEST INVITATIONS TABLE (for private contests)
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_invitations (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    
    -- Who is invited
    invited_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Who sent the invitation
    invited_by INT REFERENCES users(id),
    
    -- Status: PENDING, ACCEPTED, DECLINED
    status VARCHAR(20) DEFAULT 'PENDING',
    
    invited_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    
    UNIQUE(contest_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_invites_user ON contest_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_contest_invites_contest ON contest_invitations(contest_id);

-- =====================================================
-- 7. CONTEST BADGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_badges (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Badge type
    badge_type VARCHAR(50) NOT NULL,
    -- Possible values:
    -- 'CONTEST_WINNER' - Won 1st place
    -- 'CONTEST_PODIUM' - Top 3 finish
    -- 'FIRST_TO_SOLVE' - First to solve a problem
    -- 'PERFECT_SCORE' - Solved all problems
    -- 'CONTEST_CREATOR' - Created a contest (admin)
    -- 'COMMUNITY_CREATOR' - Created a user contest
    -- 'CONTEST_VETERAN' - Participated in 10+ contests
    -- 'SPEED_DEMON' - Solved problem in under 5 minutes
    
    badge_name VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(50),
    badge_color VARCHAR(20),
    
    -- Related contest (if applicable)
    contest_id INT REFERENCES contests(id),
    
    -- Description
    description TEXT,
    
    earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contest_badges_user ON contest_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_badges_type ON contest_badges(badge_type);

-- =====================================================
-- 8. CONTEST NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    
    -- Notification type
    notification_type VARCHAR(50) NOT NULL,
    -- Possible values:
    -- 'CONTEST_REMINDER_1H' - 1 hour before
    -- 'CONTEST_REMINDER_15M' - 15 minutes before
    -- 'CONTEST_STARTED' - Contest is now live
    -- 'CONTEST_ENDED' - Contest has ended
    -- 'CONTEST_INVITATION' - Invited to private contest
    -- 'RANK_UPDATE' - Your rank changed
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    
    -- Email sent?
    email_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contest_notifs_user ON contest_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contest_notifs_contest ON contest_notifications(contest_id);

-- =====================================================
-- 9. ADD CONTEST-RELATED COLUMNS TO USERS TABLE
-- =====================================================
-- Check if columns exist before adding
DO $$ 
BEGIN
    -- Medium problems solved count (for card eligibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'medium_problems_solved') THEN
        ALTER TABLE users ADD COLUMN medium_problems_solved INT DEFAULT 0;
    END IF;
    
    -- Contests participated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'contests_participated') THEN
        ALTER TABLE users ADD COLUMN contests_participated INT DEFAULT 0;
    END IF;
    
    -- Contests won
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'contests_won') THEN
        ALTER TABLE users ADD COLUMN contests_won INT DEFAULT 0;
    END IF;
    
    -- Best contest rank
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'best_contest_rank') THEN
        ALTER TABLE users ADD COLUMN best_contest_rank INT;
    END IF;
    
    -- Contest rating (like Codeforces rating)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'contest_rating') THEN
        ALTER TABLE users ADD COLUMN contest_rating INT DEFAULT 1200;
    END IF;
    
    -- Has active contest creation card
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'has_creation_card') THEN
        ALTER TABLE users ADD COLUMN has_creation_card BOOLEAN DEFAULT false;
    END IF;
    
    -- Card expiry time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'card_expires_at') THEN
        ALTER TABLE users ADD COLUMN card_expires_at TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- 10. HELPFUL VIEWS
-- =====================================================

-- View for active contests with creator info
CREATE OR REPLACE VIEW active_contests_view AS
SELECT 
    c.*,
    u.full_name as creator_full_name,
    u.email as creator_email,
    (SELECT COUNT(*) FROM contest_participants cp WHERE cp.contest_id = c.id) as participant_count,
    (SELECT COUNT(*) FROM contest_problems cp WHERE cp.contest_id = c.id) as problem_count
FROM contests c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status IN ('UPCOMING', 'LIVE')
ORDER BY c.start_time;

-- View for leaderboard
CREATE OR REPLACE VIEW contest_leaderboard_view AS
SELECT 
    cp.contest_id,
    cp.user_id,
    u.full_name,
    u.email,
    u.current_level,
    cp.total_score,
    cp.problems_solved,
    cp.penalty_time,
    cp.first_submission_at,
    RANK() OVER (PARTITION BY cp.contest_id ORDER BY cp.total_score DESC, cp.penalty_time ASC) as rank
FROM contest_participants cp
JOIN users u ON cp.user_id = u.id
ORDER BY cp.contest_id, rank;

-- =====================================================
-- DONE! Run this SQL in your PostgreSQL database
-- =====================================================
