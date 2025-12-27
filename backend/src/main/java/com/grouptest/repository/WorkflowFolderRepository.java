package com.grouptest.repository;

import com.grouptest.entity.WorkflowFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowFolderRepository extends JpaRepository<WorkflowFolder, Long> {
    List<WorkflowFolder> findAllByOrderByNameAsc();
}

