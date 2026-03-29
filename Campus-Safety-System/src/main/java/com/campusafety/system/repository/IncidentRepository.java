package com.campusafety.system.repository;

import com.campusafety.system.dto.SecurityAdvancedPerformanceDTO;
import com.campusafety.system.dto.SecurityPerformanceDTO;
import com.campusafety.system.entity.Incident;
import com.campusafety.system.entity.User;
import com.campusafety.system.enums.IncidentStatus;
import com.campusafety.system.enums.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    // 🔹 Non-paginated
    List<Incident> findByReporter(User reporter);

    // 🔹 Paginated by reporter
    Page<Incident> findByReporter(User reporter, Pageable pageable);

    // 🔹 Pagination + Filtering
    Page<Incident> findByStatus(IncidentStatus status, Pageable pageable);

    Page<Incident> findByPriority(Priority priority, Pageable pageable);

    Page<Incident> findByStatusAndPriority(
            IncidentStatus status,
            Priority priority,
            Pageable pageable
    );

    // 🔹 Dashboard Counts
    long countByStatus(IncidentStatus status);

    long countByPriority(Priority priority);

    Page<Incident> findByAssignedTo(User securityUser, Pageable pageable);

    // 🔹 Security Performance
    @Query("""
        SELECT new com.campusafety.system.dto.SecurityPerformanceDTO(
            u.id,
            u.name,
            COUNT(i),
            SUM(CASE WHEN i.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.status = 'ACTION_TAKEN' THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.status = 'RESOLVED' THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.status = 'CLOSED' THEN 1 ELSE 0 END)
        )
        FROM Incident i
        JOIN i.assignedTo u
        GROUP BY u.id, u.name
    """)
    List<SecurityPerformanceDTO> getSecurityPerformanceSummary();

    @Query("""
        SELECT new com.campusafety.system.dto.SecurityAdvancedPerformanceDTO(
            u.id,
            u.name,
            COUNT(i),
            SUM(CASE WHEN i.status = 'RESOLVED' OR i.status = 'CLOSED' THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.status <> 'RESOLVED' AND i.status <> 'CLOSED' THEN 1 ELSE 0 END),
            0.0,
            0.0
        )
        FROM Incident i
        JOIN i.assignedTo u
        WHERE i.assignedAt IS NOT NULL
        GROUP BY u.id, u.name
    """)
    List<SecurityAdvancedPerformanceDTO> getBasicSecurityPerformance();

    List<Incident> findByAssignedToIdAndStatusIn(
            Long securityId,
            List<IncidentStatus> statuses);

    long countByAssignedTo(User user);

    long countByAssignedToAndStatus(User user, IncidentStatus status);

    long countByAssignedToAndPriority(User user, Priority priority);

    // 🔹 Assigned Incident Filtering (used for pagination API)
    Page<Incident> findByAssignedToAndStatus(
            User user,
            IncidentStatus status,
            Pageable pageable);

    Page<Incident> findByAssignedToAndPriority(
            User user,
            Priority priority,
            Pageable pageable);

    Page<Incident> findByAssignedToAndStatusAndPriority(
            User user,
            IncidentStatus status,
            Priority priority,
            Pageable pageable);
    Page<Incident> findByAssignedToAndStatusIn(
            User user,
            List<IncidentStatus> statuses,
            Pageable pageable);
    long countByReporter(User reporter);

    long countByReporterAndStatus(
            User reporter,
            IncidentStatus status
    );
    Page<Incident> findByReporterAndStatus(
            User reporter,
            IncidentStatus status,
            Pageable pageable);

    Page<Incident> findByReporterAndPriority(
            User reporter,
            Priority priority,
            Pageable pageable);

    Page<Incident> findByReporterAndStatusAndPriority(
            User reporter,
            IncidentStatus status,
            Priority priority,
            Pageable pageable);
    @Query("""
    	    SELECT new com.campusafety.system.dto.SecurityAdvancedPerformanceDTO(
    	        u.id,
    	        u.name,
    	        COUNT(i),
    	        SUM(CASE WHEN i.status = 'RESOLVED' OR i.status = 'CLOSED' THEN 1 ELSE 0 END),
    	        SUM(CASE WHEN i.status <> 'RESOLVED' AND i.status <> 'CLOSED' THEN 1 ELSE 0 END),
    	        0.0,
    	        0.0
    	    )
    	    FROM Incident i
    	    JOIN i.assignedTo u
    	    WHERE u.id = :securityId
    	    GROUP BY u.id, u.name
    	""")
    	SecurityAdvancedPerformanceDTO getMyPerformance(Long securityId);
    @Query("""
    	    SELECT CAST(i.createdAt AS date), COUNT(i)
    	    FROM Incident i
    	    WHERE i.assignedTo.id = :securityId
    	    GROUP BY CAST(i.createdAt AS date)
    	    ORDER BY CAST(i.createdAt AS date)
    	""")
    	List<Object[]> getIncidentTrend(Long securityId);
    	// import java.time.LocalDateTime; (at top)

    	List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    	Page<Incident> findByReporterAndStatusIn(
    	        User reporter,
    	        List<IncidentStatus> statuses,
    	        Pageable pageable
    	);

    	Page<Incident> findByReporterAndStatusInAndPriority(
    	        User reporter,
    	        List<IncidentStatus> statuses,
    	        Priority priority,
    	        Pageable pageable
    	);

    	Page<Incident> findByStatusIn(
    	        List<IncidentStatus> statuses,
    	        Pageable pageable
    	);

    	Page<Incident> findByStatusInAndPriority(
    	        List<IncidentStatus> statuses,
    	        Priority priority,
    	        Pageable pageable
    	);
    	
}