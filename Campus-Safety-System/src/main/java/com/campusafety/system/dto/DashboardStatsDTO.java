package com.campusafety.system.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsDTO {

    private long totalIncidents;
    private long reported;
    private long underReview;
    private long actionTaken;
    private long resolved;
    private long closed;
    private long highPriority;
    private long activeSOS;

    // NEW: optional analytics fields used by the dashboard UI
    private Map<String, Long> priorityCounts;
    private List<Map<String, Object>> incidentTrend;         // [{ "date": "2026-03-01", "total": 5 }, ...]
    private List<IncidentResponseDTO> recentIncidents;

    // Full constructor (use for server responses)
    public DashboardStatsDTO(
            long totalIncidents,
            long reported,
            long underReview,
            long actionTaken,
            long resolved,
            long closed,
            long highPriority,
            long activeSOS,
            Map<String, Long> priorityCounts,
            List<Map<String, Object>> incidentTrend,
            List<IncidentResponseDTO> recentIncidents
    ) {
        this.totalIncidents = totalIncidents;
        this.reported = reported;
        this.underReview = underReview;
        this.actionTaken = actionTaken;
        this.resolved = resolved;
        this.closed = closed;
        this.highPriority = highPriority;
        this.activeSOS = activeSOS;
        this.priorityCounts = priorityCounts;
        this.incidentTrend = incidentTrend;
        this.recentIncidents = recentIncidents;
    }

    // Getters (Jackson needs getters)
    public long getTotalIncidents() { return totalIncidents; }
    public long getReported() { return reported; }
    public long getUnderReview() { return underReview; }
    public long getActionTaken() { return actionTaken; }
    public long getResolved() { return resolved; }
    public long getClosed() { return closed; }
    public long getHighPriority() { return highPriority; }
    public long getActiveSOS() { return activeSOS; }

    public Map<String, Long> getPriorityCounts() { return priorityCounts; }
    public void setPriorityCounts(Map<String, Long> priorityCounts) { this.priorityCounts = priorityCounts; }

    public List<Map<String, Object>> getIncidentTrend() { return incidentTrend; }
    public void setIncidentTrend(List<Map<String, Object>> incidentTrend) { this.incidentTrend = incidentTrend; }

    public List<IncidentResponseDTO> getRecentIncidents() { return recentIncidents; }
    public void setRecentIncidents(List<IncidentResponseDTO> recentIncidents) { this.recentIncidents = recentIncidents; }

    // Default no-arg constructor may be helpful for some serializers
    public DashboardStatsDTO() {}
}