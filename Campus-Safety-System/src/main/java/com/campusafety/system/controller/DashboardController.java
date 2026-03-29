package com.campusafety.system.controller;

import com.campusafety.system.dto.DashboardStatsDTO;
import com.campusafety.system.dto.SecurityDashboardStatsDTO;
import com.campusafety.system.service.IncidentService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final IncidentService incidentService;

    public DashboardController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public DashboardStatsDTO getStats(@RequestParam(value = "days", required = false, defaultValue = "30") int days) {
        return incidentService.getDashboardStats(days);
    }
    @PreAuthorize("hasRole('SECURITY')")
    @GetMapping("/security-stats")
    public SecurityDashboardStatsDTO getSecurityStats() {
        return incidentService.getSecurityStats();
    }
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student-stats")
    public DashboardStatsDTO getStudentStats() {
        return incidentService.getStudentDashboardStats();
    }
}