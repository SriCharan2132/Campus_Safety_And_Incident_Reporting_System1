package com.campusafety.system.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir =
            Paths.get(System.getProperty("user.dir"), "uploads");

    public FileStorageService() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory");
        }
    }

    public String storeFile(MultipartFile file) {

        try {

            String originalFileName =
                    StringUtils.cleanPath(file.getOriginalFilename());

            if (originalFileName.contains("..")) {
                throw new RuntimeException("Invalid file path sequence");
            }

            // Extract extension safely
            String extension = "";

            int dotIndex = originalFileName.lastIndexOf(".");
            if (dotIndex > 0) {
                extension = originalFileName.substring(dotIndex);
            }

            // Generate secure filename
            String uniqueFileName = UUID.randomUUID() + extension;

            Path targetLocation = uploadDir.resolve(uniqueFileName).normalize();

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return uniqueFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file", ex);
        }
    }

    public Path loadFile(String fileName) {
        return uploadDir.resolve(fileName).normalize();
    }
}