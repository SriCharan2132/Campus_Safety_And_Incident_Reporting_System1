package com.campusafety.system.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.campusafety.system.enums.AnonymousLevel;
import com.campusafety.system.enums.IncidentCategory;
import com.campusafety.system.enums.IncidentStatus;
import com.campusafety.system.enums.Priority;

public class IncidentDetailResponseDTO {

    private Long id;
    private String title;
    private String description;
    private IncidentCategory category;
    private Priority priority;
    private IncidentStatus status;
    private AnonymousLevel anonymousLevel;
    private LocalDateTime createdAt;
    private IncidentRemarkResponseDTO remark;
    private boolean canAddRemark;
    private List<IncidentTrackingStepDTO> trackingSteps;
    private ReporterInfo reporter;
    private AssignedSecurityInfo assignedSecurity;

    private List<IncidentHistoryResponseDTO> history;
    private List<IncidentMediaResponseDTO> media;

    private String resolutionSummary;

    // ===== Getters & Setters =====
    private Double latitude;
    private Double longitude;
    // getters and setters for latitude/longitude
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IncidentCategory getCategory() {
        return category;
    }

    public void setCategory(IncidentCategory category) {
        this.category = category;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public AnonymousLevel getAnonymousLevel() {
        return anonymousLevel;
    }

    public void setAnonymousLevel(AnonymousLevel anonymousLevel) {
        this.anonymousLevel = anonymousLevel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ReporterInfo getReporter() {
        return reporter;
    }

    public void setReporter(ReporterInfo reporter) {
        this.reporter = reporter;
    }

    public AssignedSecurityInfo getAssignedSecurity() {
        return assignedSecurity;
    }

    public void setAssignedSecurity(AssignedSecurityInfo assignedSecurity) {
        this.assignedSecurity = assignedSecurity;
    }

    public List<IncidentHistoryResponseDTO> getHistory() {
        return history;
    }

    public void setHistory(List<IncidentHistoryResponseDTO> history) {
        this.history = history;
    }

    public List<IncidentMediaResponseDTO> getMedia() {
        return media;
    }

    public void setMedia(List<IncidentMediaResponseDTO> media) {
        this.media = media;
    }

    public String getResolutionSummary() {
        return resolutionSummary;
    }

    public void setResolutionSummary(String resolutionSummary) {
        this.resolutionSummary = resolutionSummary;
    }
    public IncidentRemarkResponseDTO getRemark() {
        return remark;
    }

    public void setRemark(IncidentRemarkResponseDTO remark) {
        this.remark = remark;
    }

    public boolean isCanAddRemark() {
        return canAddRemark;
    }

    public void setCanAddRemark(boolean canAddRemark) {
        this.canAddRemark = canAddRemark;
    }

    public List<IncidentTrackingStepDTO> getTrackingSteps() {
        return trackingSteps;
    }

    public void setTrackingSteps(List<IncidentTrackingStepDTO> trackingSteps) {
        this.trackingSteps = trackingSteps;
    }
    private AdminInfo ownerAdmin;

    public AdminInfo getOwnerAdmin() { return ownerAdmin; }
    public void setOwnerAdmin(AdminInfo ownerAdmin) { this.ownerAdmin = ownerAdmin; }
}