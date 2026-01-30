-- Illegal Street Database Schema
-- Secure database structure with proper constraints and indexing

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS illegal_street_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE illegal_street_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    reset_password_token VARCHAR(255) NULL,
    reset_password_expire DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    deleted_at DATETIME NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login logs table (for security auditing)
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cookie consents table (GDPR compliance)
CREATE TABLE IF NOT EXISTS cookie_consents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consent_id VARCHAR(64) NOT NULL UNIQUE,
    necessary BOOLEAN DEFAULT TRUE,
    functional BOOLEAN DEFAULT FALSE,
    analytics BOOLEAN DEFAULT FALSE,
    marketing BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consent_id (consent_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for session management)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security events table (for monitoring suspicious activities)
CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('failed_login', 'account_locked', 'suspicious_activity', 'password_reset', 'account_deleted') NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45),
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default admin user (password should be changed immediately)
-- Default password: Admin@123456
INSERT INTO users (username, email, password, role, created_at)
VALUES (
    'admin',
    'admin@illegalstreet.pl',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5h0HOmAqX3.P6',
    'admin',
    NOW()
) ON DUPLICATE KEY UPDATE id=id;

-- Clean up expired sessions (run this periodically)
-- DELETE FROM sessions WHERE expires_at < NOW();

-- Clean up old login logs (optional, keep last 90 days)
-- DELETE FROM login_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
