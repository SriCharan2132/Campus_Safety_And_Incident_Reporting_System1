package com.campusafety.system.controller;

import com.campusafety.system.dto.*;
import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.IncidentStatus;
import com.campusafety.system.enums.Priority;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.security.AuthenticatedUserService;
import com.campusafety.system.service.IncidentService;
import com.campusafety.system.service.UserService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;

    public IncidentController(
            IncidentService incidentService,
            UserService userService,
            AuthenticatedUserService authenticatedUserService) {

        this.incidentService = incidentService;
        this.userService = userService;
        this.authenticatedUserService = authenticatedUserService;
    }

    // =========================
    // 1️⃣ Report Incident
    // =========================
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/report")
    public IncidentResponseDTO reportIncident(
            @Valid @RequestBody ReportIncidentRequestDTO request) {

        User reporter = authenticatedUserService.getCurrentUser();

        Incident incident = new Incident();
        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setCategory(request.getCategory());
        incident.setPriority(request.getPriority());
        incident.setAnonymousLevel(request.getAnonymousLevel());
        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        Incident savedIncident =
                incidentService.reportIncident(incident, reporter);

        return incidentService.mapToDTO(savedIncident);
    }

    // =========================
    // 2️⃣ Get All Incidents
    // =========================
    @PreAuthorize("hasRole('SECURITY') or hasRole('ADMIN')")
    @GetMapping
    public List<IncidentResponseDTO> getAllIncidents() {

        return incidentService.getAllIncidents()
                .stream()
                .map(incidentService::mapToDTO)
                .toList();
    }

    // =========================
    // 3️⃣ Get My Incidents
    // =========================
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/my")
    public List<IncidentResponseDTO> getMyIncidents() {

        User loggedInUser = authenticatedUserService.getCurrentUser();

        return incidentService.getIncidentsByUser(loggedInUser)
                .stream()
                .map(incidentService::mapToDTO)
                .toList();
    }

    // =========================
    // 4️⃣ Update Status
    // =========================
    @PreAuthorize("hasRole('SECURITY') or hasRole('ADMIN')")
    @PutMapping("/{incidentId}/status")
    public IncidentResponseDTO updateStatus(
            @PathVariable Long incidentId,
            @Valid @RequestBody UpdateIncidentStatusRequestDTO request) {

        User user = authenticatedUserService.getCurrentUser();
        
        Incident updatedIncident =
                incidentService.updateIncidentStatus(
                        incidentId,
                        request.getNewStatus(),
                        user,
                        request.getRemarks()
                );
        return incidentService.mapToDTO(updatedIncident);
    }

    // =========================
    // 5️⃣ Paginated
    // =========================
    @PreAuthorize("hasRole('SECURITY') or hasRole('ADMIN')")
    @GetMapping("/paginated")
    public Page<IncidentResponseDTO> getIncidentsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {

        return incidentService.getIncidentsPaginated(
                page,
                size,
                status,
                priority,
                search,
                sortBy,
                direction
        );
    }

    // =========================
    // 6️⃣ Assign Incident
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{incidentId}/assign")
    public IncidentResponseDTO assignIncident(
            @PathVariable Long incidentId,
            @Valid @RequestBody AssignIncidentRequestDTO request) {

        User adminUser = authenticatedUserService.getCurrentUser();

        User securityUser = userService.findById(request.getSecurityId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Security user not found"));

        Incident incident =
                incidentService.assignIncident(
                        incidentId,
                        adminUser,
                        securityUser
                );

        return incidentService.mapToDTO(incident);
    }

    // =========================
    // 7️⃣ History
    // =========================
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY','STUDENT')")
    @GetMapping("/{incidentId}/history")
    public List<IncidentHistoryResponseDTO> getIncidentHistory(
            @PathVariable Long incidentId) {

        User currentUser = authenticatedUserService.getCurrentUser();

        return incidentService.getIncidentHistoryWithAccessCheck(
                incidentId,
                currentUser
        );
    }

 // =========================
 // 8️⃣ Upload Media (SECURED)
 // =========================
 @PreAuthorize("hasAnyRole('ADMIN','SECURITY','STUDENT')")
 @PostMapping("/{id}/upload")
 public ResponseEntity<?> upload(
         @PathVariable Long id,
         @RequestParam("file") MultipartFile file) {

     incidentService.uploadMedia(id, file);

     return ResponseEntity.ok("File uploaded successfully");
 }

 // =========================
 // 9️⃣ List Incident Media
 // =========================
 @PreAuthorize("hasAnyRole('ADMIN','SECURITY','STUDENT')")
 @GetMapping("/{incidentId}/media")
 public Page<IncidentMediaResponseDTO> getIncidentMedia(
         @PathVariable Long incidentId,
         @RequestParam(defaultValue = "0") int page,
         @RequestParam(defaultValue = "5") int size) {

     return incidentService.getIncidentMedia(
             incidentId,
             page,
             size
     );
 }
 @GetMapping("/{id}/detail")
 @PreAuthorize("hasAnyRole('ADMIN','SECURITY','STUDENT')")
 public ResponseEntity<IncidentDetailResponseDTO> getIncidentDetail(
         @PathVariable Long id) {

     IncidentDetailResponseDTO response =
             incidentService.getIncidentDetail(id);

     return ResponseEntity.ok(response);
 }
 @PreAuthorize("hasAnyRole('ADMIN','SECURITY')")
 @GetMapping("/assigned")
 public Page<IncidentResponseDTO> getAssignedIncidents(

         @RequestParam(required = false) Long securityId,
         @RequestParam(required = false) String status,
         @RequestParam(required = false) Priority priority,
         @RequestParam(defaultValue = "0") int page,
         @RequestParam(defaultValue = "6") int size,
         @RequestParam(required = false) String search) {

     return incidentService.getAssignedIncidents(
             securityId,
             status,
             priority,
             search,
             page,
             size
     );
 }
 @PreAuthorize("hasRole('ADMIN')")
 @GetMapping("/admin/security-performance")
 public List<SecurityPerformanceDTO> getSecurityPerformance() {

     return incidentService.getSecurityPerformanceSummary();
 }
 @PreAuthorize("hasRole('ADMIN')")
 @GetMapping("/admin/security-advanced-performance")
 public List<SecurityAdvancedPerformanceDTO> getAdvancedPerformance() {

     return incidentService.getAdvancedSecurityPerformance();
 }
 @PreAuthorize("hasRole('STUDENT')")
 @GetMapping("/my/paginated")
 public Page<IncidentResponseDTO> getMyIncidentsPaginated(

		 @RequestParam(required = false) String status,
         @RequestParam(required = false) Priority priority,
         @RequestParam(defaultValue = "0") int page,
         @RequestParam(defaultValue = "6") int size,
         @RequestParam(defaultValue = "createdAt") String sortBy,
         @RequestParam(defaultValue = "desc") String direction,
         @RequestParam(required = false) String search
 ) {

     User student = authenticatedUserService.getCurrentUser();

     return incidentService.getMyIncidentsPaginated(
             student,
             status,
             priority,
             search,
             page,
             size,
             sortBy,
             direction
     );
 }
 @PreAuthorize("hasRole('SECURITY')")
 @GetMapping("/security/my-performance")
 public SecurityAdvancedPerformanceDTO getMyPerformance() {
     return incidentService.getMyPerformance();
 }
 @PreAuthorize("hasRole('ADMIN')")
 @GetMapping("/admin/security-analysis/{securityId}")
 public ResponseEntity<SecurityAnalysisDTO> getSecurityAnalysis(
         @PathVariable Long securityId) {
     return ResponseEntity.ok(incidentService.getSecurityAnalysis(securityId));
 }
 @PreAuthorize("hasAnyRole('STUDENT','SECURITY','ADMIN')")
 @GetMapping("/{id}/remark")
 public ResponseEntity<IncidentRemarkResponseDTO> getRemark(@PathVariable Long id) {
     return ResponseEntity.ok(incidentService.getRemarkForIncident(id));
 }

 @PreAuthorize("hasRole('STUDENT')")
 @PostMapping("/{id}/remark")
 public ResponseEntity<IncidentRemarkResponseDTO> addRemark(
         @PathVariable Long id,
         @Valid @RequestBody IncidentRemarkRequestDTO request
 ) {
     User currentUser = authenticatedUserService.getCurrentUser();
     return ResponseEntity.ok(incidentService.addRemark(id, currentUser, request));
 }
}