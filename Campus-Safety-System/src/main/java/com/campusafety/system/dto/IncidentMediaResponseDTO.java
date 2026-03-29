package com.campusafety.system.dto;

import java.time.LocalDateTime;
import com.campusafety.system.enums.MediaUploaderType;

public class IncidentMediaResponseDTO {

    private Long id;
    private String fileUrl;
    private boolean aiFlag;
    private Double aiConfidence;
    private LocalDateTime uploadedAt;
    private MediaUploaderType uploaderType;
    private String uploadedBy;
    private String contentType;

    public IncidentMediaResponseDTO(
            Long id,
            String fileUrl,
            boolean aiFlag,
            Double aiConfidence,
            LocalDateTime uploadedAt,
            MediaUploaderType uploaderType,
            String uploadedBy,
            String contentType) {

        this.id = id;
        this.fileUrl = fileUrl;
        this.aiFlag = aiFlag;
        this.aiConfidence = aiConfidence;
        this.uploadedAt = uploadedAt;
        this.uploaderType = uploaderType;
        this.uploadedBy = uploadedBy;
        this.contentType = contentType;
    }

    public Long getId() { return id; }
    public String getFileUrl() { return fileUrl; }
    public boolean isAiFlag() { return aiFlag; }
    public Double getAiConfidence() { return aiConfidence; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public MediaUploaderType getUploaderType() { return uploaderType; }
    public String getUploadedBy() { return uploadedBy; }
    public String getContentType() { return contentType; }
}