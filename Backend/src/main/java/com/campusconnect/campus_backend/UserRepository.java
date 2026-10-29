
package com.campusconnect.campus_backend;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?",
                Integer.class,
                email);

        return count != null && count > 0;
    }

    public void createPendingUser(
            String name,
            String email,
            String passwordHash,
            String role) {

        jdbc.update("""
                INSERT INTO users
                    (name, email, password_hash, role, email_verified)
                VALUES (?, ?, ?, ?, TRUE)
                """,
                name, email, passwordHash, role);
    }

    public Map<String, Object> findByEmail(String email) {
        var rows = jdbc.queryForList(
                """
                        SELECT user_id, name, email, password_hash,
                               role, email_verified
                        FROM users
                        WHERE email = ?
                        """,
                email);

        return rows.isEmpty() ? null : rows.get(0);
    }

    public void markEmailVerified(String email) {
        jdbc.update(
                "UPDATE users SET email_verified = TRUE WHERE email = ?",
                email);
    }

    public void deleteUnverifiedUser(String email) {
        jdbc.update(
                "DELETE FROM users WHERE email = ? AND email_verified = FALSE",
                email);
    }
}
