package com.campusafety.system.repository;

import com.campusafety.system.entity.SOSEvent;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.SOSStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SOSEventRepository extends JpaRepository<SOSEvent, Long> {

    // 🔹 Check if a student already has an ACTIVE SOS
    
    Optional<SOSEvent> findByStudent_IdAndStatus(Long studentId, SOSStatus status);
    // 🔹 Get all ACTIVE SOS alerts
    List<SOSEvent> findByStatus(SOSStatus status);

    // 🔹 Get all SOS history (for admin)
    List<SOSEvent> findAllByOrderByTriggeredAtDesc();
    
    long countByStatus(SOSStatus status);

    long countByHandledBy_IdAndStatus(Long handledById, SOSStatus status);
}