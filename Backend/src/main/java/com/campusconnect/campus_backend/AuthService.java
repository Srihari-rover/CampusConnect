
package com.campusconnect.campus_backend;

import java.util.Locale;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(
            UserRepository users,
            PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public void register(
            String name,
            String email,
            String password,
            String role) {

        name = name == null ? "" : name.trim();
        email = normalizeEmail(email);
        role = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);

        if (name.isBlank() || name.length() > 100) {
            throw new IllegalArgumentException("Enter a valid name.");
        }

        if (email.isBlank() || !email.matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Enter a valid email.");
        }

        if (password == null || password.length() < 10
                || password.length() > 72) {
            throw new IllegalArgumentException(
                    "Password must be 10–72 characters long.");
        }

        if (!role.equals("student")
                && !role.equals("coordinator")
                && !role.equals("faculty")) {
            throw new IllegalArgumentException("Select a valid role.");
        }

        if (users.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        users.createPendingUser(
                name,
                email,
                encoder.encode(password),
                role);
    }

    public AuthModels.UserResponse login(String email, String password) {
        email = normalizeEmail(email);

        Map<String, Object> user = users.findByEmail(email);

        if (user == null || password == null
                || !encoder.matches(
                        password, (String) user.get("password_hash"))) {
            throw new IllegalArgumentException(
                    "Incorrect email or password.");
        }

        return new AuthModels.UserResponse(
                ((Number) user.get("user_id")).intValue(),
                (String) user.get("name"),
                (String) user.get("email"),
                (String) user.get("role"));
    }

    private String normalizeEmail(String email) {
        return email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
    }
}
