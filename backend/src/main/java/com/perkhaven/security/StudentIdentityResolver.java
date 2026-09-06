package com.perkhaven.security;

import com.perkhaven.student.Student;
import com.perkhaven.student.StudentRepository;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

/** Resolves student ownership from local JWTs and Cognito ID/access-token claim shapes. */
@Service
public class StudentIdentityResolver {
    private final StudentRepository students;

    public StudentIdentityResolver(StudentRepository students) {
        this.students = students;
    }

    public Optional<Student> resolve(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken token) || !hasStudentRole(authentication)) {
            return Optional.empty();
        }

        for (var claim : new String[]{"subject_reference", "preferred_username", "cognito:username", "username"}) {
            var registrationNo = token.getToken().getClaimAsString(claim);
            if (registrationNo != null && !registrationNo.isBlank()) {
                var student = students.findByRegistrationNoIgnoreCase(registrationNo);
                if (student.isPresent()) return student;
                student = students.findByEmailIgnoreCase(registrationNo);
                if (student.isPresent()) return student;
            }
        }

        var email = token.getToken().getClaimAsString("email");
        return email == null || email.isBlank() ? Optional.empty() : students.findByEmailIgnoreCase(email);
    }

    public boolean canAccess(String registrationNo, Authentication authentication) {
        return registrationNo != null && resolve(authentication)
                .map(student -> registrationNo.equalsIgnoreCase(student.getRegistrationNo()))
                .orElse(false);
    }

    private boolean hasStudentRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_STUDENT".equals(authority.getAuthority()));
    }
}
