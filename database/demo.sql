-- ========================================
-- COMPLETE FIX FOR PROGRESS BARS
-- ========================================

-- Step 1: Add all missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_submissions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;

-- Step 2: Fix current_level column (convert to INTEGER if it's VARCHAR)
DO $$
BEGIN
    -- Check if current_level exists and try to convert it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_level') THEN
        -- Update NULL or invalid values first
        UPDATE users SET current_level = '1' WHERE current_level IS NULL OR current_level = '';
        -- Try to alter the column type
        BEGIN
            ALTER TABLE users ALTER COLUMN current_level TYPE INTEGER USING current_level::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            -- If it fails, column might already be INTEGER
            NULL;
        END;
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE users ADD COLUMN current_level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Step 3: Set some sample progress data for testing (you can skip this)
-- This sets your user to have 150 XP out of 1000 (15% progress bar)
UPDATE users SET 
    current_xp = 150,
    xp_to_next_level = 1000,
    total_points = 150,
    experience_points = 150,
    problems_solved = 3,
    current_level = 1
WHERE id = 1;

-- Step 4: Verify the fix worked
SELECT id, full_name, current_level, current_xp, xp_to_next_level, total_points, problems_solved
FROM users 
WHERE role = 'User'
LIMIT 5;