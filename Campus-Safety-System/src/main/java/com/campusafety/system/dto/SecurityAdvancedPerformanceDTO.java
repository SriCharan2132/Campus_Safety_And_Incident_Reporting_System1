package com.campusafety.system.dto;

public class SecurityAdvancedPerformanceDTO {

    private Long securityId;
    private String securityName;
    private long totalAssigned;
    private long resolvedCount;
    private long activeCount;
    private double resolutionRate;
    private Double avgResolutionHours;

    public SecurityAdvancedPerformanceDTO(
            Long securityId,
            String securityName,
            long totalAssigned,
            long resolvedCount,
            long activeCount,
            double resolutionRate,
            Double avgResolutionHours) {

        this.securityId = securityId;
        this.securityName = securityName;
        this.totalAssigned = totalAssigned;
        this.resolvedCount = resolvedCount;
        this.activeCount = activeCount;
        this.resolutionRate = resolutionRate;
        this.avgResolutionHours = avgResolutionHours;
    }

    public Long getSecurityId() { return securityId; }
    public String getSecurityName() { return securityName; }
    public long getTotalAssigned() { return totalAssigned; }
    public long getResolvedCount() { return resolvedCount; }
    public long getActiveCount() { return activeCount; }
    public double getResolutionRate() { return resolutionRate; }
    public Double getAvgResolutionHours() { return avgResolutionHours; }
}