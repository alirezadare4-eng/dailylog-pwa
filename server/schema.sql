-- Schema DDL for DailyLog PostgreSQL Database
-- Compatible with PostgreSQL 13+

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(32) DEFAULT '#3b82f6',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'personal' or 'work'
    color VARCHAR(32) DEFAULT '#64748b',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    jalali_date VARCHAR(32) NOT NULL,
    summary TEXT,
    tomorrow_plan TEXT,
    is_draft BOOLEAN DEFAULT FALSE,
    conversation_step INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(64) REFERENCES reports(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'work' or 'personal'
    title VARCHAR(512) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'pending', -- 'completed', 'in_progress', 'pending'
    project VARCHAR(255),
    duration_minutes INTEGER DEFAULT 0,
    priority VARCHAR(32) DEFAULT 'medium',
    category VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    time VARCHAR(16) DEFAULT '22:00',
    skip_if_report_completed BOOLEAN DEFAULT TRUE,
    last_notified_date DATE,
    push_subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backups (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    backup_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high performance queries
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activities_report ON activities(report_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

