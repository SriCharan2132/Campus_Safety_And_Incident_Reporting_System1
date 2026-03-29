package com.campusafety.system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class IncidentRemarkRequestDTO {

    @Min(1)
    @Max(5)
    private Integer stars;

    private String message;

    public Integer getStars() { return stars; }
    public void setStars(Integer stars) { this.stars = stars; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}