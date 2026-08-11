package com.perkhaven.storage;

import java.nio.file.Path;

public record StoredFile(String key, String originalName, String contentType, long size, Path path) {}
