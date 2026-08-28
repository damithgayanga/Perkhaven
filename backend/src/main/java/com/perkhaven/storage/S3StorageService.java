package com.perkhaven.storage;

import com.perkhaven.common.error.NotFoundException;
import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
@ConditionalOnProperty(name = "perkhaven.storage.provider", havingValue = "s3")
public class S3StorageService implements StorageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");

    private final S3Client s3;
    private final String bucket;

    public S3StorageService(S3Client s3, @Value("${perkhaven.storage.bucket}") String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    @Override
    public StoredFile store(String category, MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty.");
        if (!ALLOWED.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP and PDF evidence files are supported.");
        }
        var extension = switch (file.getContentType()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
        return storeBytes(category, safeName(file.getOriginalFilename()), file.getContentType(), file.getBytes(), extension);
    }

    @Override
    public StoredFile store(String category, String originalName, String contentType, byte[] content) throws IOException {
        if (content == null || content.length == 0) throw new IllegalArgumentException("File is empty.");
        var extension = contentType != null && contentType.equals("application/pdf") ? ".pdf" : ".bin";
        return storeBytes(category, safeName(originalName), contentType == null ? "application/octet-stream" : contentType, content, extension);
    }

    private StoredFile storeBytes(String category, String originalName, String contentType, byte[] content, String extension) {
        var key = category + "/" + UUID.randomUUID() + extension;
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .metadata(java.util.Map.of("original-name", originalName))
                        .build(),
                RequestBody.fromBytes(content));
        return new StoredFile(key, originalName, contentType, content.length, null);
    }

    @Override
    public Resource load(String key) {
        try {
            var response = s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build());
            return new ByteArrayResource(response.asByteArray()) {
                @Override
                public String getFilename() {
                    return key.substring(key.lastIndexOf('/') + 1);
                }
            };
        } catch (S3Exception exception) {
            if (exception.statusCode() != 404) throw exception;
            throw new NotFoundException("Stored file not found.");
        }
    }

    @Override
    public void delete(String key) {
        if (key != null && !key.isBlank()) {
            s3.deleteObject(request -> request.bucket(bucket).key(key));
        }
    }

    private String safeName(String value) {
        return value == null || value.isBlank() ? "upload" : value.replaceAll("[^a-zA-Z0-9._ -]", "_");
    }
}
