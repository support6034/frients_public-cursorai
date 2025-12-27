package com.grouptest.repository;

import com.grouptest.entity.DebugLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebugLogRepository extends JpaRepository<DebugLog, Long> {
    List<DebugLog> findByComponentOrderByCreatedAtDesc(String component);
}

