package com.grouptest.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.DebugLog;
import com.grouptest.repository.DebugLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug-logs")
@CrossOrigin(origins = "*")
public class DebugLogController {
    
    @Autowired
    private DebugLogRepository debugLogRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDebugLogs(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String component,
            @RequestParam(required = false) String direction) {
        try {
            List<DebugLog> logs = debugLogRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();
            
            // 필터링
            if (component != null) {
                logs = logs.stream()
                    .filter(log -> component.equals(log.getComponent()))
                    .toList();
            }
            if (direction != null) {
                logs = logs.stream()
                    .filter(log -> direction.equals(log.getDirection()))
                    .toList();
            }
            
            // JSON 파싱
            List<Map<String, Object>> parsedLogs = logs.stream().map(log -> {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                logMap.put("component", log.getComponent());
                logMap.put("direction", log.getDirection());
                logMap.put("action", log.getAction());
                logMap.put("url", log.getUrl());
                try {
                    logMap.put("request_data", log.getRequestData() != null ? 
                        objectMapper.readValue(log.getRequestData(), new TypeReference<Map<String, Object>>() {}) : null);
                    logMap.put("response_data", log.getResponseData() != null ? 
                        objectMapper.readValue(log.getResponseData(), new TypeReference<Map<String, Object>>() {}) : null);
                } catch (Exception e) {
                    logMap.put("request_data", null);
                    logMap.put("response_data", null);
                }
                logMap.put("status", log.getStatus());
                logMap.put("error_message", log.getErrorMessage());
                logMap.put("created_at", log.getCreatedAt());
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
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDebugLogStats() {
        try {
            // 24시간 이내 로그 통계
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            List<DebugLog> recentLogs = debugLogRepository.findAll()
                .stream()
                .filter(log -> log.getCreatedAt() != null && log.getCreatedAt().isAfter(yesterday))
                .toList();
            
            // 통계 계산
            Map<String, Map<String, Map<String, Long>>> stats = new HashMap<>();
            for (DebugLog log : recentLogs) {
                String comp = log.getComponent();
                String dir = log.getDirection();
                String status = log.getStatus() != null ? log.getStatus() : "unknown";
                
                stats.putIfAbsent(comp, new HashMap<>());
                stats.get(comp).putIfAbsent(dir, new HashMap<>());
                stats.get(comp).get(dir).put(status, 
                    stats.get(comp).get(dir).getOrDefault(status, 0L) + 1);
            }
            
            // 응답 형식 변환
            List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (Map.Entry<String, Map<String, Map<String, Long>>> compEntry : stats.entrySet()) {
                for (Map.Entry<String, Map<String, Long>> dirEntry : compEntry.getValue().entrySet()) {
                    for (Map.Entry<String, Long> statusEntry : dirEntry.getValue().entrySet()) {
                        Map<String, Object> stat = new HashMap<>();
                        stat.put("component", compEntry.getKey());
                        stat.put("direction", dirEntry.getKey());
                        stat.put("status", statusEntry.getKey());
                        stat.put("count", statusEntry.getValue());
                        result.add(stat);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

