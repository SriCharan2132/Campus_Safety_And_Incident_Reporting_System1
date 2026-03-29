package com.campusafety.system.dto;

import java.util.List;
import java.util.Map;

public class SecurityDashboardStatsDTO {

    private long assigned;
    private long pending;
    private long underReview;
    private long actionTaken;
    private long highPriority;

    // optional detailed fields
    private Map<String, Long> priorityCounts;            // e.g. {"HIGH":10,"MEDIUM":5}
    private List<Map<String, Object>> incidentTrend;     // list of { "date": "2026-03-01", "total": 5 }
    private List<IncidentResponseDTO> recentIncidents;   // top recent incidents

    public SecurityDashboardStatsDTO() {}

    public SecurityDashboardStatsDTO(
            long assigned,
            long pending,
            long underReview,
            long actionTaken,
            long highPriority
    ) {
        this.assigned = assigned;
        this.pending = pending;
        this.underReview = underReview;
        this.actionTaken = actionTaken;
        this.highPriority = highPriority;
    }

    public SecurityDashboardStatsDTO(
            long assigned,
            long pending,
            long underReview,
            long actionTaken,
            long highPriority,
            Map<String, Long> priorityCounts,
            List<Map<String, Object>> incidentTrend,
            List<IncidentResponseDTO> recentIncidents
    ) {
        this.assigned = assigned;
        this.pending = pending;
        this.underReview = underReview;
        this.actionTaken = actionTaken;
        this.highPriority = highPriority;
        this.priorityCounts = priorityCounts;
        this.incidentTrend = incidentTrend;
        this.recentIncidents = recentIncidents;
    }

    // getters & setters
    public long getAssigned() { return assigned; }
    public void setAssigned(long assigned) { this.assigned = assigned; }

    public long getPending() { return pending; }
    public void setPending(long pending) { this.pending = pending; }

    public long getUnderReview() { return underReview; }
    public void setUnderReview(long underReview) { this.underReview = underReview; }

    public long getActionTaken() { return actionTaken; }
    public void setActionTaken(long actionTaken) { this.actionTaken = actionTaken; }

    public long getHighPriority() { return highPriority; }
    public void setHighPriority(long highPriority) { this.highPriority = highPriority; }

    public Map<String, Long> getPriorityCounts() { return priorityCounts; }
    public void setPriorityCounts(Map<String, Long> priorityCounts) { this.priorityCounts = priorityCounts; }

    public List<Map<String, Object>> getIncidentTrend() { return incidentTrend; }
    public void setIncidentTrend(List<Map<String, Object>> incidentTrend) { this.incidentTrend = incidentTrend; }

    public List<IncidentResponseDTO> getRecentIncidents() { return recentIncidents; }
    public void setRecentIncidents(List<IncidentResponseDTO> recentIncidents) { this.recentIncidents = recentIncidents; }
}