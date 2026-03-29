package com.campusafety.system.repository;

import com.campusafety.system.entity.IncidentChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentChatMessageRepository extends JpaRepository<IncidentChatMessage, Long> {

    List<IncidentChatMessage> findByIncident_IdOrderByCreatedAtAsc(Long incidentId);

    long countByIncident_Id(Long incidentId);
}