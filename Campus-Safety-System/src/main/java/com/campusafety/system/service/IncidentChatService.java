package com.campusafety.system.service;

import com.campusafety.system.dto.IncidentChatMessageRequestDTO;
import com.campusafety.system.dto.IncidentChatMessageResponseDTO;
import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.IncidentChatMessage;
import com.campusafety.system.entity.Notification;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.AnonymousLevel;
import com.campusafety.system.enums.Role;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.repository.IncidentChatMessageRepository;
import com.campusafety.system.repository.IncidentRepository;
import com.campusafety.system.repository.NotificationRepository;
import com.campusafety.system.security.AuthenticatedUserService;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class IncidentChatService {

    private final IncidentRepository incidentRepository;
    private final IncidentChatMessageRepository chatRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthenticatedUserService authenticatedUserService;

    public IncidentChatService(
            IncidentRepository incidentRepository,
            IncidentChatMessageRepository chatRepository,
            NotificationRepository notificationRepository,
            SimpMessagingTemplate messagingTemplate,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.incidentRepository = incidentRepository;
        this.chatRepository = chatRepository;
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.authenticatedUserService = authenticatedUserService;
    }

    @Transactional(readOnly = true)
    public List<IncidentChatMessageResponseDTO> getMessages(Long incidentId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        Incident incident = getIncidentOrThrow(incidentId);

        ensureAccess(incident, currentUser);

        return chatRepository.findByIncident_IdOrderByCreatedAtAsc(incidentId)
                .stream()
                .map(msg -> mapToDTO(msg, currentUser))
                .toList();
    }

    @Transactional
    public IncidentChatMessageResponseDTO sendMessage(Long incidentId, IncidentChatMessageRequestDTO request) {
        User currentUser = authenticatedUserService.getCurrentUser();
        Incident incident = getIncidentOrThrow(incidentId);

        ensureAccess(incident, currentUser);

        String msg = request.getMessage() == null ? "" : request.getMessage().trim();
        if (msg.isBlank()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        IncidentChatMessage chatMessage = new IncidentChatMessage();
        chatMessage.setIncident(incident);
        chatMessage.setSender(currentUser);
        chatMessage.setSenderRole(currentUser.getRole());
        chatMessage.setMessage(msg);

        IncidentChatMessage saved = chatRepository.save(chatMessage);
        IncidentChatMessageResponseDTO dto = mapToDTO(saved, currentUser);

        // realtime broadcast to chat room
        messagingTemplate.convertAndSend("/topic/incidents/" + incidentId + "/chat", dto);

        // create toast + unread notification for other participants
        createChatNotifications(incident, currentUser);

        return dto;
    }

    private void createChatNotifications(Incident incident, User sender) {
        Set<User> recipients = new LinkedHashSet<>();

        // If SECURITY sends a message:
        // notify only the reporter/student and the related admin (ownerAdmin)
        if (sender.getRole() == Role.SECURITY) {
            if (incident.getReporter() != null &&
                    !incident.getReporter().getId().equals(sender.getId())) {
                recipients.add(incident.getReporter());
            }

            if (incident.getOwnerAdmin() != null &&
                    !incident.getOwnerAdmin().getId().equals(sender.getId())) {
                recipients.add(incident.getOwnerAdmin());
            }
        }

        // If STUDENT sends a message:
        // notify assigned security and related admin
        else if (sender.getRole() == Role.STUDENT) {
            if (incident.getAssignedTo() != null &&
                    !incident.getAssignedTo().getId().equals(sender.getId())) {
                recipients.add(incident.getAssignedTo());
            }

            if (incident.getOwnerAdmin() != null &&
                    !incident.getOwnerAdmin().getId().equals(sender.getId())) {
                recipients.add(incident.getOwnerAdmin());
            }
        }

        // If ADMIN sends a message:
        // notify reporter and assigned security
        else if (sender.getRole() == Role.ADMIN) {
            if (incident.getReporter() != null &&
                    !incident.getReporter().getId().equals(sender.getId())) {
                recipients.add(incident.getReporter());
            }

            if (incident.getAssignedTo() != null &&
                    !incident.getAssignedTo().getId().equals(sender.getId())) {
                recipients.add(incident.getAssignedTo());
            }
        }

        String title = incident.getTitle();
        String message = formatRole(sender.getRole()) + " sent a new message";

        for (User recipient : recipients) {
            Notification notif = new Notification();
            notif.setUser(recipient);
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setIncidentId(incident.getId());
            notif.setType("chat");
            notif.setRead(false);

            Notification savedNotif = notificationRepository.save(notif);

            Map<String, Object> payload = Map.of(
                    "event", "created",
                    "id", savedNotif.getId(),
                    "incidentId", savedNotif.getIncidentId(),
                    "title", savedNotif.getTitle(),
                    "message", savedNotif.getMessage(),
                    "type", savedNotif.getType(),
                    "createdAt", savedNotif.getCreatedAt().toString(),
                    "read", savedNotif.isRead()
            );

            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/user-notifications",
                    payload
            );

            long unread = notificationRepository.countByUserAndReadFalse(recipient);
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/user-notifications",
                    Map.of("event", "unread_count", "unread", unread)
            );
        }
    }

    private String formatRole(Role role) {
        if (role == null) return "User";
        String raw = role.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(raw.charAt(0)) + raw.substring(1);
    }

    private Incident getIncidentOrThrow(Long incidentId) {
        return incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
    }

    private void ensureAccess(Incident incident, User user) {
        if (user.getRole() == Role.ADMIN) {
            if (incident.getOwnerAdmin() == null) {
                throw new AccessDeniedException("This incident has no admin owner yet");
            }
            if (!incident.getOwnerAdmin().getId().equals(user.getId())) {
                throw new AccessDeniedException("This incident chat belongs to another admin");
            }
            return;
        }

        if (user.getRole() == Role.SECURITY) return;

        if (user.getRole() == Role.STUDENT
                && incident.getReporter() != null
                && incident.getReporter().getId().equals(user.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have access to this incident chat");
    }

    private IncidentChatMessageResponseDTO mapToDTO(
            IncidentChatMessage msg,
            User currentUser
    ) {
        Incident incident = msg.getIncident();
        User sender = msg.getSender();

        String displayName = sender.getName();

        if (sender.getRole() == Role.STUDENT) {
            AnonymousLevel level = incident.getAnonymousLevel();

            if (level == null) {
                level = AnonymousLevel.NONE;
            }

            boolean isSameStudent =
                    incident.getReporter() != null &&
                    incident.getReporter().getId().equals(sender.getId()) &&
                    currentUser.getId().equals(sender.getId());

            boolean canSeeRealName = false;

            switch (level) {
                case NONE -> canSeeRealName = true;
                case SECURITY_ONLY -> canSeeRealName = currentUser.getRole() != Role.SECURITY;
                case ADMIN_AND_SECURITY ->
                        canSeeRealName =
                                currentUser.getRole() != Role.SECURITY &&
                                currentUser.getRole() != Role.ADMIN;
            }

            if (isSameStudent) {
                canSeeRealName = true;
            }

            if (!canSeeRealName) {
                displayName = "Anonymous Student";
            }
        }

        return new IncidentChatMessageResponseDTO(
                msg.getId(),
                msg.getIncident().getId(),
                msg.getSender().getId(),
                displayName,
                msg.getSenderRole(),
                msg.getMessage(),
                msg.getCreatedAt()
        );
    }
}