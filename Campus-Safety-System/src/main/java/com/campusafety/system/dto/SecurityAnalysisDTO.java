package com.campusafety.system.dto;

import java.util.List;
import java.util.Map;

public record SecurityAnalysisDTO(
        Long securityId,
        String securityName,
        long totalAssigned,
        long resolvedCount,
        long activeCount,
        double resolutionRate,
        Double avgResolutionHours,
        Map<String, Long> statusCounts,
        Map<String, Long> priorityCounts,
        List<Map<String, Object>> trend,
        List<IncidentResponseDTO> recentIncidents
) {}