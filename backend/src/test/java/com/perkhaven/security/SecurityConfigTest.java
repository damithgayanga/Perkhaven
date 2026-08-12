package com.perkhaven.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class SecurityConfigTest {
    private final SecurityConfig security = new SecurityConfig();

    @Test
    void usesCognitoUsernameWhenPreferredUsernameIsAbsent() {
        var jwt = token(Map.of(
                "sub", "subject-id",
                "cognito:username", "admin@perkhaven.com",
                "preferred_username", "admin",
                "cognito:groups", List.of("ADMIN")));

        var authentication = security.jwtAuthenticationConverter().convert(jwt);

        assertThat(authentication.getName()).isEqualTo("admin");
        assertThat(authentication.getAuthorities()).extracting("authority").contains("ROLE_ADMIN");
    }

    @Test
    void alwaysProvidesANonNullPrincipal() {
        var authentication = security.jwtAuthenticationConverter().convert(token(Map.of("token_use", "access")));

        assertThat(authentication.getName()).isEqualTo("authenticated-user");
    }

    private Jwt token(Map<String, Object> claims) {
        return new Jwt("token", Instant.now(), Instant.now().plusSeconds(300), Map.of("alg", "none"), claims);
    }
}
