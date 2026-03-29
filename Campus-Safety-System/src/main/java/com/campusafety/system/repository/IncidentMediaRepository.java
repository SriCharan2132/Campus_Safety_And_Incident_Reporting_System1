package com.campusafety.system.repository;

import com.campusafety.system.entity.IncidentMedia;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentMediaRepository extends JpaRepository<IncidentMedia, Long> {

 
    Page<IncidentMedia> findByIncidentId(Long incidentId, Pageable pageable);
}