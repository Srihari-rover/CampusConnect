
package com.campusconnect.campus_backend;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EventRepository {

    private final JdbcTemplate jdbc;

    public EventRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Event> findAll() {
        String sql = """
                SELECT event_id, title, description,
                       event_date, budget, google_form_url
                FROM events
                ORDER BY event_id DESC
                """;

        return jdbc.query(sql, (rs, rowNum) -> {
            Event event = new Event();

            event.setEventId(rs.getInt("event_id"));
            event.setTitle(rs.getString("title"));
            event.setDescription(rs.getString("description"));

            java.sql.Date date = rs.getDate("event_date");
            event.setEventDate(
                    date == null ? null : date.toString());

            event.setBudget(rs.getBigDecimal("budget"));
            event.setGoogleFormUrl(
                    rs.getString("google_form_url"));

            return event;
        });
    }

    public Event save(Event event) {
        String sql = """
                INSERT INTO events
                    (title, description, event_date,
                     budget, google_form_url)
                VALUES (?, ?, ?, ?, ?)
                """;

        java.sql.Date date = event.getEventDate() == null
                || event.getEventDate().isBlank()
                        ? null
                        : java.sql.Date.valueOf(
                                event.getEventDate());

        jdbc.update(
                sql,
                event.getTitle(),
                event.getDescription(),
                date,
                event.getBudget() == null
                        ? java.math.BigDecimal.ZERO
                        : event.getBudget(),
                event.getGoogleFormUrl());

        return event;
    }

    // Delete an event from MySQL
    public void deleteById(int eventId) {
        String sql = "DELETE FROM events WHERE event_id = ?";
        jdbc.update(sql, eventId);
    }
}
