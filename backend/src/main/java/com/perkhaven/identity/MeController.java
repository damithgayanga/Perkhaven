package com.perkhaven.identity;

import java.util.List;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {
    @GetMapping
    public MeResponse me(JwtAuthenticationToken authentication) {
        var jwt = authentication.getToken();
        return new MeResponse(authentication.getName(), jwt.getClaimAsString("email"), jwt.getClaimAsString("name"),
                jwt.getClaimAsString("role"), jwt.getClaimAsString("subject_type"), jwt.getClaimAsString("subject_reference"),
                authentication.getAuthorities().stream().map(Object::toString).toList());
    }
    public record MeResponse(String username, String email, String displayName, String role, String subjectType, String subjectReference, List<String> authorities) {}
}
