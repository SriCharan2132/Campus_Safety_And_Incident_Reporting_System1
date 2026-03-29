package com.campusafety.system.dto;

import java.time.LocalDateTime;

public class IncidentTrackingStepDTO {

    private String status;
    private String label;
    private boolean completed;
    private LocalDateTime completedAt;

    public IncidentTrackingStepDTO(String status, String label, boolean completed, LocalDateTime completedAt) {
        this.status = status;
        this.label = label;
        this.completed = completed;
        this.completedAt = completedAt;
    }

    public String getStatus() { return status; }
    public String getLabel() { return label; }
    public boolean isCompleted() { return completed; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}