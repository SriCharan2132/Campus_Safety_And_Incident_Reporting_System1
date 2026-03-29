package com.campusafety.system.entity;

import com.campusafety.system.enums.IncidentStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
	    name = "incident_status_history",
	    indexes = {
	        @Index(name = "idx_status_history_incident", columnList = "incident_id")
	    }
	)
public class IncidentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    // 🔥 oldStatus can be NULL for first entry
    @Enumerated(EnumType.STRING)
    private IncidentStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus newStatus;

    // 🔥 changedBy can be NULL for anonymous report
    @ManyToOne
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    // ===== Constructors =====
    public IncidentStatusHistory() {
        this.changedAt = LocalDateTime.now();
    }

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public void setIncident(Incident incident) {
        this.incident = incident;
    }

    public IncidentStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(IncidentStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public IncidentStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(IncidentStatus newStatus) {
        this.newStatus = newStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}