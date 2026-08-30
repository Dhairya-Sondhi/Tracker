CREATE TABLE user_settings (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    theme ENUM('dark','light','system') NOT NULL DEFAULT 'dark',
    default_planning_view ENUM('DAY','WEEK','MONTH') NOT NULL DEFAULT 'DAY',
    week_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
    animations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    email_digest ENUM('OFF','DAILY','WEEKLY') NOT NULL DEFAULT 'WEEKLY',
    weekly_review_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    daily_reminder_time TIME NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
