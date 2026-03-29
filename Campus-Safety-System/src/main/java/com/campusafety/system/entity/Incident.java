package com.campusafety.system.entity;

import com.campusafety.system.enums.*;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "incidents",
        indexes = {
                @Index(name = "idx_incident_status", columnList = "status"),
                @Index(name = "idx_incident_priority", columnList = "priority"),
                @Index(name = "idx_incident_created_at", columnList = "createdAt")
        }
)
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnonymousLevel anonymousLevel = AnonymousLevel.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;

    private Double latitude;
    private Double longitude;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Incident() {
        this.createdAt = LocalDateTime.now();
        this.status = IncidentStatus.REPORTED;
    }
    
    // Getters & Setters

    public Long getId() { return id; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }

    public void setDescription(String description) { this.description = description; }

    public AnonymousLevel getAnonymousLevel() { return anonymousLevel; }

    public void setAnonymousLevel(AnonymousLevel anonymousLevel) {
        this.anonymousLevel = anonymousLevel;
    }

    public IncidentCategory getCategory() { return category; }

    public void setCategory(IncidentCategory category) { this.category = category; }

    public Priority getPriority() { return priority; }

    public void setPriority(Priority priority) { this.priority = priority; }

    public IncidentStatus getStatus() { return status; }

    public void setStatus(IncidentStatus status) { this.status = status; }

    public Double getLatitude() { return latitude; }

    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }

    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public User getReporter() { return reporter; }

    public void setReporter(User reporter) { this.reporter = reporter; }

    public User getAssignedTo() { return assignedTo; }

    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    @ManyToOne
    @JoinColumn(name = "owner_admin_id")
    private User ownerAdmin;

    public User getOwnerAdmin() { return ownerAdmin; }
    public void setOwnerAdmin(User ownerAdmin) { this.ownerAdmin = ownerAdmin; }
}