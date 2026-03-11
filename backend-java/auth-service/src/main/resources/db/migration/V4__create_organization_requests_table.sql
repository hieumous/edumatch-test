-- Migration: Create organization_requests table
-- This migration creates a table for employer registration requests

CREATE TABLE IF NOT EXISTS organization_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(100),
    website VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    country VARCHAR(100),
    city VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_organization_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_organization_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_requests_user_id ON organization_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_requests_status ON organization_requests(status);
CREATE INDEX IF NOT EXISTS idx_organization_requests_created_at ON organization_requests(created_at DESC);

