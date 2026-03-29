package com.campusafety.system.dto;

import com.campusafety.system.enums.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateIncidentStatusRequestDTO {

    @NotNull(message = "New status is required")
    private IncidentStatus newStatus;

    @Size(max = 500, message = "Remarks must not exceed 500 characters")
    private String remarks;

    public IncidentStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(IncidentStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}