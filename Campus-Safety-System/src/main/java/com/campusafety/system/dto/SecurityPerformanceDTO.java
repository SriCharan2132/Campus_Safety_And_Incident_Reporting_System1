package com.campusafety.system.dto;

public class SecurityPerformanceDTO {

    private Long securityId;
    private String securityName;
    private long totalAssigned;
    private long underReview;
    private long actionTaken;
    private long resolved;
    private long closed;

    public SecurityPerformanceDTO(
            Long securityId,
            String securityName,
            long totalAssigned,
            long underReview,
            long actionTaken,
            long resolved,
            long closed) {

        this.securityId = securityId;
        this.securityName = securityName;
        this.totalAssigned = totalAssigned;
        this.underReview = underReview;
        this.actionTaken = actionTaken;
        this.resolved = resolved;
        this.closed = closed;
    }

    public Long getSecurityId() { return securityId; }
    public String getSecurityName() { return securityName; }
    public long getTotalAssigned() { return totalAssigned; }
    public long getUnderReview() { return underReview; }
    public long getActionTaken() { return actionTaken; }
    public long getResolved() { return resolved; }
    public long getClosed() { return closed; }
}