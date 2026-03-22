-- FIX DATABASE TYPE ISSUES
-- Run this in pgAdmin Query Tool

-- Fix current_level column type (change from VARCHAR to INTEGER)
-- First, update any non-numeric values to a default
UPDATE users SET current_level = '1' WHERE current_level IS NULL OR current_level !~ '^\d+$';

-- Then alter the column type
ALTER TABLE users 
ALTER COLUMN current_level TYPE INTEGER USING current_level::INTEGER;

-- Set default value
ALTER TABLE users ALTER COLUMN current_level SET DEFAULT 1;

-- Also ensure other columns have correct types
ALTER TABLE users ALTER COLUMN total_points SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN experience_points SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN current_xp SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN xp_to_next_level SET DEFAULT 1000;
ALTER TABLE users ALTER COLUMN problems_solved SET DEFAULT 0;

-- Verify the fix
SELECT id, full_name, current_level, total_points, current_xp 
FROM users 
WHERE role = 'User' 
LIMIT 5;
