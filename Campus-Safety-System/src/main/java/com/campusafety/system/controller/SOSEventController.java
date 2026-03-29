package com.campusafety.system.controller;

import com.campusafety.system.dto.SOSEventResponseDTO;
import com.campusafety.system.dto.SOSStatsDTO;
import com.campusafety.system.dto.TriggerSOSRequestDTO;
import com.campusafety.system.entity.User;
import com.campusafety.system.security.AuthenticatedUserService;
import com.campusafety.system.service.SOSEventService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
public class SOSEventController {

    private final SOSEventService sosEventService;
    private final AuthenticatedUserService authenticatedUserService;

    public SOSEventController(SOSEventService sosEventService,
                              AuthenticatedUserService authenticatedUserService) {
        this.sosEventService = sosEventService;
        this.authenticatedUserService = authenticatedUserService;
    }

    // =========================
    // 1️⃣ Trigger SOS (STUDENT only)
    // =========================
 // Trigger SOS (STUDENT only)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/trigger")
    public SOSEventResponseDTO triggerSOS(
            @Valid @RequestBody TriggerSOSRequestDTO request) {

        User student = authenticatedUserService.getCurrentUser();

        return sosEventService.mapToDTO(
                sosEventService.triggerSOS(
                        student,
                        request.getLatitude(),
                        request.getLongitude(),
                        request.getDescription(),
                        request.getCategory()
                )
        );
    }

    // =========================
    // 2️⃣ Get Active SOS Alerts
    // ADMIN & SECURITY
    // =========================
    @PreAuthorize("hasRole('ADMIN') or hasRole('SECURITY')")
    @GetMapping("/active")
    public List<SOSEventResponseDTO> getActiveSOS() {

        return sosEventService.getActiveSOS()
                .stream()
                .map(sosEventService::mapToDTO)
                .toList();
    }

    // =========================
    // 3️⃣ Handle SOS (SECURITY only)
    // =========================
    @PreAuthorize("hasRole('SECURITY')")
    @PutMapping("/{id}/handle")
    public SOSEventResponseDTO handleSOS(@PathVariable Long id) {

        User securityUser = authenticatedUserService.getCurrentUser();

        return sosEventService.mapToDTO(
                sosEventService.handleSOS(id, securityUser)
        );
    }

    // =========================
    // 4️⃣ SOS History (ADMIN only)
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public List<SOSEventResponseDTO> getSOSHistory() {

        return sosEventService.getSOSHistory()
                .stream()
                .map(sosEventService::mapToDTO)
                .toList();
    }
    @PreAuthorize("hasRole('ADMIN') or hasRole('SECURITY')")
    @GetMapping("/stats")
    public SOSStatsDTO getSOSStats() {
        User user = authenticatedUserService.getCurrentUser();
        return sosEventService.getSosStats(user);
    }
}