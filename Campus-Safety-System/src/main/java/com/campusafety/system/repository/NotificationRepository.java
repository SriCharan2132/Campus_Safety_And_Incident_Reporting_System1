package com.campusafety.system.repository;

import com.campusafety.system.entity.Notification;
import com.campusafety.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserAndReadFalse(User user);
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
    void deleteByUser(User user);
}