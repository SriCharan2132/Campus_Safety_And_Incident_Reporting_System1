package com.campusafety.system.dto;

import com.campusafety.system.enums.Role;

import java.time.LocalDateTime;

public class IncidentChatMessageResponseDTO {

    private Long id;
    private Long incidentId;
    private Long senderId;
    private String senderName;
    private Role senderRole;
    private String message;
    private LocalDateTime createdAt;

    public IncidentChatMessageResponseDTO(
            Long id,
            Long incidentId,
            Long senderId,
            String senderName,
            Role senderRole,
            String message,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.incidentId = incidentId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getIncidentId() {
        return incidentId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public Role getSenderRole() {
        return senderRole;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}