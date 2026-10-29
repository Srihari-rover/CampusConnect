package com.campusconnect.campus_backend;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class VerificationRepository {

    private final JdbcTemplate jdbc;

    public VerificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void saveCode(
            String email,
            String codeHash,
            LocalDateTime expiry) {
        jdbc.update("""
                INSERT INTO email_verification_codes
                    (email, code_hash, expires_at, attempts)
                VALUES (?, ?, ?, 0)
                ON DUPLICATE KEY UPDATE
                    code_hash = VALUES(code_hash),
                    expires_at = VALUES(expires_at),
                    attempts = 0
                """,
                email, codeHash, Timestamp.valueOf(expiry));
    }

    public Map<String, Object> findCode(String email) {
        var rows = jdbc.queryForList("""
                SELECT code_hash, expires_at, attempts
                FROM email_verification_codes
                WHERE email = ?
                """, email);

        return rows.isEmpty() ? null : rows.get(0);
    }

    public void incrementAttempts(String email) {
        jdbc.update("""
                UPDATE email_verification_codes
                SET attempts = attempts + 1
                WHERE email = ?
                """, email);
    }

    public void deleteCode(String email) {
        jdbc.update(
                "DELETE FROM email_verification_codes WHERE email = ?",
                email);
    }
}