package com.grouptest.repository;

import com.grouptest.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    List<Workflow> findByIsLaunchedTrue();
    List<Workflow> findByFolderId(Long folderId);
    long countByFolderId(Long folderId);
}

