package com.perkhaven.storage;

import com.perkhaven.common.error.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "perkhaven.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");
    private final Path root;
    public LocalStorageService(@Value("${perkhaven.storage.local-root}") String root) { this.root = Path.of(root).toAbsolutePath().normalize(); }

    @Override
    public StoredFile store(String category, MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty.");
        if (!ALLOWED.contains(file.getContentType())) throw new IllegalArgumentException("Only JPEG, PNG and WebP photos are supported.");
        var extension = switch (file.getContentType()) { case "image/png" -> ".png"; case "image/webp" -> ".webp"; default -> ".jpg"; };
        var key = category + "/" + UUID.randomUUID() + extension;
        var destination = root.resolve(key).normalize();
        if (!destination.startsWith(root)) throw new IllegalArgumentException("Invalid storage key.");
        Files.createDirectories(destination.getParent());
        try (var input = file.getInputStream()) { Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING); }
        return new StoredFile(key, file.getOriginalFilename(), file.getContentType(), file.getSize(), destination);
    }

    @Override
    public Resource load(String key) {
        var path = root.resolve(key).normalize();
        if (!path.startsWith(root) || !Files.isRegularFile(path)) throw new NotFoundException("Stored file not found.");
        return new FileSystemResource(path);
    }

    @Override
    public void delete(String key) {
        if (key == null) return;
        var path = root.resolve(key).normalize();
        if (!path.startsWith(root)) return;
        try { Files.deleteIfExists(path); } catch (IOException ignored) { }
    }
}
