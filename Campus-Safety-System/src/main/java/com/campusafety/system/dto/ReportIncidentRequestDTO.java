package com.campusafety.system.dto;

import com.campusafety.system.enums.*;
import jakarta.validation.constraints.*;

public class ReportIncidentRequestDTO {

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Size(max = 1000)
    private String description;

    @NotNull
    private IncidentCategory category;

    @NotNull
    private Priority priority;

    @NotNull
    private AnonymousLevel anonymousLevel;
    private Double latitude;
    private Double longitude;
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    // Getters & Setters

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }

    public void setDescription(String description) { this.description = description; }

    public IncidentCategory getCategory() { return category; }

    public void setCategory(IncidentCategory category) { this.category = category; }

    public Priority getPriority() { return priority; }

    public void setPriority(Priority priority) { this.priority = priority; }

    public AnonymousLevel getAnonymousLevel() { return anonymousLevel; }

    public void setAnonymousLevel(AnonymousLevel anonymousLevel) {
        this.anonymousLevel = anonymousLevel;
    }
}