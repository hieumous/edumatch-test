-- Migration: Add matching system fields to users table
-- Date: 2025-11-23
-- Purpose: Support matching algorithm between users and scholarships

ALTER TABLE users
ADD COLUMN IF NOT EXISTS gpa DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS major VARCHAR(100),
ADD COLUMN IF NOT EXISTS university VARCHAR(200),
ADD COLUMN IF NOT EXISTS year_of_study INTEGER,
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS research_interests TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_gpa ON users(gpa);
CREATE INDEX IF NOT EXISTS idx_users_major ON users(major);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);

-- Add comments
COMMENT ON COLUMN users.gpa IS 'User GPA for matching algorithm (0.0 - 4.0)';
COMMENT ON COLUMN users.major IS 'User major/field of study';
COMMENT ON COLUMN users.university IS 'User university name';
COMMENT ON COLUMN users.year_of_study IS 'Current year of study (1-5)';
COMMENT ON COLUMN users.skills IS 'Comma-separated list of skills (e.g., "Python,Java,Machine Learning")';
COMMENT ON COLUMN users.research_interests IS 'Comma-separated list of research interests (e.g., "AI,NLP,Computer Vision")';
