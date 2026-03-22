-- RESET AND SETUP SCRIPT FOR CODEGENIUS
-- This will add missing columns and reset user stats
-- Run this in pgAdmin Query Tool

-- ========================================
-- STEP 1: Add all missing columns to users table
-- ========================================

-- Basic stats columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0;

-- Streak columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;

-- Submission tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;

-- Profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ========================================
-- STEP 2: Reset all user stats to 0 (clean slate)
-- ========================================

UPDATE users SET 
    total_points = 0,
    experience_points = 0,
    current_xp = 0,
    xp_to_next_level = 1000,
    current_level = 1,
    problems_solved = 0,
    current_streak = 0,
    longest_streak = 0,
    last_submission_date = NULL,
    total_submissions = 0,
    accepted_submissions = 0,
    accuracy_rate = 0,
    updated_at = NOW()
WHERE role = 'User';

-- ========================================
-- STEP 3: Clear old submissions and activity (optional)
-- ========================================

-- Uncomment these if you want to clear all previous data:
-- TRUNCATE TABLE submissions RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE;
-- DELETE FROM problem_attempts;

-- ========================================
-- STEP 4: Create problem_attempts table if missing
-- ========================================

CREATE TABLE IF NOT EXISTS problem_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    problem_id INTEGER,
    language VARCHAR(50),
    is_correct BOOLEAN DEFAULT FALSE,
    xp_earned INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- STEP 5: Verify the setup
-- ========================================

-- Show all columns in users table
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show current user stats (should all be 0 now)
SELECT id, full_name, total_points, current_xp, xp_to_next_level, current_level, problems_solved
FROM users 
WHERE role = 'User'
LIMIT 5;
