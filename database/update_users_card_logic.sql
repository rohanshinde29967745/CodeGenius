-- Add column to track problem progress for re-earning the Contest Creation Card
ALTER TABLE users ADD COLUMN IF NOT EXISTS problems_solved_at_last_card INT DEFAULT 0;
