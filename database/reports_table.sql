-- Reports Table for Bug/Problem Reporting System
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL, -- 'bug', 'feature', 'problem_issue', 'other'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  page_url VARCHAR(500), -- Where the report was submitted from
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
  admin_notes TEXT, -- Admin response
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
