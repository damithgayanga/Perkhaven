package com.perkhaven.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@ConditionalOnProperty(name = "perkhaven.storage.provider", havingValue = "s3")
public class S3StorageConfiguration {
    @Bean
    S3Client s3Client() {
        return S3Client.builder().build();
    }
}
