package com.campusafety.system.dto;

import com.campusafety.system.enums.IncidentStatus;
import com.campusafety.system.enums.IncidentCategory;
import com.campusafety.system.enums.Priority;
import com.campusafety.system.enums.AnonymousLevel;

import java.time.LocalDateTime;

public class IncidentResponseDTO {

    private final Long id;
    private final String title;
    private final String description;
    private final IncidentCategory category;
    private final Priority priority;
    private final IncidentStatus status;
    private final AnonymousLevel anonymousLevel;
    private final String reporterName;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final Double latitude;
    private final Double longitude;
    public IncidentResponseDTO(
            Long id,
            String title,
            String description,
            IncidentCategory category,
            Priority priority,
            IncidentStatus status,
            AnonymousLevel anonymousLevel,
            String reporterName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt, Double latitude,
            Double longitude
            
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.anonymousLevel = anonymousLevel;
        this.reporterName = reporterName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // ===== Getters =====

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public IncidentCategory getCategory() {
        return category;
    }

    public Priority getPriority() {
        return priority;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public AnonymousLevel getAnonymousLevel() {
        return anonymousLevel;
    }

    public String getReporterName() {
        return reporterName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
}