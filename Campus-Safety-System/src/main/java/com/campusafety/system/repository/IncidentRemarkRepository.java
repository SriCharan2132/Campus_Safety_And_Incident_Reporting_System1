package com.campusafety.system.repository;

import com.campusafety.system.entity.IncidentRemark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IncidentRemarkRepository extends JpaRepository<IncidentRemark, Long> {

    Optional<IncidentRemark> findByIncident_Id(Long incidentId);

    boolean existsByIncident_Id(Long incidentId);
    
}