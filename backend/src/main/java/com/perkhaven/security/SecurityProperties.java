package com.perkhaven.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "perkhaven.security")
public record SecurityProperties(String localSecret, Duration tokenTtl) {}
