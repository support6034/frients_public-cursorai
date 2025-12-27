package com.grouptest.controller;

import com.grouptest.entity.Workflow;
import com.grouptest.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows")
@CrossOrigin(origins = "*")
public class WorkflowController {
    
    @Autowired
    private WorkflowService workflowService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllWorkflows() {
        try {
            List<Workflow> workflows = workflowService.getAllWorkflows();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", workflows);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getWorkflow(@PathVariable Long id) {
        try {
            return workflowService.getWorkflowById(id)
                .map(workflow -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", workflow);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createWorkflow(@RequestBody Workflow workflow) {
        try {
            Workflow created = workflowService.createWorkflow(workflow);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateWorkflow(@PathVariable Long id, @RequestBody Workflow workflow) {
        try {
            Workflow updated = workflowService.updateWorkflow(id, workflow);
            if (updated != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", updated);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteWorkflow(@PathVariable Long id) {
        try {
            boolean deleted = workflowService.deleteWorkflow(id);
            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Workflow not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/{id}/launch")
    public ResponseEntity<Map<String, Object>> launchWorkflow(@PathVariable Long id) {
        try {
            Workflow workflow = workflowService.launchWorkflow(id);
            if (workflow != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", workflow);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/{id}/stop")
    public ResponseEntity<Map<String, Object>> stopWorkflow(@PathVariable Long id) {
        try {
            Workflow workflow = workflowService.stopWorkflow(id);
            if (workflow != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", workflow);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Map<String, Object>> duplicateWorkflow(@PathVariable Long id) {
        try {
            Workflow duplicated = workflowService.duplicateWorkflow(id);
            if (duplicated != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", duplicated);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/{id}/lead-count")
    public ResponseEntity<Map<String, Object>> getLeadCount(@PathVariable Long id) {
        try {
            long count = workflowService.getLeadCount(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testWorkflow(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> testData = (Map<String, Object>) request.getOrDefault("testData", new HashMap<>());
            Map<String, Object> result = workflowService.testWorkflow(id, testData);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("response", result);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
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
    
    @PutMapping("/{id}/goal")
    public ResponseEntity<Map<String, Object>> updateGoal(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String goalType = (String) request.get("goal_type");
            Integer goalTarget = request.get("goal_target") != null ? 
                Integer.parseInt(request.get("goal_target").toString()) : null;
            
            Workflow workflow = workflowService.updateGoal(id, goalType, goalTarget);
            if (workflow != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", workflow);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PutMapping("/{id}/folder")
    public ResponseEntity<Map<String, Object>> moveToFolder(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Long folderId = request.get("folder_id") != null ? 
                Long.parseLong(request.get("folder_id").toString()) : null;
            
            Workflow workflow = workflowService.moveToFolder(id, folderId);
            if (workflow != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", workflow);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

