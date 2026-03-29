package com.campusafety.system.service;

import com.campusafety.system.dto.AdminInfo;
import com.campusafety.system.dto.AssignedSecurityInfo;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import com.campusafety.system.dto.AssignmentNotificationDTO;
import com.campusafety.system.dto.CreateUserRequestDTO;
import com.campusafety.system.dto.DashboardStatsDTO;
import com.campusafety.system.dto.IncidentDetailResponseDTO;
import com.campusafety.system.dto.IncidentHistoryResponseDTO;
import com.campusafety.system.dto.IncidentMediaResponseDTO;
import com.campusafety.system.dto.IncidentRemarkRequestDTO;
import com.campusafety.system.dto.IncidentRemarkResponseDTO;
import com.campusafety.system.dto.IncidentResponseDTO;
import com.campusafety.system.dto.IncidentTrackingStepDTO;
import com.campusafety.system.dto.ReporterInfo;
import com.campusafety.system.dto.SecurityAdvancedPerformanceDTO;
import com.campusafety.system.dto.SecurityAnalysisDTO;
import com.campusafety.system.dto.SecurityDashboardStatsDTO;
import com.campusafety.system.dto.SecurityPerformanceDTO;
import com.campusafety.system.dto.UpdateUserRequestDTO;
import com.campusafety.system.dto.UserManagementResponseDTO;
import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.IncidentMedia;
import com.campusafety.system.entity.IncidentRemark;
import com.campusafety.system.entity.IncidentStatusHistory;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.*;
import com.campusafety.system.exception.BusinessException;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.repository.IncidentMediaRepository;
import com.campusafety.system.repository.IncidentRemarkRepository;
import com.campusafety.system.repository.IncidentRepository;
import com.campusafety.system.repository.IncidentStatusHistoryRepository;
import com.campusafety.system.repository.SOSEventRepository;
import com.campusafety.system.repository.UserRepository;
import com.campusafety.system.security.AuthenticatedUserService;
import com.campusafety.system.security.SecurityConfig;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.campusafety.system.dto.AssignedSecurityInfo;
import com.campusafety.system.dto.ReporterInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;
import com.campusafety.system.entity.Notification;
import com.campusafety.system.repository.NotificationRepository;
import java.util.List;
import java.util.Optional;
@Service
public class IncidentService {

	private final NotificationRepository notificationRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentStatusHistoryRepository statusHistoryRepository;
    private final SOSEventRepository sosEventRepository;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;
    private final IncidentMediaRepository incidentMediaRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger =
            LoggerFactory.getLogger(IncidentService.class);
    private final IncidentRemarkRepository incidentRemarkRepository;
    @Autowired
 // constructor: ensure NotificationRepository injected (you already had it)
    public IncidentService(
            IncidentRepository incidentRepository,
            IncidentStatusHistoryRepository statusHistoryRepository,
            SOSEventRepository sosEventRepository,
            EmailService emailService,
            FileStorageService fileStorageService,
            IncidentMediaRepository incidentMediaRepository,
            AuthenticatedUserService authenticatedUserService,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationRepository notificationRepository,
            IncidentRemarkRepository incidentRemarkRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.sosEventRepository = sosEventRepository;
        this.emailService = emailService;
        this.fileStorageService = fileStorageService;
        this.incidentMediaRepository = incidentMediaRepository;
        this.authenticatedUserService = authenticatedUserService;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.incidentRemarkRepository=incidentRemarkRepository;
    }

    // helper to persist + send (single place to send)
 // inside IncidentService
    
    private void persistAndSendToUser(User user, AssignmentNotificationDTO dto) {

        if (user == null || dto == null) return;

        try {

            Notification notif = new Notification();
            notif.setUser(user);
            notif.setTitle(dto.getTitle() != null ? dto.getTitle() : "Notification");
            notif.setMessage(dto.getMessage());
            notif.setIncidentId(dto.getIncidentId());
            notif.setType("incident");
            notif.setRead(false);
            notif.setCreatedAt(
                    dto.getAssignedAt() != null
                            ? dto.getAssignedAt()
                            : LocalDateTime.now()
            );

            Notification saved = notificationRepository.save(notif);

            String email = user.getEmail();

            Map<String, Object> payload = Map.of(
                    "event", "created",
                    "id", saved.getId(),
                    "incidentId", saved.getIncidentId(),
                    "title", saved.getTitle(),
                    "message", saved.getMessage(),
                    "type", saved.getType(),
                    "createdAt", saved.getCreatedAt()
            );

            messagingTemplate.convertAndSendToUser(
                    email,
                    "/queue/user-notifications",
                    payload
            );

            long unread =
                    notificationRepository.countByUserAndReadFalse(user);

            messagingTemplate.convertAndSendToUser(
                    email,
                    "/queue/user-notifications",
                    Map.of("event", "unread_count", "unread", unread)
            );

        } catch (Exception e) {

            logger.error(
                    "Failed to persist/send notification to {}",
                    user.getEmail(),
                    e
            );
        }
    }
    // 1️⃣ Report new incident
    @Transactional
    public Incident reportIncident(Incident incident, User reporter) {
    	
        incident.setReporter(reporter);
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setCreatedAt(LocalDateTime.now());

        Incident savedIncident = incidentRepository.save(incident);

        IncidentStatusHistory history = new IncidentStatusHistory();
        history.setIncident(savedIncident);
        history.setOldStatus(null);
        history.setNewStatus(IncidentStatus.REPORTED);

        history.setChangedBy(reporter);
        history.setRemarks("Incident reported");

        statusHistoryRepository.save(history);

        return savedIncident;
    }

    // 2️⃣ Get incidents reported by a user
    @Transactional(readOnly = true)
    public List<Incident> getIncidentsByUser(User user) {
        return incidentRepository.findByReporter(user);
    }

    // 3️⃣ Get all incidents
    @Transactional(readOnly = true)
    public List<Incident> getAllIncidents() {
    	logger.info("action=get_all_incidents requested");
        return incidentRepository.findAll();
    }

    // 4️⃣ Get incident by ID
    @Transactional(readOnly = true)
    public Incident getIncidentById(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Incident not found"));
    }

    // 🔐 Workflow validation
    private boolean isValidTransition(
            IncidentStatus current,
            IncidentStatus next) {

        switch (current) {
            case REPORTED:
                return next == IncidentStatus.UNDER_REVIEW;

            case UNDER_REVIEW:
                return next == IncidentStatus.ACTION_TAKEN;

            case ACTION_TAKEN:
                return next == IncidentStatus.RESOLVED;

            case RESOLVED:
                return next == IncidentStatus.CLOSED;

            case CLOSED:
                return false;

            default:
                return false;
        }
    }

    // 🔐 Role-based permission validation
    private void validateRolePermission(
            IncidentStatus newStatus,
            User user) {

        switch (newStatus) {

            case UNDER_REVIEW:
            case ACTION_TAKEN:
                if (user.getRole() != Role.SECURITY) {
                    throw new AccessDeniedException(
                            "Only SECURITY can move to " + newStatus);
                }
                break;

            case RESOLVED:
            case CLOSED:
                if (user.getRole() != Role.ADMIN) {
                    throw new AccessDeniedException(
                            "Only ADMIN can resolve or close incidents");
                }
                break;

            default:
                break;
        }
    }
    
    // 5️⃣ Update incident status
    @Transactional
    public Incident updateIncidentStatus(
            Long incidentId,
            IncidentStatus newStatus,
            User updatedBy,
            String remarks) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

        IncidentStatus currentStatus = incident.getStatus();
        if (updatedBy.getRole() == Role.ADMIN) {
            if (incident.getOwnerAdmin() == null) {
                incident.setOwnerAdmin(updatedBy); // first admin to start the process
            } else if (!incident.getOwnerAdmin().getId().equals(updatedBy.getId())) {
                throw new AccessDeniedException("This incident is controlled by another admin");
            }
        }
        validateRolePermission(newStatus, updatedBy);
        
        if (updatedBy.getRole() == Role.SECURITY) {
            if (incident.getAssignedTo() == null) {
                throw new BusinessException("Incident not assigned to any SECURITY");
            }
            if (!incident.getAssignedTo().getId().equals(updatedBy.getId())) {
                throw new AccessDeniedException("You are not assigned to this incident");
            }
        }

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new BusinessException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        incident.setStatus(newStatus);
        incident.setUpdatedAt(LocalDateTime.now());

        Incident updatedIncident = incidentRepository.save(incident);

        IncidentStatusHistory history = new IncidentStatusHistory();
        history.setIncident(updatedIncident);
        history.setOldStatus(currentStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(updatedBy);
        history.setRemarks(remarks);

        statusHistoryRepository.save(history);
        // email to reporter (existing)
        if (incident.getReporter() != null) {
            try {
                String htmlContent = """
                    <div style="font-family: Arial; padding:20px;">
                        <h2>🔄 Incident Status Updated</h2>
                        <p><strong>Title:</strong> %s</p>
                        <p><strong>New Status:</strong> %s</p>
                    </div>
                """.formatted(incident.getTitle(), newStatus);

                emailService.sendHtmlEmail(
                        incident.getReporter().getEmail(),
                        "Incident Status Updated",
                        htmlContent
                );
            } catch (Exception e) {
                logger.error("Failed to send status update email for incident {}", incidentId, e);
            }
        }

        // 🔔 Now do targeted WebSocket notifications per rules:
        // Rules:
        // 2) If SECURITY made action -> notify ADMIN(s) and REPORTER (student)
        // 3) If ADMIN made action -> notify REPORTER and ASSIGNED SECURITY

        // Create a generic notification DTO (you can reuse AssignmentNotificationDTO or make a new StatusNotificationDTO)
     // Notify reporter (if exists)
     // 🔔 Notify reporter
        AssignmentNotificationDTO notifForReporter = new AssignmentNotificationDTO(
                null,
                updatedIncident.getId(),
                updatedIncident.getTitle(),
                "Status updated to " + newStatus + " by " + updatedBy.getName(),
                updatedIncident.getUpdatedAt()
        );

        if (updatedIncident.getReporter() != null &&
            !updatedIncident.getReporter().getId().equals(updatedBy.getId())) {

            persistAndSendToUser(updatedIncident.getReporter(), notifForReporter);
        }

        // 🔔 If SECURITY updated → notify ADMINS
        if (updatedBy.getRole() == Role.SECURITY) {

            List<User> admins = userRepository.findByRole(Role.ADMIN);

            AssignmentNotificationDTO adminNotif = new AssignmentNotificationDTO(
                    null,
                    updatedIncident.getId(),
                    updatedIncident.getTitle(),
                    "Status updated by security: " + updatedBy.getName(),
                    updatedIncident.getUpdatedAt()
            );

            for (User admin : admins) {
                persistAndSendToUser(admin, adminNotif);
            }
        }

        // 🔔 If ADMIN updated → notify assigned SECURITY
        else if (updatedBy.getRole() == Role.ADMIN) {

            if (updatedIncident.getAssignedTo() != null &&
                !updatedIncident.getAssignedTo().getId().equals(updatedBy.getId())) {

                AssignmentNotificationDTO secNotif = new AssignmentNotificationDTO(
                        null,
                        updatedIncident.getId(),
                        updatedIncident.getTitle(),
                        "Status updated by admin: " + updatedBy.getName(),
                        updatedIncident.getUpdatedAt()
                );

                persistAndSendToUser(updatedIncident.getAssignedTo(), secNotif);
            }
        }

       
        logger.info("Incident {} status changed from {} to {} by {}",
                incidentId,
                currentStatus,
                newStatus,
                updatedBy.getEmail());

        return updatedIncident;
    }
    // 6️⃣ Map entity to DTO
    public IncidentResponseDTO mapToDTO(Incident incident) {

        String reporterName = null;

        if (incident.getReporter() != null) {

            if (incident.getAnonymousLevel() == AnonymousLevel.NONE) {
                reporterName = incident.getReporter().getName();
            } else {
                reporterName = "ANONYMOUS";
            }
        }

        return new IncidentResponseDTO(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getCategory(),
                incident.getPriority(),
                incident.getStatus(),
                incident.getAnonymousLevel(),
                reporterName,
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getLatitude(),
                incident.getLongitude()
        );
    }

    // 7️⃣ Pagination + filtering
    @Transactional(readOnly = true)
    public Page<IncidentResponseDTO> getIncidentsPaginated(
            int page,
            int size,
            String status,
            Priority priority,
            String search,
            String sortBy,
            String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Incident> spec = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();

            spec = spec.and((root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                predicates.add(cb.like(cb.lower(root.get("title")), "%" + q + "%"));
                predicates.add(cb.like(cb.lower(root.get("description")), "%" + q + "%"));

                try {
                    IncidentCategory category = IncidentCategory.valueOf(q.toUpperCase());
                    predicates.add(cb.equal(root.get("category"), category));
                } catch (Exception ignored) {
                }

                return cb.or(predicates.toArray(new Predicate[0]));
            });
        }

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            if (status.equalsIgnoreCase("ACTIVE")) {
                spec = spec.and((root, query, cb) ->
                        root.get("status").in(
                                IncidentStatus.REPORTED,
                                IncidentStatus.UNDER_REVIEW,
                                IncidentStatus.ACTION_TAKEN
                        )
                );
            } else {
                IncidentStatus incidentStatus = IncidentStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), incidentStatus));
            }
        }

        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }

        Page<Incident> result = incidentRepository.findAll(spec, pageable);
        return result.map(this::mapToDTO);
    }

    // 8️⃣ Dashboard stats
    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats(int days) {

        if (days <= 0) days = 30; // fallback

        long total = incidentRepository.count();

        long reported = incidentRepository.countByStatus(IncidentStatus.REPORTED);
        long underReview = incidentRepository.countByStatus(IncidentStatus.UNDER_REVIEW);
        long actionTaken = incidentRepository.countByStatus(IncidentStatus.ACTION_TAKEN);
        long resolved = incidentRepository.countByStatus(IncidentStatus.RESOLVED);
        long closed = incidentRepository.countByStatus(IncidentStatus.CLOSED);

        long high = incidentRepository.countByPriority(Priority.HIGH);
        long medium = incidentRepository.countByPriority(Priority.MEDIUM);
        long low = incidentRepository.countByPriority(Priority.LOW);

        long sos = sosEventRepository.countByStatus(SOSStatus.ACTIVE);

        Map<String, Long> priorityCounts = Map.of(
                "HIGH", high,
                "MEDIUM", medium,
                "LOW", low
        );

        // recent incidents (5 newest)
        Page<Incident> page = incidentRepository.findAll(
                PageRequest.of(0, 5, Sort.by("createdAt").descending())
        );

        List<IncidentResponseDTO> recent = page.getContent()
                .stream()
                .map(this::mapToDTO)
                .toList();

        /* ------------ trend building (last `days` days) -------------- */
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        LocalDate startDate = today.minusDays(days - 1); // include today as last element

        LocalDateTime startLdt = startDate.atStartOfDay();
        LocalDateTime endLdt = today.plusDays(1).atStartOfDay().minusNanos(1);

        // fetch incidents in range and count per date in Java
        List<Incident> incidentsInRange = incidentRepository.findByCreatedAtBetween(startLdt, endLdt);

        // build a map date->count (ISO date string "yyyy-MM-dd")
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        Map<String, Long> countsMap = new HashMap<>();
        for (Incident inc : incidentsInRange) {
            if (inc.getCreatedAt() == null) continue;
            String d = inc.getCreatedAt().toLocalDate().format(fmt);
            countsMap.put(d, countsMap.getOrDefault(d, 0L) + 1L);
        }

        // produce a list of maps for each day (old -> new), fill zeros for empty days
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate day = startDate.plusDays(i);
            String ds = day.format(fmt);
            long cnt = countsMap.getOrDefault(ds, 0L);
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", ds);
            entry.put("total", cnt);
            trend.add(entry);
        }

        return new DashboardStatsDTO(
                total, reported, underReview, actionTaken,
                resolved, closed, high, sos,
                priorityCounts, trend, recent
        );
    }

    // 9️⃣ Assign incident
    @Transactional
    public Incident assignIncident(Long incidentId, User adminUser, User securityUser) {

        if (adminUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can assign incidents");
        }

        if (securityUser.getRole() != Role.SECURITY) {
            throw new BusinessException("Can only assign to SECURITY users");
        }

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

        // ✅ RULE 1: Only REPORTED / UNDER_REVIEW
        if (incident.getStatus() != IncidentStatus.REPORTED &&
            incident.getStatus() != IncidentStatus.UNDER_REVIEW) {
            throw new BusinessException("Assignment allowed only in REPORTED or UNDER_REVIEW");
        }

        // ✅ RULE 2: OWNER ADMIN LOGIC
        if (incident.getOwnerAdmin() == null) {
            incident.setOwnerAdmin(adminUser); // first admin becomes owner
        } else if (!incident.getOwnerAdmin().getId().equals(adminUser.getId())) {
            throw new AccessDeniedException("This incident is controlled by another admin");
        }

        User previousAssignee = incident.getAssignedTo();

        if (previousAssignee != null &&
            previousAssignee.getId().equals(securityUser.getId())) {
            throw new BusinessException("Already assigned to this security");
        }

        // ✅ IMPORTANT: store old status BEFORE change
        IncidentStatus oldStatus = incident.getStatus();

        incident.setAssignedTo(securityUser);
        incident.setAssignedAt(LocalDateTime.now());

        // ✅ RESET STATUS
        incident.setStatus(IncidentStatus.REPORTED);

        incident.setUpdatedAt(LocalDateTime.now());

        Incident savedIncident = incidentRepository.save(incident);

        // ✅ HISTORY FIXED
        IncidentStatusHistory history = new IncidentStatusHistory();
        history.setIncident(savedIncident);
        history.setOldStatus(oldStatus);
        history.setNewStatus(IncidentStatus.REPORTED);
        history.setChangedBy(adminUser);

        String previousName = previousAssignee == null
                ? "UNASSIGNED"
                : previousAssignee.getName();

        history.setRemarks(
                String.format(
                        "Reassigned from %s to %s by %s (status reset to REPORTED)",
                        previousName,
                        securityUser.getName(),
                        adminUser.getName()
                )
        );

        statusHistoryRepository.save(history);

        // 🔔 NOTIFICATIONS (keep same)
        AssignmentNotificationDTO securityNotif = new AssignmentNotificationDTO(
                null,
                savedIncident.getId(),
                savedIncident.getTitle(),
                "You have been assigned a new incident",
                savedIncident.getAssignedAt()
        );

        persistAndSendToUser(securityUser, securityNotif);

        if (savedIncident.getReporter() != null) {
            AssignmentNotificationDTO reporterNotif = new AssignmentNotificationDTO(
                    null,
                    savedIncident.getId(),
                    savedIncident.getTitle(),
                    "Your report has been assigned to " + securityUser.getName(),
                    savedIncident.getAssignedAt()
            );

            persistAndSendToUser(savedIncident.getReporter(), reporterNotif);
        }
        try {
            String htmlContent = """
                <div style="font-family: Arial; padding:20px;">
                    <h2>📌 New Incident Assigned</h2>
                    <p><strong>Title:</strong> %s</p>
                    <p>Please review and take action.</p>
                </div>
            """.formatted(savedIncident.getTitle());

            emailService.sendHtmlEmail(
                    securityUser.getEmail(),
                    "New Incident Assigned",
                    htmlContent);

        } catch (Exception e) {
            logger.error("Failed to send assignment email for incident {}", incidentId, e);
        }
        return savedIncident;
    }
    
    // 🔟 History (with anonymity protection)
    @Transactional(readOnly = true)
    public List<IncidentHistoryResponseDTO>
    getIncidentHistoryWithAccessCheck(
            Long incidentId,
            User currentUser) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Incident not found"));

        if (currentUser.getRole() == Role.STUDENT) {
            if (incident.getReporter() == null ||
                !incident.getReporter().getId()
                        .equals(currentUser.getId())) {

                throw new AccessDeniedException(
                        "You can only view history of your own incidents");
            }
        }

        return statusHistoryRepository
                .findByIncidentOrderByChangedAtAsc(incident)
                .stream()
                .map(history -> {

                    String changedByName =
                            history.getChangedBy() == null
                                    ? "ANONYMOUS"
                                    : history.getChangedBy().getName();

                    return new IncidentHistoryResponseDTO(
                            history.getOldStatus(),
                            history.getNewStatus(),
                            changedByName,
                            history.getChangedAt(),
                            history.getRemarks());
                })
                .toList();
    }
    @Transactional
    public void uploadMedia(Long incidentId, MultipartFile file) {

        if (file.isEmpty()) {
            throw new BusinessException("File cannot be empty");
        }

        // 🔒 File size limit (20MB)
        long maxSize = 20 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BusinessException("File exceeds 20MB limit");
        }

        String contentType = file.getContentType();

        // 🔒 Only image / video allowed
        if (contentType == null ||
            (!contentType.startsWith("image/") &&
             !contentType.startsWith("video/"))) {
            throw new BusinessException("Only image and video files allowed");
        }

        User currentUser = authenticatedUserService.getCurrentUser();

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
     // 🚫 Prevent upload if incident is CLOSED
        if (incident.getStatus() == IncidentStatus.CLOSED) {
            throw new BusinessException("Cannot upload media to a CLOSED incident");
        }
        // 🔐 Access control
        if (currentUser.getRole() == Role.STUDENT) {
            if (incident.getReporter() == null ||
                !incident.getReporter().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You cannot upload to this incident");
            }
        }

        if (currentUser.getRole() == Role.SECURITY) {
            if (incident.getAssignedTo() == null ||
                !incident.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You cannot upload to this incident");
            }
        }

        String storedFileName = fileStorageService.storeFile(file);

        IncidentMedia media = new IncidentMedia();
        media.setIncident(incident);
        media.setFileUrl(storedFileName);
        media.setContentType(contentType);
        media.setUploadedBy(currentUser);

        if (currentUser.getRole() == Role.STUDENT) {
            media.setUploaderType(MediaUploaderType.STUDENT);
        } else {
            media.setUploaderType(MediaUploaderType.SECURITY);
        }

        incidentMediaRepository.save(media);
    }
    @Transactional(readOnly = true)
    public Page<IncidentMediaResponseDTO> getIncidentMedia(
            Long incidentId,
            int page,
            int size) {

        User currentUser = authenticatedUserService.getCurrentUser();

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

        validateMediaAccess(incident, currentUser);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("uploadedAt").descending()
        );

        return mapMedia(incidentId, pageable);
    }
    private void validateMediaAccess(Incident incident, User currentUser) {

        if (currentUser.getRole() == Role.ADMIN) return;

        if (currentUser.getRole() == Role.STUDENT) {
            if (incident.getReporter() == null ||
                !incident.getReporter().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You cannot access this media");
            }
            return;
        }

        if (currentUser.getRole() == Role.SECURITY) {
            if (incident.getAssignedTo() == null ||
                !incident.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You cannot access this media");
            }
            return;
        }

        throw new AccessDeniedException("Unauthorized access");
    }
    private Page<IncidentMediaResponseDTO> mapMedia(
            Long incidentId,
            Pageable pageable) {

        Page<IncidentMedia> mediaPage =
                incidentMediaRepository.findByIncidentId(incidentId, pageable);

        return mediaPage.map(media -> new IncidentMediaResponseDTO(
                media.getId(),
                "/api/media/" + media.getId(),   // 🔥 change here
                media.isAiFlag(),
                media.getAiConfidence(),
                media.getUploadedAt(),
                media.getUploaderType(),
                media.getUploadedBy().getName(),
                media.getContentType()
        ));
    }

    private IncidentHistoryResponseDTO mapHistory(
            IncidentStatusHistory history,
            Incident incident,
            User currentUser) {

        String changedByName = "SYSTEM";

        if (history.getChangedBy() != null) {

            User changer = history.getChangedBy();

            // If changer is reporter
            if (incident.getReporter() != null &&
                changer.getId().equals(incident.getReporter().getId())) {

                AnonymousLevel level = incident.getAnonymousLevel();

                if (currentUser.getRole() == Role.ADMIN) {

                    if (level == AnonymousLevel.NONE ||
                        level == AnonymousLevel.SECURITY_ONLY) {
                        changedByName = changer.getName();
                    } else {
                        changedByName = "REPORTER";
                    }

                } else if (currentUser.getRole() == Role.SECURITY) {

                    if (level == AnonymousLevel.NONE) {
                        changedByName = changer.getName();
                    } else {
                        changedByName = "REPORTER";
                    }

                } else {
                    // student viewing own
                    changedByName = changer.getName();
                }

            } else {
                // Admin or Security changed status
                changedByName = changer.getName();
            }
        }

        return new IncidentHistoryResponseDTO(
                history.getOldStatus(),
                history.getNewStatus(),
                changedByName,
                history.getChangedAt(),
                history.getRemarks()
        );
    }
    private IncidentMediaResponseDTO mapMediaToDTO(IncidentMedia media) {

        return new IncidentMediaResponseDTO(
                media.getId(),
                "/api/media/" + media.getId(),   // IMPORTANT: use mediaId not filename
                media.isAiFlag(),
                media.getAiConfidence(),
                media.getUploadedAt(),
                media.getUploaderType(),
                media.getUploadedBy().getName(),
                media.getContentType()
        );
    }
    @Transactional(readOnly = true)
    public IncidentDetailResponseDTO getIncidentDetail(Long incidentId) {

        User currentUser = authenticatedUserService.getCurrentUser();

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

        // 🔐 Access Control
        
        if (currentUser.getRole() == Role.STUDENT) {
            if (incident.getReporter() == null ||
                !incident.getReporter().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You can only view your own incident");
            }
        }

        if (currentUser.getRole() == Role.SECURITY) {
            if (incident.getAssignedTo() == null ||
                !incident.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Not assigned to this incident");
            }
        }

        IncidentDetailResponseDTO dto = new IncidentDetailResponseDTO();
        if (incident.getOwnerAdmin() != null) {
            dto.setOwnerAdmin(new AdminInfo(
                    incident.getOwnerAdmin().getId(),
                    incident.getOwnerAdmin().getName()
            ));
        }
        dto.setId(incident.getId());
        dto.setTitle(incident.getTitle());
        dto.setDescription(incident.getDescription());
        dto.setCategory(incident.getCategory());
        dto.setPriority(incident.getPriority());
        dto.setStatus(incident.getStatus());
        dto.setAnonymousLevel(incident.getAnonymousLevel());
        dto.setCreatedAt(incident.getCreatedAt());
     // after dto.setDescription(...); etc
        dto.setLatitude(incident.getLatitude());
        dto.setLongitude(incident.getLongitude());
        // 🔎 Reporter Visibility Logic
        boolean showReporter = false;

        AnonymousLevel level = incident.getAnonymousLevel();

        if (currentUser.getRole() == Role.ADMIN) {
            if (level == AnonymousLevel.NONE ||
                level == AnonymousLevel.SECURITY_ONLY) {
                showReporter = true;
            }
        }

        if (currentUser.getRole() == Role.SECURITY) {
            if (level == AnonymousLevel.NONE) {
                showReporter = true;
            }
        }

        if (showReporter && incident.getReporter() != null) {
        	if (incident.getReporter() != null) {
        	    dto.setReporter(new ReporterInfo(
        	        incident.getReporter().getId(),        // ✅ REQUIRED
        	        incident.getReporter().getName(),
        	        incident.getReporter().getEmail()      // ✅ REQUIRED
        	    ));
        	}
        }

        if (incident.getAssignedTo() != null) {
            dto.setAssignedSecurity(new AssignedSecurityInfo(
                    incident.getAssignedTo().getId(),
                    incident.getAssignedTo().getName()
            ));
        }

        List<IncidentHistoryResponseDTO> history =
                statusHistoryRepository
                        .findByIncidentOrderByChangedAtAsc(incident)
                        .stream()
                        .map(h -> mapHistory(h, incident, currentUser))
                        .toList();

        dto.setHistory(history);

        List<IncidentMediaResponseDTO> media =
                incidentMediaRepository
                        .findByIncidentId(incidentId, Pageable.unpaged())
                        .stream()
                        .map(this::mapMediaToDTO)
                        .toList();

        dto.setMedia(media);

        if (incident.getStatus() == IncidentStatus.RESOLVED ||
            incident.getStatus() == IncidentStatus.CLOSED) {

            if (!history.isEmpty()) {
                dto.setResolutionSummary(
                        history.get(history.size() - 1).getRemarks()
                );
            }
        }

        dto.setRemark(getRemarkForIncident(incident.getId()));

        dto.setCanAddRemark(
            canCurrentUserAddRemark(incident, currentUser)
        );

        dto.setTrackingSteps(
            buildTrackingSteps(incident)
        );

        return dto;
    }
    @Transactional(readOnly = true)
    public Page<IncidentResponseDTO> getAssignedIncidents(
            Long securityId,
            String status,
            Priority priority,
            String search,
            int page,
            int size
    ) {

        User currentUser = authenticatedUserService.getCurrentUser();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("assignedAt").descending()
        );

        Specification<Incident> spec = (root, query, cb) -> cb.conjunction();

        // 🔹 Always filter by assigned user
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("assignedTo"), currentUser)
        );

        // 🔹 STATUS (including ACTIVE logic)
        if (status != null && !status.equalsIgnoreCase("ALL")) {

            if (status.equalsIgnoreCase("ACTIVE")) {
                spec = spec.and((root, query, cb) ->
                        root.get("status").in(
                                IncidentStatus.REPORTED,
                                IncidentStatus.UNDER_REVIEW,
                                IncidentStatus.ACTION_TAKEN
                        )
                );
            } else {
                IncidentStatus s = IncidentStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) ->
                        cb.equal(root.get("status"), s)
                );
            }
        }

        // 🔹 PRIORITY
        if (priority != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("priority"), priority)
            );
        }

        // 🔹 SEARCH (GLOBAL)
        if (search != null && !search.isBlank()) {
            String q = "%" + search.toLowerCase() + "%";

            spec = spec.and((root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                predicates.add(cb.like(cb.lower(root.get("title")), q));
                predicates.add(cb.like(cb.lower(root.get("description")), q));
                predicates.add(cb.like(cb.lower(root.get("category").as(String.class)), q));

                return cb.or(predicates.toArray(new Predicate[0]));
            });
        }

        Page<Incident> result = incidentRepository.findAll(spec, pageable);

        return result.map(this::mapToDTO);
    }
    @Transactional(readOnly = true)
    public List<SecurityPerformanceDTO> getSecurityPerformanceSummary() {

        User currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can view performance summary");
        }

        return incidentRepository.getSecurityPerformanceSummary();
    }
    @Transactional(readOnly = true)
    public List<SecurityAdvancedPerformanceDTO> getAdvancedSecurityPerformance() {

        User currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can view advanced performance");
        }

        List<SecurityAdvancedPerformanceDTO> basicStats =
                incidentRepository.getBasicSecurityPerformance();

        return basicStats.stream().map(stat -> {

            long totalAssigned = stat.getTotalAssigned();
            long resolvedCount = stat.getResolvedCount();

            double resolutionRate = 0.0;
            if (totalAssigned > 0) {
                resolutionRate = (resolvedCount * 100.0) / totalAssigned;
            }

            Double avgResolutionHours =
                    calculateAverageResolutionTime(stat.getSecurityId());

            return new SecurityAdvancedPerformanceDTO(
                    stat.getSecurityId(),
                    stat.getSecurityName(),
                    totalAssigned,
                    resolvedCount,
                    stat.getActiveCount(),
                    resolutionRate,
                    avgResolutionHours
            );

        }).toList();
    }
    private Double calculateAverageResolutionTime(Long securityId) {

        List<Incident> resolvedIncidents =
                incidentRepository.findByAssignedToIdAndStatusIn(
                        securityId,
                        List.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED)
                );

        if (resolvedIncidents.isEmpty()) return null;

        double totalHours = 0;

        for (Incident incident : resolvedIncidents) {

            if (incident.getAssignedAt() != null &&
                incident.getUpdatedAt() != null) {

                long hours = java.time.Duration
                        .between(incident.getAssignedAt(), incident.getUpdatedAt())
                        .toHours();

                totalHours += hours;
            }
        }

        return totalHours / resolvedIncidents.size();
    }
    @Transactional(readOnly = true)
    public SecurityDashboardStatsDTO getSecurityStats() {

        User securityUser = authenticatedUserService.getCurrentUser();

        if (securityUser.getRole() != Role.SECURITY) {
            throw new AccessDeniedException("Only SECURITY can access this");
        }

        long assigned =
                incidentRepository.countByAssignedTo(securityUser);

        long pending =
                incidentRepository.countByAssignedToAndStatus(
                        securityUser,
                        IncidentStatus.REPORTED
                );

        long underReview =
                incidentRepository.countByAssignedToAndStatus(
                        securityUser,
                        IncidentStatus.UNDER_REVIEW
                );

        long actionTaken =
                incidentRepository.countByAssignedToAndStatus(
                        securityUser,
                        IncidentStatus.ACTION_TAKEN
                );

        long highPriority =
                incidentRepository.countByAssignedToAndPriority(
                        securityUser,
                        Priority.HIGH
                );
     // 🔹 Priority distribution
        Map<String, Long> priorityCounts = Map.of(
            "HIGH", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.HIGH),
            "MEDIUM", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.MEDIUM),
            "LOW", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.LOW)
        );
        Page<Incident> recentPage = incidentRepository.findByAssignedTo(
        	    securityUser,
        	    PageRequest.of(0, 5, Sort.by("createdAt").descending())
        	);

        	List<IncidentResponseDTO> recentIncidents =
        	    recentPage.getContent().stream()
        	        .map(this::mapToDTO)
        	        .toList();
        	List<Object[]> trendRaw = incidentRepository.getIncidentTrend(securityUser.getId());

        	List<Map<String, Object>> trend = trendRaw.stream()
        		    .map(r -> {
        		        Map<String, Object> m = new HashMap<>();
        		        m.put("date", r[0] != null ? r[0].toString() : "N/A");
        		        m.put("total", r[1] != null ? ((Number) r[1]).longValue() : 0L);
        		        return m;
        		    })
        		    .toList();
        	return new SecurityDashboardStatsDTO(
        		    assigned,
        		    pending,
        		    underReview,
        		    actionTaken,
        		    highPriority,
        		    priorityCounts,
        		    trend,
        		    recentIncidents
        		);
    }
    @Transactional(readOnly = true)
    public DashboardStatsDTO getStudentDashboardStats() {

        User student = authenticatedUserService.getCurrentUser();

        if (student.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only STUDENT can access this");
        }

        long total =
                incidentRepository.countByReporter(student);

        long reported =
                incidentRepository.countByReporterAndStatus(
                        student,
                        IncidentStatus.REPORTED
                );

        long underReview =
                incidentRepository.countByReporterAndStatus(
                        student,
                        IncidentStatus.UNDER_REVIEW
                );

        long actionTaken =
                incidentRepository.countByReporterAndStatus(
                        student,
                        IncidentStatus.ACTION_TAKEN
                );

        long resolved =
                incidentRepository.countByReporterAndStatus(
                        student,
                        IncidentStatus.RESOLVED
                );

        long closed =
                incidentRepository.countByReporterAndStatus(
                        student,
                        IncidentStatus.CLOSED
                );

        return new DashboardStatsDTO(
                total,
                reported,
                underReview,
                actionTaken,
                resolved,
                closed,
                0,
                0,
                null,
                null,
                null
        );
    }
    @Transactional(readOnly = true)
    
    public Page<IncidentResponseDTO> getMyIncidentsPaginated(
            User student,
            String status,
            Priority priority,
            String search,
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Incident> spec = (root, query, cb) -> cb.conjunction();

        // 🔹 Always filter by student
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("reporter"), student)
        );

        // 🔹 STATUS
        if (status != null && !status.equalsIgnoreCase("ALL")) {

            if (status.equalsIgnoreCase("ACTIVE")) {
                spec = spec.and((root, query, cb) ->
                        root.get("status").in(
                                IncidentStatus.REPORTED,
                                IncidentStatus.UNDER_REVIEW,
                                IncidentStatus.ACTION_TAKEN
                        )
                );
            } else if (status.equalsIgnoreCase("CLOSED")) {
                spec = spec.and((root, query, cb) ->
                        root.get("status").in(
                                IncidentStatus.RESOLVED,
                                IncidentStatus.CLOSED
                        )
                );
            } else {
                IncidentStatus s = IncidentStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) ->
                        cb.equal(root.get("status"), s)
                );
            }
        }

        // 🔹 PRIORITY
        if (priority != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("priority"), priority)
            );
        }

        // 🔹 SEARCH
        if (search != null && !search.isBlank()) {
            String q = "%" + search.toLowerCase() + "%";

            spec = spec.and((root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                predicates.add(cb.like(cb.lower(root.get("title")), q));
                predicates.add(cb.like(cb.lower(root.get("description")), q));
                predicates.add(cb.like(cb.lower(root.get("category").as(String.class)), q));

                return cb.or(predicates.toArray(new Predicate[0]));
            });
        }

        Page<Incident> result = incidentRepository.findAll(spec, pageable);

        return result.map(this::mapToDTO);
    }
    @Transactional(readOnly = true)
    public SecurityAdvancedPerformanceDTO getMyPerformance() {

        User currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() != Role.SECURITY) {
            throw new AccessDeniedException("Only SECURITY can view their performance");
        }

        SecurityAdvancedPerformanceDTO dto =
                incidentRepository.getMyPerformance(currentUser.getId());

        if (dto == null) {
            return new SecurityAdvancedPerformanceDTO(
                    currentUser.getId(),
                    currentUser.getName(),
                    0, 0, 0, 0.0, null
            );
        }

        // 🔥 Calculate derived values
        long totalAssigned = dto.getTotalAssigned();
        long resolved = dto.getResolvedCount();

        double resolutionRate = totalAssigned > 0
                ? (resolved * 100.0) / totalAssigned
                : 0.0;

        Double avgHours = calculateAverageResolutionTime(currentUser.getId());

        return new SecurityAdvancedPerformanceDTO(
                dto.getSecurityId(),
                dto.getSecurityName(),
                totalAssigned,
                resolved,
                dto.getActiveCount(),
                resolutionRate,
                avgHours
        );
    }
    private List<IncidentStatus> resolveStatusFilter(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return null;
        }

        if (status.equalsIgnoreCase("ACTIVE")) {
            return List.of(
                IncidentStatus.REPORTED,
                IncidentStatus.UNDER_REVIEW,
                IncidentStatus.ACTION_TAKEN
            );
        }

        if (status.equalsIgnoreCase("CLOSED")) {
            return List.of(IncidentStatus.CLOSED);
        }

        return List.of(IncidentStatus.valueOf(status.toUpperCase()));
    }
    @Transactional(readOnly = true)
    public SecurityAnalysisDTO getSecurityAnalysis(Long securityId) {
        User currentUser = authenticatedUserService.getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can view security analysis");
        }

        User securityUser = userRepository.findById(securityId)
                .orElseThrow(() -> new ResourceNotFoundException("Security user not found"));

        if (securityUser.getRole() != Role.SECURITY) {
            throw new BusinessException("Selected user is not a security officer");
        }

        SecurityAdvancedPerformanceDTO base = incidentRepository.getMyPerformance(securityId);

        long totalAssigned = base != null ? base.getTotalAssigned() : 0L;
        long resolvedCount = base != null ? base.getResolvedCount() : 0L;
        long activeCount = base != null ? base.getActiveCount() : 0L;
        double resolutionRate = totalAssigned > 0 ? (resolvedCount * 100.0) / totalAssigned : 0.0;

        // If you do not store a proper resolvedAt/completedAt field, keep this as a computed estimate.
        Double avgResolutionHours = calculateAverageResolutionHours(securityUser);

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        statusCounts.put("REPORTED", incidentRepository.countByAssignedToAndStatus(securityUser, IncidentStatus.REPORTED));
        statusCounts.put("UNDER_REVIEW", incidentRepository.countByAssignedToAndStatus(securityUser, IncidentStatus.UNDER_REVIEW));
        statusCounts.put("ACTION_TAKEN", incidentRepository.countByAssignedToAndStatus(securityUser, IncidentStatus.ACTION_TAKEN));
        statusCounts.put("RESOLVED", incidentRepository.countByAssignedToAndStatus(securityUser, IncidentStatus.RESOLVED));
        statusCounts.put("CLOSED", incidentRepository.countByAssignedToAndStatus(securityUser, IncidentStatus.CLOSED));
        statusCounts.put(
                "ACTIVE",
                statusCounts.get("REPORTED") + statusCounts.get("UNDER_REVIEW") + statusCounts.get("ACTION_TAKEN")
        );

        Map<String, Long> priorityCounts = new LinkedHashMap<>();
        priorityCounts.put("CRITICAL", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.CRITICAL));
        priorityCounts.put("HIGH", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.HIGH));
        priorityCounts.put("MEDIUM", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.MEDIUM));
        priorityCounts.put("LOW", incidentRepository.countByAssignedToAndPriority(securityUser, Priority.LOW));

        List<Map<String, Object>> trend = incidentRepository.getIncidentTrend(securityId).stream()
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", row[0] != null ? row[0].toString() : "N/A");
                    m.put("total", row[1] != null ? ((Number) row[1]).longValue() : 0L);
                    return m;
                })
                .toList();

        List<IncidentResponseDTO> recentIncidents =
                incidentRepository.findByAssignedTo(
                        securityUser,
                        PageRequest.of(0, 6, Sort.by("createdAt").descending())
                ).getContent().stream().map(this::mapToDTO).toList();

        return new SecurityAnalysisDTO(
                securityUser.getId(),
                securityUser.getName(),
                totalAssigned,
                resolvedCount,
                activeCount,
                resolutionRate,
                avgResolutionHours,
                statusCounts,
                priorityCounts,
                trend,
                recentIncidents
        );
    }

    private Double calculateAverageResolutionHours(User securityUser) {
        List<Incident> incidents = incidentRepository
                .findByAssignedTo(securityUser, Pageable.unpaged())
                .getContent();

        double totalHours = 0.0;
        long count = 0L;

        for (Incident incident : incidents) {
            if (incident.getAssignedAt() == null || incident.getUpdatedAt() == null) continue;
            if (incident.getStatus() != IncidentStatus.RESOLVED && incident.getStatus() != IncidentStatus.CLOSED) continue;

            Duration duration = Duration.between(incident.getAssignedAt(), incident.getUpdatedAt());
            if (!duration.isNegative()) {
                totalHours += duration.toMinutes() / 60.0;
                count++;
            }
        }

        return count > 0 ? totalHours / count : null;
    }
    @Transactional
    public IncidentRemarkResponseDTO addRemark(Long incidentId, User currentUser, IncidentRemarkRequestDTO request) {

        if (currentUser.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only STUDENT can add remark");
        }

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

        if (incident.getReporter() == null || !incident.getReporter().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only remark on your own incident");
        }

        if (incident.getStatus() != IncidentStatus.CLOSED) {
            throw new BusinessException("Remarks can be added only after the incident is closed");
        }

        if (incidentRemarkRepository.existsByIncident_Id(incidentId)) {
            throw new BusinessException("You have already submitted feedback for this incident");
        }

        IncidentRemark remark = new IncidentRemark();
        remark.setIncident(incident);
        remark.setStudent(currentUser);
        remark.setStars(request.getStars());
        remark.setMessage(request.getMessage());

        IncidentRemark saved = incidentRemarkRepository.save(remark);

        return mapRemarkToDTO(saved);
    }
    @Transactional(readOnly = true)
    public IncidentRemarkResponseDTO getRemarkForIncident(Long incidentId) {
        return incidentRemarkRepository.findByIncident_Id(incidentId)
                .map(this::mapRemarkToDTO)
                .orElse(null);
    }
    private IncidentRemarkResponseDTO mapRemarkToDTO(IncidentRemark remark) {

        if (remark == null) return null;

        return new IncidentRemarkResponseDTO(
                remark.getId(),
                remark.getIncident().getId(),
                remark.getStudent().getId(),
                remark.getStudent().getName(),
                remark.getStars(),
                remark.getMessage(),
                remark.getCreatedAt(),
                remark.getUpdatedAt()
        );
    }
    private boolean canCurrentUserAddRemark(Incident incident, User currentUser) {
        return currentUser.getRole() == Role.STUDENT
                && incident.getReporter() != null
                && incident.getReporter().getId().equals(currentUser.getId())
                && incident.getStatus() == IncidentStatus.CLOSED
                && !incidentRemarkRepository.existsByIncident_Id(incident.getId());
    }
    private List<IncidentTrackingStepDTO> buildTrackingSteps(Incident incident) {
  

        List<IncidentStatusHistory> historyList =
                statusHistoryRepository.findByIncidentOrderByChangedAtAsc(incident);

        Map<String, LocalDateTime> statusTimeMap = new HashMap<>();

        for (IncidentStatusHistory h : historyList) {
            if (h.getNewStatus() != null) {
                statusTimeMap.put(h.getNewStatus().name(), h.getChangedAt());
            }
        }
        

        return List.of(
            new IncidentTrackingStepDTO(
                    "REPORTED",
                    "Reported",
                    incident.getStatus() != null && isAtOrBeyond(incident.getStatus(), IncidentStatus.REPORTED),
                    statusTimeMap.get("REPORTED")
            ),
            new IncidentTrackingStepDTO(
                    "UNDER_REVIEW",
                    "Under review",
                    incident.getStatus() != null && isAtOrBeyond(incident.getStatus(), IncidentStatus.UNDER_REVIEW),
                    statusTimeMap.get("UNDER_REVIEW")
            ),
            new IncidentTrackingStepDTO(
                    "ACTION_TAKEN",
                    "Action taken",
                    incident.getStatus() != null && isAtOrBeyond(incident.getStatus(), IncidentStatus.ACTION_TAKEN),
                    statusTimeMap.get("ACTION_TAKEN")
            ),
            new IncidentTrackingStepDTO(
                    "RESOLVED",
                    "Resolved",
                    incident.getStatus() != null && isAtOrBeyond(incident.getStatus(), IncidentStatus.RESOLVED),
                    statusTimeMap.get("RESOLVED")
            ),
            new IncidentTrackingStepDTO(
                    "CLOSED",
                    "Closed",
                    incident.getStatus() == IncidentStatus.CLOSED,
                    statusTimeMap.get("CLOSED")
            )
        );
    }
    private boolean isAtOrBeyond(IncidentStatus current, IncidentStatus target) {
        List<IncidentStatus> order = List.of(
                IncidentStatus.REPORTED,
                IncidentStatus.UNDER_REVIEW,
                IncidentStatus.ACTION_TAKEN,
                IncidentStatus.RESOLVED,
                IncidentStatus.CLOSED
        );
        return order.indexOf(current) >= order.indexOf(target);
    }
}