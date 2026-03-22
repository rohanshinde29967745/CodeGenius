-- Fix current_level column type
UPDATE users SET current_level = '1' WHERE current_level IS NULL;

ALTER TABLE users 
ALTER COLUMN current_level TYPE INTEGER USING COALESCE(current_level::INTEGER, 1);

ALTER TABLE users ALTER COLUMN current_level SET DEFAULT 1;

-- Verify it worked
SELECT id, full_name, current_level, total_points, current_xp FROM users LIMIT 5;