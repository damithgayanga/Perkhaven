package com.perkhaven.storage;

import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    StoredFile store(String category, MultipartFile file) throws IOException;
    StoredFile store(String category, String originalName, String contentType, byte[] content) throws IOException;
    Resource load(String key);
    void delete(String key);
}
