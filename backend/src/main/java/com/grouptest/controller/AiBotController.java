package com.grouptest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.AiBotSetting;
import com.grouptest.entity.AiBotTemplate;
import com.grouptest.service.AiBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-bot")
@CrossOrigin(origins = "*")
public class AiBotController {
    
    @Autowired
    private AiBotService aiBotService;
    
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings(@RequestParam(defaultValue = "shopping") String industry) {
        try {
            return aiBotService.getSettings(industry)
                .map(settings -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", settings);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    // 기본 설정 생성
                    AiBotSetting defaultSettings = new AiBotSetting();
                    defaultSettings.setIndustry(industry);
                    AiBotSetting saved = aiBotService.saveSettings(defaultSettings);
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", saved);
                    return ResponseEntity.ok(response);
                });
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/settings")
    public ResponseEntity<Map<String, Object>> saveSettings(@RequestBody AiBotSetting settings) {
        try {
            AiBotSetting saved = aiBotService.saveSettings(settings);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/templates")
    public ResponseEntity<Map<String, Object>> getTemplates(@RequestParam(defaultValue = "shopping") String industry) {
        try {
            List<AiBotTemplate> templates = aiBotService.getTemplates(industry);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", templates);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/templates")
    public ResponseEntity<Map<String, Object>> saveTemplates(@RequestBody List<AiBotTemplate> templates) {
        try {
            List<AiBotTemplate> saved = aiBotService.saveTemplates(templates);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 템플릿 ID 배열로 템플릿 저장 (원본과 호환)
     */
    @PostMapping("/templates/ids")
    public ResponseEntity<Map<String, Object>> saveTemplatesByIds(
            @RequestParam(defaultValue = "shopping") String industry,
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> templateIds = (List<Integer>) request.get("templateIds");
            if (templateIds == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "templateIds는 필수입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            List<AiBotTemplate> saved = aiBotService.saveTemplatesByIds(industry, templateIds);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "템플릿이 저장되었습니다.");
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 연동 설정 저장
     */
    @PostMapping("/integration")
    public ResponseEntity<Map<String, Object>> saveIntegration(
            @RequestParam(defaultValue = "shopping") String industry,
            @RequestBody Map<String, Object> integration) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String integrationConfig = objectMapper.writeValueAsString(integration);
            
            AiBotSetting saved = aiBotService.saveIntegration(industry, integrationConfig);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", saved.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 워크플로우 동기화
     */
    @PostMapping("/sync-workflows")
    public ResponseEntity<Map<String, Object>> syncWorkflows(
            @RequestParam(defaultValue = "shopping") String industry) {
        try {
            AiBotService.SyncWorkflowResult result = aiBotService.syncWorkflows(industry);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result.getCount() + "개의 워크플로우가 동기화되었습니다.");
            
            List<Map<String, Object>> workflowsData = new ArrayList<>();
            for (AiBotService.WorkflowSyncInfo info : result.getWorkflows()) {
                Map<String, Object> workflowData = new HashMap<>();
                workflowData.put("id", info.getId());
                workflowData.put("name", info.getName());
                workflowData.put("action", info.getAction());
                workflowsData.add(workflowData);
            }
            response.put("data", workflowsData);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

