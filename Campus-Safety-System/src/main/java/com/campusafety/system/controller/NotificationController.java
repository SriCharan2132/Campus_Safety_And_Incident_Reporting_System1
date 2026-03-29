// src/main/java/com/campusafety/system/controller/NotificationController.java
package com.campusafety.system.controller;

import com.campusafety.system.entity.Notification;
import com.campusafety.system.entity.User;
import com.campusafety.system.repository.NotificationRepository;
import com.campusafety.system.security.AuthenticatedUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    public NotificationController(NotificationRepository notificationRepository,
                                  AuthenticatedUserService authenticatedUserService,
                                  SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.authenticatedUserService = authenticatedUserService;
        this.messagingTemplate = messagingTemplate;
    }

    // GET unread (exists already but it's safe to include)
    @GetMapping("/unread")
    public List<Notification> getUnread() {
        User user = authenticatedUserService.getCurrentUser();
        return notificationRepository.findByUserAndReadFalse(user);
    }

    // GET all notifications for page
    @GetMapping
    public List<Notification> getAll() {
        User user = authenticatedUserService.getCurrentUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Mark single notification read
    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User user = authenticatedUserService.getCurrentUser();
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notif.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        if (!notif.isRead()) {
            notif.setRead(true);
            notificationRepository.save(notif);

            // Notify all user sessions about the change
            Map<String, Object> payload = Map.of(
                    "event", "read",
                    "id", notif.getId()
            );
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications", payload);

            // Send updated unread count
            long unread = notificationRepository.countByUserAndReadFalse(user);
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                    Map.of("event", "unread_count", "unread", unread));
        }

        return ResponseEntity.ok().build();
    }

    // Delete a notification
 // Delete a notification
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User user = authenticatedUserService.getCurrentUser();

        return notificationRepository.findById(id)
            .map(notif -> {
                if (!notif.getUser().getId().equals(user.getId())) {
                    return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
                }

                notificationRepository.delete(notif);

                // Notify sessions
                messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                        Map.of("event", "deleted", "id", id));

                long unread = notificationRepository.countByUserAndReadFalse(user);
                messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                        Map.of("event", "unread_count", "unread", unread));

                return ResponseEntity.ok().build();
            })
            // If not found, return 200 OK (no crash). You can change to 404 if you want.
            .orElseGet(() -> ResponseEntity.ok().build());
    }

    // Mark all notifications as read
    @PutMapping("/mark-all-read")
    @Transactional
    public ResponseEntity<?> markAllRead() {
        User user = authenticatedUserService.getCurrentUser();

        List<Notification> unread = notificationRepository.findByUserAndReadFalse(user);
        if (!unread.isEmpty()) {
            unread.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unread);

            // Broadcast a single event indicating bulk read
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                    Map.of("event", "mark_all_read"));
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                    Map.of("event", "unread_count", "unread", 0L));
        }

        return ResponseEntity.ok().build();
    }
 // Delete all notifications for current user
    @DeleteMapping("/delete-all")
    @Transactional
    public ResponseEntity<?> deleteAllForUser() {
        User user = authenticatedUserService.getCurrentUser();
        // Option A: delete by query method (see repository change below)
        notificationRepository.deleteByUser(user);

        // inform user sessions
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                Map.of("event", "deleted_all"));
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/user-notifications",
                Map.of("event", "unread_count", "unread", 0L));

        return ResponseEntity.ok().build();
    }
}