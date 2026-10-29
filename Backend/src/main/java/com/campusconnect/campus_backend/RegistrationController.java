
package com.campusconnect.campus_backend;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = {
    "http://localhost:5500",
    "http://127.0.0.1:5500"
})
public class RegistrationController {

    private final RegistrationRepository repository;

    public RegistrationController(RegistrationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Registration> getRegistrations() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createRegistration(
            @RequestBody Registration registration) {

        if (registration.getEventId() <= 0
                || registration.getName() == null
                || registration.getName().isBlank()
                || registration.getEmail() == null
                || registration.getEmail().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Event ID, name and email are required.");
        }

        registration.setName(registration.getName().trim());
        registration.setEmail(
                registration.getEmail().trim().toLowerCase());

        try {
            Registration saved = repository.save(registration);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(saved);

        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This email may already be registered "
                            + "for this event, or the event ID is invalid.");
        }
    }
}
