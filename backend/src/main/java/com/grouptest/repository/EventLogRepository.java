package com.grouptest.repository;

import com.grouptest.entity.EventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventLogRepository extends JpaRepository<EventLog, Long> {
    List<EventLog> findByEventName(String eventName);
    
    @Query("SELECT DISTINCT e.eventName FROM EventLog e ORDER BY e.eventName")
    List<String> findDistinctEventNames();
}

