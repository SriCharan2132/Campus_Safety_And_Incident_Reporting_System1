package com.campusafety.system.dto;

import com.campusafety.system.enums.SOSStatus;
import com.campusafety.system.enums.IncidentCategory;

import java.time.LocalDateTime;

public class SOSEventResponseDTO {

    private Long id;
    private String studentName;
    private Double latitude;
    private Double longitude;
    private String description;
    private IncidentCategory category;
    private SOSStatus status;
    private LocalDateTime triggeredAt;
    private String handledBy;
    private LocalDateTime handledAt;

    public SOSEventResponseDTO(Long id,
                               String studentName,
                               Double latitude,
                               Double longitude,
                               String description,
                               IncidentCategory category,
                               SOSStatus status,
                               LocalDateTime triggeredAt,
                               String handledBy,
                               LocalDateTime handledAt) {

        this.id = id;
        this.studentName = studentName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.category = category;
        this.status = status;
        this.triggeredAt = triggeredAt;
        this.handledBy = handledBy;
        this.handledAt = handledAt;
    }

    // Getters
    public Long getId() { return id; }
    public String getStudentName() { return studentName; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getDescription() { return description; }
    public IncidentCategory getCategory() { return category; }
    public SOSStatus getStatus() { return status; }
    public LocalDateTime getTriggeredAt() { return triggeredAt; }
    public String getHandledBy() { return handledBy; }
    public LocalDateTime getHandledAt() { return handledAt; }
}