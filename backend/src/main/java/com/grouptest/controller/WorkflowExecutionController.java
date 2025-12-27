package com.grouptest.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.WorkflowExecution;
import com.grouptest.repository.WorkflowExecutionRepository;
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
public class WorkflowExecutionController {
    
    @Autowired
    private WorkflowExecutionRepository workflowExecutionRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @GetMapping("/execution-logs")
    public ResponseEntity<Map<String, Object>> getExecutionLogs(
            @RequestParam(defaultValue = "100") int limit) {
        try {
            List<WorkflowExecution> logs = workflowExecutionRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "executedAt"))
            ).getContent();
            
            // webhook_response 파싱
            List<Map<String, Object>> parsedLogs = logs.stream().map(log -> {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                logMap.put("workflow_id", log.getWorkflowId());
                logMap.put("event_id", log.getEventId());
                try {
                    logMap.put("webhook_response", log.getWebhookResponse() != null ? 
                        objectMapper.readValue(log.getWebhookResponse(), new TypeReference<Map<String, Object>>() {}) : new HashMap<>());
                } catch (Exception e) {
                    logMap.put("webhook_response", new HashMap<>());
                }
                logMap.put("status", log.getStatus());
                logMap.put("executed_at", log.getExecutedAt());
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

