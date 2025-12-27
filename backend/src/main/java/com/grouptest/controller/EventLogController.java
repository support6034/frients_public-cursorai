package com.grouptest.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.EventLog;
import com.grouptest.repository.EventLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EventLogController {
    
    @Autowired
    private EventLogRepository eventLogRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @GetMapping("/event-logs")
    public ResponseEntity<Map<String, Object>> getEventLogs(
            @RequestParam(defaultValue = "100") int limit) {
        try {
            List<EventLog> logs = eventLogRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "receivedAt"))
            ).getContent();
            
            // event_data 파싱
            List<Map<String, Object>> parsedLogs = logs.stream().map(log -> {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                logMap.put("event_name", log.getEventName());
                try {
                    logMap.put("event_data", log.getEventData() != null ? 
                        objectMapper.readValue(log.getEventData(), new TypeReference<Map<String, Object>>() {}) : new HashMap<>());
                } catch (Exception e) {
                    logMap.put("event_data", new HashMap<>());
                }
                logMap.put("received_at", log.getReceivedAt());
                return logMap;
            }).toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", parsedLogs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
}

