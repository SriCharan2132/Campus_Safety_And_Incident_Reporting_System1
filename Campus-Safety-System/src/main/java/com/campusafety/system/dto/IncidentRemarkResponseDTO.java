package com.campusafety.system.dto;

import java.time.LocalDateTime;

public class IncidentRemarkResponseDTO {

    private Long id;
    private Long incidentId;
    private Long studentId;
    private String studentName;
    private Integer stars;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentRemarkResponseDTO(
            Long id,
            Long incidentId,
            Long studentId,
            String studentName,
            Integer stars,
            String message,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.incidentId = incidentId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.stars = stars;
        this.message = message;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getIncidentId() { return incidentId; }
    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public Integer getStars() { return stars; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}