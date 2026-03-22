-- Fix missing columns in users table
-- Run this in pgAdmin or PostgreSQL CLI

-- Add is_private column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add experience_points column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;

-- Add total_points column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Add current_level column if missing (starts at 1)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Add current_xp column (XP towards next level)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;

-- Add xp_to_next_level column
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 1000;

-- Add problems_solved column
ALTER TABLE users ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0;

-- Add streak columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;

-- Add submission tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;

-- Add bio column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create problem_attempts table if not exists (for Insights)
CREATE TABLE IF NOT EXISTS problem_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    problem_id INTEGER,
    language VARCHAR(50),
    is_correct BOOLEAN DEFAULT FALSE,
    xp_earned INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user ON problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_date ON problem_attempts(attempted_at);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
