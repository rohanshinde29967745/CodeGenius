-- ============================================================
-- CodeGenius PostgreSQL Database Schema
-- Generated: 2025-12-15
-- Run this file in pgAdmin to create all tables
-- ============================================================

-- Drop existing tables if needed (uncomment if you want to reset)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
    bio TEXT,
    location VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    profile_photo_url VARCHAR(500),
    
    -- Gamification fields
    total_points INTEGER DEFAULT 0,
    current_level VARCHAR(20) DEFAULT 'Bronze' CHECK (current_level IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    current_xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER DEFAULT 1000,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    
    -- Statistics
    problems_solved INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    accepted_submissions INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- OAuth fields
    google_id VARCHAR(255),
    github_id VARCHAR(255),
    facebook_id VARCHAR(255),
    
    -- Preferences
    theme_preference VARCHAR(10) DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
    remember_me BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_current_level ON users(current_level);

-- ============================================================
-- 2. PROBLEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    language VARCHAR(50) NOT NULL,
    constraints TEXT[],
    
    -- Metadata
    total_attempts INTEGER DEFAULT 0,
    total_accepted INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    points_reward INTEGER DEFAULT 10,
    
    -- For daily challenges
    is_daily_challenge BOOLEAN DEFAULT FALSE,
    daily_challenge_date DATE,
    daily_bonus_points INTEGER DEFAULT 0,
    
    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_generated_by_ai BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_language ON problems(language);
CREATE INDEX IF NOT EXISTS idx_problems_is_daily_challenge ON problems(is_daily_challenge);
CREATE INDEX IF NOT EXISTS idx_problems_is_active ON problems(is_active);

-- ============================================================
-- 3. PROBLEM EXAMPLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_examples (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problem_examples_problem_id ON problem_examples(problem_id);

-- ============================================================
-- 4. TEST CASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);

-- ============================================================
-- 5. SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    
    -- Results
    status VARCHAR(30) NOT NULL CHECK (status IN ('Pending', 'Running', 'Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error')),
    passed_test_cases INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    
    -- AI Feedback
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_suggestions TEXT[],
    ai_optimized_solution TEXT,
    
    -- Points awarded
    points_earned INTEGER DEFAULT 0,
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- ============================================================
-- 6. CODE ANALYSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS code_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    input_code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    
    -- Analysis Results
    explanation TEXT,
    errors TEXT[],
    complexity JSONB,
    flowchart TEXT,
    optimized_code TEXT,
    
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_code_analyses_language ON code_analyses(language);
CREATE INDEX IF NOT EXISTS idx_code_analyses_analyzed_at ON code_analyses(analyzed_at DESC);

-- ============================================================
-- 7. CODE CONVERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS code_conversions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    source_language VARCHAR(50) NOT NULL,
    target_language VARCHAR(50) NOT NULL,
    source_code TEXT NOT NULL,
    converted_code TEXT NOT NULL,
    
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_code_conversions_user_id ON code_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_conversions_languages ON code_conversions(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_code_conversions_converted_at ON code_conversions(converted_at DESC);

-- ============================================================
-- 8. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    programming_language VARCHAR(100),
    category VARCHAR(100) CHECK (category IN ('Web Development', 'Data Science', 'Mobile Apps', 'Machine Learning', 'Other')),
    github_url VARCHAR(500),
    
    -- File storage
    files_url VARCHAR(500),
    
    -- Engagement metrics
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_language ON projects(programming_language);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_likes_count ON projects(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_views_count ON projects(views_count DESC);

-- ============================================================
-- 9. TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================================
-- 10. PROJECT TAGS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_tags (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag_id ON project_tags(tag_id);

-- ============================================================
-- 11. PROJECT LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);

-- ============================================================
-- 12. BADGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    
    -- Requirements
    requirement_type VARCHAR(50) CHECK (requirement_type IN ('problems_solved', 'accuracy_rate', 'streak', 'submissions', 'points', 'optimal_solutions', 'speed', 'custom')),
    requirement_value INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. USER BADGES JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_earned BOOLEAN DEFAULT FALSE,
    earned_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_is_earned ON user_badges(is_earned);

-- ============================================================
-- 14. USER SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_percent INTEGER DEFAULT 0 CHECK (proficiency_percent >= 0 AND proficiency_percent <= 100),
    problems_solved_in_skill INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON user_skills(skill_name);

-- ============================================================
-- 15. ACTIVITY LOGS TABLE (Includes Login/Register logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'registration',
        'login',
        'logout',
        'login_failed',
        'password_reset',
        'problem_solved',
        'problem_attempted',
        'code_analyzed',
        'code_converted',
        'project_uploaded',
        'badge_earned',
        'level_up',
        'streak_update'
    )),
    description TEXT,
    metadata JSONB,
    
    -- For auth logs
    ip_address INET,
    user_agent VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- 16. DAILY CHALLENGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    challenge_date DATE UNIQUE NOT NULL,
    bonus_points INTEGER DEFAULT 150,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date DESC);

-- ============================================================
-- 17. USER DAILY CHALLENGE COMPLETIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_daily_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_challenge_id INTEGER NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
    
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bonus_points_earned INTEGER DEFAULT 0,
    
    UNIQUE(user_id, daily_challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_completions_user_id ON user_daily_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_completions_date ON user_daily_completions(completed_at DESC);

-- ============================================================
-- 18. LEADERBOARD CACHE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL CHECK (period IN ('all_time', 'this_month', 'this_week', 'today')),
    
    rank_position INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_period ON leaderboard_cache(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_rank ON leaderboard_cache(period, rank_position);

-- ============================================================
-- 19. USER SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address INET,
    
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- ============================================================
-- 20. PLATFORM STATISTICS TABLE (For Admin Dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_statistics (
    id SERIAL PRIMARY KEY,
    stat_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    
    total_users INTEGER DEFAULT 0,
    new_users_today INTEGER DEFAULT 0,
    daily_submissions INTEGER DEFAULT 0,
    active_problems INTEGER DEFAULT 0,
    project_uploads INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_statistics_date ON platform_statistics(stat_date DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- Leaderboard View (All Time)
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
    u.id,
    u.full_name,
    u.profile_photo_url,
    u.current_level,
    u.total_points,
    u.problems_solved,
    u.accuracy_rate,
    RANK() OVER (ORDER BY u.total_points DESC) as global_rank
FROM users u
WHERE u.role = 'User'
ORDER BY u.total_points DESC;

-- Monthly Leaderboard View
CREATE OR REPLACE VIEW v_monthly_leaderboard AS
SELECT 
    u.id,
    u.full_name,
    u.profile_photo_url,
    u.current_level,
    COALESCE(SUM(s.points_earned), 0) as monthly_points,
    COUNT(CASE WHEN s.status = 'Accepted' THEN 1 END) as monthly_problems_solved,
    RANK() OVER (ORDER BY COALESCE(SUM(s.points_earned), 0) DESC) as monthly_rank
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id 
    AND s.submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.role = 'User'
GROUP BY u.id
ORDER BY monthly_points DESC;

-- User Profile Statistics View
CREATE OR REPLACE VIEW v_user_profile_stats AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.total_points,
    u.problems_solved,
    u.accuracy_rate,
    u.current_level,
    u.current_xp,
    u.xp_to_next_level,
    u.current_streak,
    COUNT(DISTINCT s.id) as total_contests,
    COUNT(DISTINCT p.id) as uploaded_projects,
    (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id AND ub.is_earned = TRUE) as badges_earned
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
LEFT JOIN projects p ON u.id = p.user_id
GROUP BY u.id;

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_problems_updated_at ON problems;
CREATE TRIGGER trg_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user stats after submission
CREATE OR REPLACE FUNCTION update_user_stats_after_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user statistics
    UPDATE users 
    SET 
        total_submissions = total_submissions + 1,
        accepted_submissions = accepted_submissions + CASE WHEN NEW.status = 'Accepted' THEN 1 ELSE 0 END,
        problems_solved = (
            SELECT COUNT(DISTINCT problem_id) 
            FROM submissions 
            WHERE user_id = NEW.user_id AND status = 'Accepted'
        ),
        total_points = total_points + NEW.points_earned,
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    -- Recalculate accuracy
    UPDATE users 
    SET accuracy_rate = 
        CASE 
            WHEN total_submissions > 0 
            THEN ROUND((accepted_submissions::DECIMAL / total_submissions) * 100, 2)
            ELSE 0 
        END
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_stats ON submissions;
CREATE TRIGGER trg_update_user_stats
AFTER INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_after_submission();

-- Function to update problem stats after submission
CREATE OR REPLACE FUNCTION update_problem_stats_after_submission()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE problems 
    SET 
        total_attempts = total_attempts + 1,
        total_accepted = total_accepted + CASE WHEN NEW.status = 'Accepted' THEN 1 ELSE 0 END,
        success_rate = 
            CASE 
                WHEN (total_attempts + 1) > 0 
                THEN ROUND(((total_accepted + CASE WHEN NEW.status = 'Accepted' THEN 1 ELSE 0 END)::DECIMAL / (total_attempts + 1)) * 100, 2)
                ELSE 0 
            END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.problem_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_problem_stats ON submissions;
CREATE TRIGGER trg_update_problem_stats
AFTER INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_problem_stats_after_submission();

-- ============================================================
-- SEED DATA - Default Badges
-- ============================================================
INSERT INTO badges (name, description, icon, color, requirement_type, requirement_value) VALUES
('Bronze', 'Solve 10 problems', '🏆', 'bronze', 'problems_solved', 10),
('Silver', 'Solve 25 problems', '🛡️', 'silver', 'problems_solved', 25),
('Gold', 'Solve 50 problems', '👑', 'gold', 'problems_solved', 50),
('Platinum', 'Solve 100 problems', '💎', 'platinum', 'problems_solved', 100),
('Problem Solver', 'Achieve 90%+ accuracy rate', '◎', 'green', 'accuracy_rate', 90),
('Code Optimizer', 'Submit 10 optimal solutions', '<>', 'blue', 'optimal_solutions', 10),
('Speed Demon', 'Submit 50 fast solutions', '⏱', 'red', 'speed', 50),
('Streak Master', '30-day solving streak', '⭐', 'pink', 'streak', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA - Default Tags
-- ============================================================
INSERT INTO tags (name) VALUES
('React'),
('JavaScript'),
('Python'),
('TypeScript'),
('Node.js'),
('CSS'),
('HTML'),
('Java'),
('C++'),
('Machine Learning'),
('Data Science'),
('API'),
('Firebase'),
('MongoDB'),
('PostgreSQL'),
('Docker'),
('AWS'),
('Vue.js'),
('Angular'),
('Django')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- COMPLETED!
-- ============================================================
-- Run this script in pgAdmin Query Tool to create all tables.
-- 
-- Tables created: 20
-- Views created: 3
-- Triggers created: 4
-- Indexes: 40+
-- ============================================================
