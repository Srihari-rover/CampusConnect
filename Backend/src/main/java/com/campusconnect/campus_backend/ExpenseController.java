
package com.campusconnect.campus_backend;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
}, allowCredentials = "true")
public class ExpenseController {

    private final JdbcTemplate jdbc;

    public ExpenseController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> getExpenses(
            @RequestParam(required = false) Integer eventId) {

        if (eventId != null) {
            return jdbc.queryForList(
                    "SELECT * FROM expenses WHERE event_id = ? ORDER BY expense_id DESC",
                    eventId);
        }

        return jdbc.queryForList(
                "SELECT * FROM expenses ORDER BY expense_id DESC");
    }

    @PostMapping
    public Map<String, Object> addExpense(
            @RequestBody ExpenseRequest request) {

        if (request.eventId() == null ||
                request.description() == null ||
                request.description().isBlank() ||
                request.amount() == null ||
                request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Enter a valid event, description and positive amount.");
        }

        jdbc.update(
                "INSERT INTO expenses (event_id, description, amount) VALUES (?, ?, ?)",
                request.eventId(),
                request.description().trim(),
                request.amount());

        return Map.of("message", "Expense saved successfully");
    }

    public record ExpenseRequest(
            Integer eventId,
            String description,
            BigDecimal amount) {
    }
}
