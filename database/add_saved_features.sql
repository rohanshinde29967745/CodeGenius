-- Add saved problems and saved projects tables
-- Run this migration to add save/bookmark functionality

-- Saved Problems table
CREATE TABLE IF NOT EXISTS saved_problems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL,
    problem_title VARCHAR(255) NOT NULL,
    problem_difficulty VARCHAR(50),
    problem_category VARCHAR(100),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, problem_id)
);

-- Saved Projects table
CREATE TABLE IF NOT EXISTS saved_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, project_id)
);

-- User Accounts table (for multi-account feature with same email)
CREATE TABLE IF NOT EXISTS user_accounts (
    id SERIAL PRIMARY KEY,
    primary_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(primary_user_id, linked_user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_problems_user ON saved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_projects_user ON saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_primary ON user_accounts(primary_user_id);

-- Notifications table (for storing actual notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'achievement', 'connection', 'streak', 'collab', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- ID of related item (badge_id, project_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Comments for documentation
COMMENT ON TABLE saved_problems IS 'Stores problems bookmarked/saved by users';
COMMENT ON TABLE saved_projects IS 'Stores projects bookmarked/saved by users';
COMMENT ON TABLE user_accounts IS 'Links multiple user accounts with same email';
COMMENT ON TABLE notifications IS 'Stores user notifications';
