package com.campusafety.system.dto;

import com.campusafety.system.enums.IncidentCategory;
import com.campusafety.system.enums.SOSStatus;

import java.time.LocalDateTime;

public record SOSEventNotificationDTO(
        Long sosId,
        String eventType,   // "SOS_TRIGGERED" or "SOS_HANDLED"
        String message,
        Long studentId,
        String studentName,
        Double latitude,
        Double longitude,
        IncidentCategory category,
        SOSStatus status,
        String handledBy,
        LocalDateTime triggeredAt,
        LocalDateTime handledAt
) {}