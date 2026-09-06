package com.perkhaven.security;

import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service("authorizationService")
public class AuthorizationService {
    private static final Set<String> MANAGEMENT = Set.of("ROLE_ADMIN", "ROLE_CHAIRMAN", "ROLE_MANAGING_DIRECTOR");
    private final StudentIdentityResolver studentIdentity;

    public AuthorizationService(StudentIdentityResolver studentIdentity) {
        this.studentIdentity = studentIdentity;
    }

    public boolean canAccessStudent(String registrationNo, Authentication authentication) {
        if (hasAny(authentication, MANAGEMENT)) return true;
        return studentIdentity.canAccess(registrationNo, authentication);
    }

    public boolean canAccessStaff(String staffNo, Authentication authentication) {
        if (hasAny(authentication, MANAGEMENT)) return true;
        return authentication instanceof JwtAuthenticationToken token
                && "STAFF".equals(token.getToken().getClaimAsString("subject_type"))
                && staffNo.equalsIgnoreCase(token.getToken().getClaimAsString("subject_reference"));
    }

    private boolean hasAny(Authentication authentication, Set<String> roles) {
        return authentication != null && authentication.getAuthorities().stream().anyMatch(a -> roles.contains(a.getAuthority()));
    }
}
