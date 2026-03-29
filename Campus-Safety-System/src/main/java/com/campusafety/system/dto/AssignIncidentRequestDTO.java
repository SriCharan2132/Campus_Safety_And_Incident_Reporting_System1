package com.campusafety.system.dto;

import jakarta.validation.constraints.NotNull;

public class AssignIncidentRequestDTO {

    @NotNull(message = "Security ID is required")
    private Long securityId;

    public Long getSecurityId() {
        return securityId;
    }

    public void setSecurityId(Long securityId) {
        this.securityId = securityId;
    }
}