package com.grouptest.repository;

import com.grouptest.entity.WorkflowProcessedLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkflowProcessedLeadRepository extends JpaRepository<WorkflowProcessedLead, Long> {
    Optional<WorkflowProcessedLead> findByWorkflowIdAndLeadEmail(Long workflowId, String leadEmail);
    boolean existsByWorkflowIdAndLeadEmail(Long workflowId, String leadEmail);
}

