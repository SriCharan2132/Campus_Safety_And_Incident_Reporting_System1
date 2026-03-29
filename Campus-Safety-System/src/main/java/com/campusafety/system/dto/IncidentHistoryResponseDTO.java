package com.campusafety.system.dto;

import com.campusafety.system.enums.IncidentStatus;

import java.time.LocalDateTime;

public class IncidentHistoryResponseDTO {

    private IncidentStatus oldStatus;
    private IncidentStatus newStatus;
    private String changedBy;
    private LocalDateTime changedAt;
    private String remarks;

    public IncidentHistoryResponseDTO(IncidentStatus oldStatus,
                                      IncidentStatus newStatus,
                                      String changedBy,
                                      LocalDateTime changedAt,
                                      String remarks) {
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
        this.remarks = remarks;
    }

    public IncidentStatus getOldStatus() {
        return oldStatus;
    }

    public IncidentStatus getNewStatus() {
        return newStatus;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public String getRemarks() {
        return remarks;
    }
}