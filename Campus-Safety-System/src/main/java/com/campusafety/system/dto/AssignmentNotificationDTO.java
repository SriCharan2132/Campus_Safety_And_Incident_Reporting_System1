package com.campusafety.system.dto;

import java.time.LocalDateTime;

public class AssignmentNotificationDTO {

    private Long id;            // persisted notification id (for dedupe)
    private Long incidentId;
    private String title;
    private String message;
    private LocalDateTime assignedAt;

    // used when creating DTO to send over WS (with id)
    public AssignmentNotificationDTO(Long id, Long incidentId, String title, String message, LocalDateTime assignedAt) {
        this.id = id;
        this.incidentId = incidentId;
        this.title = title;
        this.message = message;
        this.assignedAt = assignedAt;
    }

    // convenience constructor (no id)
    public AssignmentNotificationDTO(Long incidentId, String title, String message, LocalDateTime assignedAt) {
        this(null, incidentId, title, message, assignedAt);
    }

    public Long getId() { return id; }
    public Long getIncidentId() { return incidentId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public LocalDateTime getAssignedAt() { return assignedAt; }

    @Override
    public String toString() {
        return "AssignmentNotificationDTO{" +
                "id=" + id +
                ", incidentId=" + incidentId +
                ", title='" + title + '\'' +
                ", message='" + message + '\'' +
                ", assignedAt=" + assignedAt +
                '}';
    }
}