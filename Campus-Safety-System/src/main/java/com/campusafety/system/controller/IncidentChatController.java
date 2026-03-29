package com.campusafety.system.controller;

import com.campusafety.system.dto.IncidentChatMessageRequestDTO;
import com.campusafety.system.dto.IncidentChatMessageResponseDTO;
import com.campusafety.system.service.IncidentChatService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents/{incidentId}/chat")
public class IncidentChatController {

    private final IncidentChatService incidentChatService;

    public IncidentChatController(IncidentChatService incidentChatService) {
        this.incidentChatService = incidentChatService;
    }

    @PreAuthorize("hasAnyRole('STUDENT','SECURITY','ADMIN')")
    @GetMapping
    public List<IncidentChatMessageResponseDTO> getMessages(@PathVariable Long incidentId) {
        return incidentChatService.getMessages(incidentId);
    }

    @PreAuthorize("hasAnyRole('STUDENT','SECURITY','ADMIN')")
    @PostMapping
    public IncidentChatMessageResponseDTO sendMessage(
            @PathVariable Long incidentId,
            @Valid @RequestBody IncidentChatMessageRequestDTO request
    ) {
        return incidentChatService.sendMessage(incidentId, request);
    }
}