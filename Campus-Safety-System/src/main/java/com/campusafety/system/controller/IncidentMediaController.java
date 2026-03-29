package com.campusafety.system.controller;

import java.io.IOException;
import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.IncidentMedia;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.Role;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.repository.IncidentMediaRepository;
import com.campusafety.system.security.AuthenticatedUserService;
import com.campusafety.system.service.FileStorageService;

@RestController
@RequestMapping("/api/media")
public class IncidentMediaController {

    private final IncidentMediaRepository mediaRepository;
    private final FileStorageService fileStorageService;
    private final AuthenticatedUserService authenticatedUserService;

    public IncidentMediaController(
            IncidentMediaRepository mediaRepository,
            FileStorageService fileStorageService,
            AuthenticatedUserService authenticatedUserService) {

        this.mediaRepository = mediaRepository;
        this.fileStorageService = fileStorageService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/{mediaId}")
    public ResponseEntity<Resource> download(@PathVariable Long mediaId) throws IOException {

        IncidentMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found"));

        Path filePath = fileStorageService.loadFile(media.getFileUrl());

        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new ResourceNotFoundException("File not found on disk");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, media.getContentType())
                .body(resource);
    }
    private ResponseEntity<Resource> buildFileResponse(IncidentMedia media) throws IOException {

        Path filePath = fileStorageService.loadFile(media.getFileUrl());
        Resource resource = new UrlResource(filePath.toUri());
        System.out.println("Loading file from: " + filePath.toAbsolutePath());
        if (!resource.exists()) {
            throw new ResourceNotFoundException("File not found on disk");
        }

        // 🎥 If video → stream inline
        if (media.getContentType().startsWith("video/")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, media.getContentType())
                    .body(resource);
        }

        // 🖼 Otherwise → download
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, media.getContentType())
                .body(resource);
    }
}