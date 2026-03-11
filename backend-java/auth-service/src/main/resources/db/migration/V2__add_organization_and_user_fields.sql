-- Migration: Add Organization table and additional User fields
-- This migration adds new fields to users table and creates organizations table
-- It does not delete existing data

-- Add new columns to users table (if they don't exist)
DO $$
BEGIN
    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
    END IF;

    -- Add subscription_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_type') THEN
        ALTER TABLE users ADD COLUMN subscription_type VARCHAR(20) DEFAULT 'FREE';
    END IF;

    -- Add created_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updated_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(100),
    website VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    country VARCHAR(100),
    city VARCHAR(100),
    logo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_organizations_name UNIQUE (name)
);

-- Create index on organization name for faster searches
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Update existing users to have default values if they are NULL
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE users SET subscription_type = 'FREE' WHERE subscription_type IS NULL;
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

