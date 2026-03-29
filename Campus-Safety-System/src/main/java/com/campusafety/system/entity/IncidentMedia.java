package com.campusafety.system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.campusafety.system.enums.MediaUploaderType;

@Entity
@Table(
        name = "incident_media",
        indexes = {
                @Index(name = "idx_media_incident", columnList = "incident_id")
        }
)
public class IncidentMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "incident_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_media_incident")
    )
    private Incident incident;

    @Column(name = "file_url", nullable = false, unique = true)
    private String fileUrl;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private boolean aiFlag = false;

    private Double aiConfidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaUploaderType uploaderType;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "uploaded_by",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_media_uploaded_by")
    )
    private User uploadedBy;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    public IncidentMedia() {
        this.uploadedAt = LocalDateTime.now();
    }

    // ===== Getters & Setters =====

    public Long getId() { return id; }

    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public boolean isAiFlag() { return aiFlag; }
    public void setAiFlag(boolean aiFlag) { this.aiFlag = aiFlag; }

    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }

    public MediaUploaderType getUploaderType() { return uploaderType; }
    public void setUploaderType(MediaUploaderType uploaderType) { this.uploaderType = uploaderType; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
}