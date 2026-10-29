
package com.campusconnect.campus_backend;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RegistrationRepository {

    private final JdbcTemplate jdbc;

    public RegistrationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Registration> findAll() {
        String sql = """
                SELECT registration_id, event_id, name, email, registered_at
                FROM registrations
                ORDER BY registered_at DESC
                """;

        return jdbc.query(sql, (rs, rowNum) -> {
            Registration r = new Registration();
            r.setRegistrationId(rs.getInt("registration_id"));
            r.setEventId(rs.getInt("event_id"));
            r.setName(rs.getString("name"));
            r.setEmail(rs.getString("email"));

            java.sql.Timestamp timestamp = rs.getTimestamp("registered_at");
            r.setRegisteredAt(timestamp == null ? null : timestamp.toString());

            return r;
        });
    }

    public Registration save(Registration registration) {
        String sql = """
                INSERT INTO registrations (event_id, name, email)
                VALUES (?, ?, ?)
                """;

        jdbc.update(
                sql,
                registration.getEventId(),
                registration.getName(),
                registration.getEmail());

        String selectSql = """
                SELECT registration_id, event_id, name, email, registered_at
                FROM registrations
                WHERE event_id = ? AND email = ?
                """;

        return jdbc.queryForObject(selectSql, (rs, rowNum) -> {
            Registration r = new Registration();
            r.setRegistrationId(rs.getInt("registration_id"));
            r.setEventId(rs.getInt("event_id"));
            r.setName(rs.getString("name"));
            r.setEmail(rs.getString("email"));

            java.sql.Timestamp timestamp = rs.getTimestamp("registered_at");
            r.setRegisteredAt(timestamp == null ? null : timestamp.toString());

            return r;
        }, registration.getEventId(), registration.getEmail());
    }
}
