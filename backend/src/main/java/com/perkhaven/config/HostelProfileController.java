package com.perkhaven.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hostel-profile")
public class HostelProfileController {
    private final String telephone;
    private final String email;

    public HostelProfileController(
            @Value("${perkhaven.hostel.telephone}") String telephone,
            @Value("${perkhaven.hostel.email}") String email) {
        this.telephone = telephone;
        this.email = email;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Response get() {
        return new Response(telephone, email);
    }

    public record Response(String telephone, String email) {}
}
