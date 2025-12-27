package com.grouptest.controller;

import com.grouptest.entity.Workflow;
import com.grouptest.entity.WorkflowFolder;
import com.grouptest.repository.WorkflowFolderRepository;
import com.grouptest.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin(origins = "*")
public class FolderController {
    
    @Autowired
    private WorkflowFolderRepository folderRepository;
    
    @Autowired
    private WorkflowRepository workflowRepository;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFolders() {
        try {
            List<WorkflowFolder> folders = folderRepository.findAllByOrderByNameAsc();
            
            // 각 폴더의 워크플로우 수 계산
            List<Map<String, Object>> foldersWithCount = folders.stream().map(folder -> {
                Map<String, Object> folderData = new HashMap<>();
                folderData.put("id", folder.getId());
                folderData.put("name", folder.getName());
                folderData.put("parent_id", folder.getParentId());
                folderData.put("created_at", folder.getCreatedAt());
                folderData.put("updated_at", folder.getUpdatedAt());
                
                long workflowCount = workflowRepository.countByFolderId(folder.getId());
                folderData.put("workflow_count", workflowCount);
                
                return folderData;
            }).toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", foldersWithCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createFolder(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            if (name == null || name.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "폴더 이름은 필수입니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            WorkflowFolder folder = new WorkflowFolder();
            folder.setName(name.trim());
            
            if (request.containsKey("parent_id") && request.get("parent_id") != null) {
                folder.setParentId(Long.parseLong(request.get("parent_id").toString()));
            }
            
            WorkflowFolder saved = folderRepository.save(folder);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", saved.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateFolder(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<WorkflowFolder> optionalFolder = folderRepository.findById(id);
            if (optionalFolder.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            WorkflowFolder folder = optionalFolder.get();
            String name = (String) request.get("name");
            if (name != null && !name.trim().isEmpty()) {
                folder.setName(name.trim());
            }
            
            WorkflowFolder saved = folderRepository.save(folder);
            
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
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFolder(@PathVariable Long id) {
        try {
            // 폴더 내 워크플로우는 폴더 없음으로 변경
            List<Workflow> workflows = workflowRepository.findByFolderId(id);
            for (Workflow workflow : workflows) {
                workflow.setFolderId(null);
                workflowRepository.save(workflow);
            }
            
            folderRepository.deleteById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

