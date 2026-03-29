package com.campusafety.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class IncidentChatMessageRequestDTO {

    @NotBlank
    @Size(max = 2000)
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}