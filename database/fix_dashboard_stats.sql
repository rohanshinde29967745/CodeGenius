-- ============================================================
-- Fix Dashboard Stats - Database Migration
-- Run this script to fix column issues for dashboard stats
-- ============================================================

-- 1. Ensure all required columns exist on users table
-- These are safe to run multiple times (IF NOT EXISTS)

-- Experience and points columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 1000;

-- Problem solving stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;

-- Streak tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;

-- Profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- 2. Fix current_level column - MUST be VARCHAR for string levels
-- ============================================================

-- First check if current_level is INTEGER and needs conversion
DO $$
BEGIN
    -- Check if current_level exists and is of type integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'current_level' 
        AND data_type = 'integer'
    ) THEN
        -- Rename the old column
        ALTER TABLE users RENAME COLUMN current_level TO current_level_old;
        
        -- Create new VARCHAR column
        ALTER TABLE users ADD COLUMN current_level VARCHAR(20) DEFAULT 'Bronze';
        
        -- Convert old values to strings
        UPDATE users SET current_level = 
            CASE 
                WHEN current_level_old >= 4 THEN 'Platinum'
                WHEN current_level_old = 3 THEN 'Gold'
                WHEN current_level_old = 2 THEN 'Silver'
                ELSE 'Bronze'
            END;
        
        -- Drop old column
        ALTER TABLE users DROP COLUMN current_level_old;
        
        RAISE NOTICE 'Converted current_level from INTEGER to VARCHAR';
    ELSE
        RAISE NOTICE 'current_level is already VARCHAR or does not exist';
    END IF;
END $$;

-- Ensure the column exists with correct type
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level VARCHAR(20) DEFAULT 'Bronze';

-- Add constraint if not exists (won't fail if already exists)
DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT check_level 
        CHECK (current_level IN ('Bronze', 'Silver', 'Gold', 'Platinum'));
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint already exists';
    WHEN check_violation THEN
        -- If there are invalid values, fix them first
        UPDATE users SET current_level = 'Bronze' WHERE current_level NOT IN ('Bronze', 'Silver', 'Gold', 'Platinum');
        ALTER TABLE users ADD CONSTRAINT check_level 
            CHECK (current_level IN ('Bronze', 'Silver', 'Gold', 'Platinum'));
END $$;

-- ============================================================
-- 3. Create problem_attempts table if not exists
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER,
    language VARCHAR(50),
    is_correct BOOLEAN DEFAULT FALSE,
    xp_earned INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user ON problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_date ON problem_attempts(attempted_at);

-- ============================================================
-- 4. Disable the automatic trigger to prevent double updates
-- The backend now handles all stats updates manually
-- ============================================================

-- Drop the trigger that auto-updates user stats (if exists)
DROP TRIGGER IF EXISTS trg_update_user_stats ON submissions;

-- The trigger function is kept but not active
-- This prevents double-counting of points and problems

-- ============================================================
-- 5. Initialize any NULL values to defaults
-- ============================================================
UPDATE users SET 
    total_points = COALESCE(total_points, 0),
    experience_points = COALESCE(experience_points, 0),
    current_xp = COALESCE(current_xp, 0),
    xp_to_next_level = COALESCE(xp_to_next_level, 1000),
    problems_solved = COALESCE(problems_solved, 0),
    total_submissions = COALESCE(total_submissions, 0),
    accepted_submissions = COALESCE(accepted_submissions, 0),
    accuracy_rate = COALESCE(accuracy_rate, 0),
    current_streak = COALESCE(current_streak, 0),
    longest_streak = COALESCE(longest_streak, 0),
    current_level = COALESCE(current_level, 'Bronze')
WHERE total_points IS NULL 
   OR experience_points IS NULL 
   OR current_xp IS NULL
   OR current_level IS NULL;

-- ============================================================
-- 6. Verify the fix
-- ============================================================
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
AND column_name IN (
    'total_points', 'experience_points', 'current_xp', 
    'xp_to_next_level', 'current_level', 'problems_solved',
    'total_submissions', 'accepted_submissions', 'current_streak'
)
ORDER BY column_name;

-- ============================================================
-- DONE! Your database is now configured correctly.
-- ============================================================
