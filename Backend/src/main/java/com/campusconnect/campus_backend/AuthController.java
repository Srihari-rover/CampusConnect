package com.campusconnect.campus_backend;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
}, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody AuthModels.RegisterRequest request) {
        try {
            authService.register(
                    request.name(),
                    request.email(),
                    request.password(),
                    request.role());

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of("message", "Account created successfully. You can now log in."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AuthModels.LoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            AuthModels.UserResponse user = authService.login(request.email(), request.password());

            // Replace any existing session ID after successful login.
            HttpSession oldSession = httpRequest.getSession(false);
            if (oldSession != null) {
                oldSession.invalidate();
            }

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("userId", user.userId());
            session.setAttribute("userName", user.name());
            session.setAttribute("userEmail", user.email());
            session.setAttribute("userRole", user.role());

            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not logged in."));
        }

        return ResponseEntity.ok(Map.of(
                "userId", session.getAttribute("userId"),
                "name", session.getAttribute("userName"),
                "email", session.getAttribute("userEmail"),
                "role", session.getAttribute("userRole")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(Map.of("message", "Logged out."));
    }
}