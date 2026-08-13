package com.perkhaven;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class PerkhavenApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(PerkhavenApplication.class, args);
        if (context.getEnvironment().getProperty("perkhaven.migration-only", Boolean.class, false)) {
            System.exit(SpringApplication.exit(context));
        }
    }
}
