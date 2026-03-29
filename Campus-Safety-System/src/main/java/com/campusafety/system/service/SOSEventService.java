package com.campusafety.system.service;
import com.campusafety.system.enums.IncidentCategory;
import com.campusafety.system.dto.SOSEventNotificationDTO;
import com.campusafety.system.dto.SOSEventResponseDTO;
import com.campusafety.system.dto.SOSStatsDTO;
import com.campusafety.system.entity.SOSEvent;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.Role;
import com.campusafety.system.enums.SOSStatus;
import com.campusafety.system.exception.BusinessException;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.repository.SOSEventRepository;
import com.campusafety.system.repository.UserRepository;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class SOSEventService {

    private final SOSEventRepository sosEventRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private static final Logger logger =
            LoggerFactory.getLogger(SOSEventService.class);
    public SOSEventService(
            SOSEventRepository sosEventRepository,
            SimpMessagingTemplate messagingTemplate,
            EmailService emailService,
            UserRepository userRepository) {

        this.sosEventRepository = sosEventRepository;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    // =========================
    // 1️⃣ Trigger SOS
    // =========================
    @Transactional
    public SOSEvent triggerSOS(User student, Double latitude, Double longitude, String description, IncidentCategory category) {
        logger.info("action=trigger_sos userId={} latitude={} longitude={} description={} category={}",
                student.getId(), latitude, longitude, description, category);

        if (student.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only STUDENT users can trigger SOS");
        }

        sosEventRepository
                .findByStudent_IdAndStatus(student.getId(), SOSStatus.ACTIVE)
                .ifPresent(existing -> {
                    throw new BusinessException("You already have an active SOS");
                });

        SOSEvent sosEvent = new SOSEvent(student, latitude, longitude);
        sosEvent.setDescription(description);
        sosEvent.setCategory(category);

        SOSEvent savedSOS = sosEventRepository.save(sosEvent);

        // Broadcast real-time alert
        messagingTemplate.convertAndSend("/topic/sos-alerts", mapToDTO(savedSOS));
        messagingTemplate.convertAndSend(
                "/topic/sos-events",
                toNotificationDTO(savedSOS, "SOS_TRIGGERED", "New SOS triggered")
        );

        // Email all SECURITY users (include description/category)
        List<User> securityUsers = userRepository.findByRole(Role.SECURITY);

        for (User security : securityUsers) {
            String htmlContent = """
                <div style="font-family: Arial; padding:20px;">
                    <h2 style="color:red;">🚨 Emergency SOS Alert</h2>
                    <p><strong>Student:</strong> %s</p>
                    <p><strong>Location:</strong> (%s, %s)</p>
                    <p><strong>Category:</strong> %s</p>
                    <p><strong>Details:</strong> %s</p>
                    <p>Please respond immediately.</p>
                </div>
            """.formatted(student.getName(), latitude, longitude,
                    category == null ? "N/A" : category.name(),
                    description == null ? "—" : description);
            try {
                emailService.sendHtmlEmail(
                        security.getEmail(),
                        "Emergency SOS Alert",
                        htmlContent
                );
            } catch (Exception e) {
                logger.error("Failed to send SOS alert to {}", security.getEmail(), e);
            }
        }

        logger.info("action=sos_saved sosId={} userId={}", savedSOS.getId(), student.getId());
        return savedSOS;
    }

    // =========================
    // 2️⃣ Get Active SOS
    // =========================
    @Transactional(readOnly = true)
    public List<SOSEvent> getActiveSOS() {
        return sosEventRepository.findByStatus(SOSStatus.ACTIVE);
    }

    // =========================
    // 3️⃣ Handle SOS
    // =========================
    @Transactional
    public SOSEvent handleSOS(Long sosId, User securityUser) {
    	logger.info("action=handle_sos request_sosId={} securityUserId={}",
    	        sosId, securityUser.getId());
        if (securityUser.getRole() != Role.SECURITY) {
            throw new AccessDeniedException(
                    "Only SECURITY can handle SOS alerts"
            );
        }

        SOSEvent sosEvent = sosEventRepository.findById(sosId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("SOS not found"));

        if (sosEvent.getStatus() == SOSStatus.HANDLED) {
            throw new BusinessException("SOS already handled");
        }

        sosEvent.setStatus(SOSStatus.HANDLED);
        sosEvent.setHandledBy(securityUser);
        sosEvent.setHandledAt(LocalDateTime.now());

        SOSEvent updatedSOS = sosEventRepository.save(sosEvent);

        // 🔔 Broadcast handled update
        messagingTemplate.convertAndSend("/topic/sos-alerts", mapToDTO(updatedSOS));
        messagingTemplate.convertAndSend(
                "/topic/sos-events",
                toNotificationDTO(updatedSOS, "SOS_HANDLED", "SOS has been handled")
        );
        messagingTemplate.convertAndSendToUser(
                sosEvent.getStudent().getEmail(),
                "/queue/user-notifications",
                toNotificationDTO(updatedSOS, "SOS_HANDLED", "Your SOS has been handled")
        );
        // 🔔 Email student
        String htmlContent = """
            <div style="font-family: Arial; padding:20px;">
                <h2 style="color:green;">✅ SOS Handled</h2>
                <p>Your emergency request has been handled.</p>
                <p>Stay safe.</p>
            </div>
        """;
        try {
            if (sosEvent.getStudent() != null &&
                sosEvent.getStudent().getEmail() != null) {

                emailService.sendHtmlEmail(
                        sosEvent.getStudent().getEmail(),
                        "SOS Handled",
                        htmlContent
                );
            }
        } catch (Exception e) {
            logger.error("Failed to send SOS handled email for SOS ID {}", sosId, e);
        }
        logger.info("action=sos_handled sosId={} handledBy={}",
                updatedSOS.getId(), securityUser.getId());
        return updatedSOS;
    }

    // =========================
    // 4️⃣ SOS History
    // =========================
    @Transactional(readOnly = true)
    public List<SOSEvent> getSOSHistory() {
        return sosEventRepository.findAllByOrderByTriggeredAtDesc();
    }

    // =========================
    // DTO Mapper
    // =========================
    public SOSEventResponseDTO mapToDTO(SOSEvent sos) {

        String handledByName = null;
        if (sos.getHandledBy() != null) {
            handledByName = sos.getHandledBy().getName();
        }

        return new SOSEventResponseDTO(
                sos.getId(),
                sos.getStudent().getName(),
                sos.getLatitude(),
                sos.getLongitude(),
                sos.getDescription(),
                sos.getCategory(),
                sos.getStatus(),
                sos.getTriggeredAt(),
                handledByName,
                sos.getHandledAt()
        );
    }
    private SOSEventNotificationDTO toNotificationDTO(SOSEvent sos, String eventType, String message) {
        return new SOSEventNotificationDTO(
                sos.getId(),
                eventType,
                message,
                sos.getStudent() != null ? sos.getStudent().getId() : null,
                sos.getStudent() != null ? sos.getStudent().getName() : null,
                sos.getLatitude(),
                sos.getLongitude(),
                sos.getCategory(),
                sos.getStatus(),
                sos.getHandledBy() != null ? sos.getHandledBy().getName() : null,
                sos.getTriggeredAt(),
                sos.getHandledAt()
        );
    }
    @Transactional(readOnly = true)
    public SOSStatsDTO getSosStats(User currentUser) {
        long active = sosEventRepository.countByStatus(SOSStatus.ACTIVE);
        long handled = sosEventRepository.countByStatus(SOSStatus.HANDLED);
        long handledByMe = 0L;

        if (currentUser.getRole() == Role.SECURITY) {
            handledByMe = sosEventRepository.countByHandledBy_IdAndStatus(
                    currentUser.getId(),
                    SOSStatus.HANDLED
            );
        }

        return new SOSStatsDTO(active, handled, handledByMe);
    }
}