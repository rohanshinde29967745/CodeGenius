-- Fix profile_photo_url column to support large base64 images
-- Run this ENTIRE script in pgAdmin

-- Step 1: Drop the views that depend on profile_photo_url
DROP VIEW IF EXISTS v_leaderboard CASCADE;
DROP VIEW IF EXISTS v_monthly_leaderboard CASCADE;

-- Step 2: Alter the column type to TEXT
ALTER TABLE users ALTER COLUMN profile_photo_url TYPE TEXT;

-- Step 3: Recreate the views
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

-- Done! Column is now TEXT type and can hold large base64 images
