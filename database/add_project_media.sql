-- Add screenshots and demo_video_url columns to projects table
-- Run this migration to add support for project screenshots and demo videos

-- Add screenshots column (stores JSON array of URLs)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]';

-- Add demo_video_url column (stores single video URL)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS demo_video_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN projects.screenshots IS 'JSON array of screenshot URLs for the project';
COMMENT ON COLUMN projects.demo_video_url IS 'URL to the demo video file for the project';
