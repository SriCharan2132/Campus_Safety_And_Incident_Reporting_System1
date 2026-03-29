package com.campusafety.system.entity;

import com.campusafety.system.enums.SOSStatus;
import com.campusafety.system.enums.IncidentCategory;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "sos_events",
        indexes = {
                @Index(name = "idx_sos_status", columnList = "status"),
                @Index(name = "idx_sos_triggered_at", columnList = "triggeredAt")
        }
)
public class SOSEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Required by JPA
    public SOSEvent() {}

    // 👨‍🎓 Student who triggered SOS
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_sos_student")
    )
    private User student;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    // optional free text details
    @Column(columnDefinition = "text")
    private String description;

    // category (optional)
    @Enumerated(EnumType.STRING)
    private IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SOSStatus status;

    @Column(nullable = false)
    private LocalDateTime triggeredAt;

    public SOSEvent(User student, Double lat, Double lon) {
        this.student = student;
        this.latitude = lat;
        this.longitude = lon;
        this.status = SOSStatus.ACTIVE;
        this.triggeredAt = LocalDateTime.now();
    }

    // 🛡 Security who handled SOS
    @ManyToOne
    @JoinColumn(
            name = "handled_by",
            foreignKey = @ForeignKey(name = "fk_sos_handled_by")
    )
    private User handledBy;

    private LocalDateTime handledAt;

    // ===== Getters & Setters =====

    public Long getId() { return id; }

    public User getStudent() { return student; }

    public void setStudent(User student) { this.student = student; }

    public Double getLatitude() { return latitude; }

    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }

    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDescription() { return description; }

    public void setDescription(String description) { this.description = description; }

    public IncidentCategory getCategory() { return category; }

    public void setCategory(IncidentCategory category) { this.category = category; }

    public SOSStatus getStatus() { return status; }

    public void setStatus(SOSStatus status) { this.status = status; }

    public LocalDateTime getTriggeredAt() { return triggeredAt; }

    public User getHandledBy() { return handledBy; }

    public void setHandledBy(User handledBy) { this.handledBy = handledBy; }

    public LocalDateTime getHandledAt() { return handledAt; }

    public void setHandledAt(LocalDateTime handledAt) { this.handledAt = handledAt; }
}