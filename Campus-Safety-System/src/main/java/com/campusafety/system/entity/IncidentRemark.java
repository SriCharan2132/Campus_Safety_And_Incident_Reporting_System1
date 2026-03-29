package com.campusafety.system.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "incident_remarks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_incident_remark_incident", columnNames = "incident_id")
    }
)
public class IncidentRemark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false, unique = true)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer stars;

    @Column(length = 2000)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Integer getStars() { return stars; }
    public void setStars(Integer stars) { this.stars = stars; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}