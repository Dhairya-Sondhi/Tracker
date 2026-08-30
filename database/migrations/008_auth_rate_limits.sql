CREATE TABLE auth_rate_limits (
    scope VARCHAR(48) NOT NULL,
    key_hash BINARY(32) NOT NULL,
    window_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attempts INT UNSIGNED NOT NULL DEFAULT 1,
    blocked_until TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (scope, key_hash),
    INDEX idx_auth_rate_limits_updated (updated_at)
);
