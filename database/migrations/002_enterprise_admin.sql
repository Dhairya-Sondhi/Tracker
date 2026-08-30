ALTER TABLE users
    ADD COLUMN last_login_at TIMESTAMP NULL AFTER is_active,
    ADD COLUMN last_seen_at TIMESTAMP NULL AFTER last_login_at,
    ADD INDEX idx_users_created_at (created_at),
    ADD INDEX idx_users_last_login_at (last_login_at);

CREATE TABLE IF NOT EXISTS trackers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(140) NOT NULL,
    type ENUM('BOOLEAN','NUMBER','DURATION','RATING','COUNT','TIME') NOT NULL,
    target_value DECIMAL(14,3) NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trackers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trackers_user_active (user_id, is_archived)
);

CREATE TABLE IF NOT EXISTS tracker_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tracker_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    entry_date DATE NOT NULL,
    numeric_value DECIMAL(14,3) NULL,
    boolean_value BOOLEAN NULL,
    status ENUM('COMPLETE','PARTIAL','MISSED','PLANNED_SKIP','REST_DAY','PENDING') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_entries_tracker FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
    CONSTRAINT fk_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_tracker_entry_date (tracker_id, entry_date),
    INDEX idx_entries_user_date (user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT UNSIGNED NULL,
    target_user_id BIGINT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_target (target_user_id, created_at)
);
