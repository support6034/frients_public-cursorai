package com.grouptest.controller;

import com.grouptest.service.WorkflowExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class WebhookTestController {
    
    @Autowired
    private WorkflowExecutionService workflowExecutionService;
    
    @PostMapping("/webhook-test")
    public ResponseEntity<Map<String, Object>> testWebhook(@RequestBody Map<String, Object> request) {
        try {
            String webhookUrl = (String) request.get("webhook_url");
            if (webhookUrl == null || webhookUrl.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Webhook URL이 필요합니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> webhookParams = (Map<String, Object>) request.getOrDefault("webhook_params", new HashMap<>());
            @SuppressWarnings("unchecked")
            Map<String, Object> testData = (Map<String, Object>) request.getOrDefault("testData", new HashMap<>());
            
            // 알림봇 API인 경우 형식 변환, 아니면 기존 방식
            Map<String, Object> processedParams;
            if (webhookUrl.contains("alimbot.com")) {
                processedParams = workflowExecutionService.transformToAlimbotFormat(webhookParams, testData);
            } else {
                processedParams = workflowExecutionService.processParameters(webhookParams, testData);
            }
            
            // 웹훅 실행
            Map<String, Object> response = workflowExecutionService.executeWebhookTest(webhookUrl, processedParams);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("status", 200);
            responseData.put("data", response);
            result.put("response", responseData);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            if (e.getCause() != null) {
                response.put("details", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

