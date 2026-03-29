package com.campusafety.system.dto;

public record SOSStatsDTO(
        long activeCount,
        long handledCount,
        long handledByMeCount
) {}