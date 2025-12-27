package com.grouptest.controller;

import com.grouptest.entity.EventLog;
import com.grouptest.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EventController {
    
    @Autowired
    private EventService eventService;
    
    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> receiveEvent(@RequestBody Map<String, Object> eventData) {
        try {
            String eventName = (String) eventData.getOrDefault("event", "");
            
            // 이벤트 저장
            EventLog eventLog = eventService.saveEvent(eventName, eventData);
            
            // 워크플로우 처리 (비동기로 처리하는 것이 좋지만 일단 동기 처리)
            eventService.processEvent(eventLog);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("eventId", eventLog.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getAllEvents() {
        try {
            List<EventLog> events = eventService.getAllEvents();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", events);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/events/distinct")
    public ResponseEntity<Map<String, Object>> getDistinctEventNames() {
        try {
            List<String> eventNames = eventService.getDistinctEventNames();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", eventNames);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

