package com.perkhaven.security;

import com.perkhaven.identity.AppUserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Profile("local")
@RestController
@RequestMapping("/api/v1/local-auth")
public class LocalAuthController {
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder encoder;
    private final SecurityProperties properties;

    public LocalAuthController(AppUserRepository users, PasswordEncoder passwordEncoder, JwtEncoder encoder, SecurityProperties properties) {
        this.users = users; this.passwordEncoder = passwordEncoder; this.encoder = encoder; this.properties = properties;
    }

    @PostMapping("/token")
    public TokenResponse token(@Valid @RequestBody LoginRequest request) {
        var user = users.findByUsernameIgnoreCase(request.username())
                .filter(candidate -> candidate.isActive() && candidate.getPasswordHash() != null && passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        var issuedAt = Instant.now();
        var expiresAt = issuedAt.plus(properties.tokenTtl());
        var claimsBuilder = JwtClaimsSet.builder()
                .issuer("perkhaven-local")
                .subject(String.valueOf(user.getId()))
                .issuedAt(issuedAt).expiresAt(expiresAt)
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("name", user.getDisplayName())
                .claim("role", user.getRole().name());
        if (user.getSubjectType() != null) claimsBuilder.claim("subject_type", user.getSubjectType());
        if (user.getSubjectReference() != null) claimsBuilder.claim("subject_reference", user.getSubjectReference());
        var claims = claimsBuilder.build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        return new TokenResponse(encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(), "Bearer", expiresAt);
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record TokenResponse(String accessToken, String tokenType, Instant expiresAt) {}
}
