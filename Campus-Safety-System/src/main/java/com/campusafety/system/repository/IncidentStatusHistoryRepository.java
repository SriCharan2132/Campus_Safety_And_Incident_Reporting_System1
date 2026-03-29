package com.campusafety.system.repository;

import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.IncidentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentStatusHistoryRepository
        extends JpaRepository<IncidentStatusHistory, Long> {

    List<IncidentStatusHistory> findByIncidentOrderByChangedAtAsc(Incident incident);
    
    
}