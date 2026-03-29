package com.campusafety.system.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications",
       indexes = {
           @Index(name = "idx_notification_user", columnList = "user_id"),
           @Index(name = "idx_notification_read", columnList = "is_read")
       })
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // user relation
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    // short title
    @Column(nullable = true)
    private String title;

    // message body
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // optional linked incident id
    @Column(nullable = true)
    private Long incidentId;

    // type: "incident", "sos", "generic", etc.
    @Column(nullable = false)
    private String type = "generic";

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Notification() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters below (omitted here for brevity in this message).
    // Make sure to include getters/setters for id, user, title, message, incidentId, type, read, createdAt

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }
    
    public void setRead(boolean read) {
        this.read = read;
    }
    
    public void setIncidentId(Long incidentId) {
        this.incidentId = incidentId;
    }
    public Long getIncidentId() {
        return this.incidentId;
    }
    public String getTitle() {
        return this.title;
    }
    public void setTitle(String title) {
        this.title=title;
    }
    public void setType(String type) {
        this.type=type;
    }
    public String getType() {
        return this.type;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
}