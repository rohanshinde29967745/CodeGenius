-- Add last_submission_date column for streak tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;

-- If the column already exists but is empty, this will not error
