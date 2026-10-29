package com.campusconnect.campus_backend;

public class AuthModels {

    public record RegisterRequest(
            String name,
            String email,
            String password,
            String role) {
    }

    public record VerifyRequest(
            String email,
            String code) {
    }

    public record LoginRequest(
            String email,
            String password) {
    }

    public record UserResponse(
            int userId,
            String name,
            String email,
            String role) {
    }
}