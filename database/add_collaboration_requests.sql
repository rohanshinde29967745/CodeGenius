-- ============================================================
-- COLLABORATION REQUESTS TABLE
-- Run this script to add the collaboration requests table
-- ============================================================

CREATE TABLE IF NOT EXISTS collaboration_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    description TEXT NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    
    -- Status: pending, accepted, ignored
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate requests
    UNIQUE(project_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_requests_project_id ON collaboration_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_requester_id ON collaboration_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_owner_id ON collaboration_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status ON collaboration_requests(status);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trg_collab_requests_updated_at ON collaboration_requests;
CREATE TRIGGER trg_collab_requests_updated_at
BEFORE UPDATE ON collaboration_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
