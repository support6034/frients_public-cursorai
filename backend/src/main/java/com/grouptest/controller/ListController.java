package com.grouptest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.ListEntity;
import com.grouptest.entity.ListMember;
import com.grouptest.service.ListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ListController {
    
    @Autowired
    private ListService listService;
    
    @GetMapping("/lists")
    public ResponseEntity<Map<String, Object>> getAllLists() {
        try {
            List<ListEntity> lists = listService.getAllLists();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/lists/{id}")
    public ResponseEntity<Map<String, Object>> getList(@PathVariable Long id) {
        try {
            return listService.getListById(id)
                .map(list -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("data", list);
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
    
    @PostMapping("/lists")
    public ResponseEntity<Map<String, Object>> createList(@RequestBody ListEntity list) {
        try {
            ListEntity created = listService.createList(list);
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
    
    @PutMapping("/lists/{id}")
    public ResponseEntity<Map<String, Object>> updateList(@PathVariable Long id, @RequestBody ListEntity list) {
        try {
            ListEntity updated = listService.updateList(id, list);
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
    
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Map<String, Object>> deleteList(@PathVariable Long id) {
        try {
            boolean deleted = listService.deleteList(id);
            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "List not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/lists/{id}/members")
    public ResponseEntity<Map<String, Object>> getListMembers(@PathVariable Long id) {
        try {
            List<ListMember> members = listService.getListMembers(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", members);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/lists/{id}/members")
    public ResponseEntity<Map<String, Object>> addMember(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            // 프론트엔드에서 보내는 필드명을 백엔드 엔티티 필드명으로 변환
            ListMember member = new ListMember();
            
            // email 또는 leadEmail 필드 처리
            String email = null;
            if (request.containsKey("email")) {
                email = (String) request.get("email");
            } else if (request.containsKey("leadEmail")) {
                email = (String) request.get("leadEmail");
            } else if (request.containsKey("lead_email")) {
                email = (String) request.get("lead_email");
            }
            
            if (email == null || email.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "이메일은 필수입니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            member.setLeadEmail(email.trim());
            
            // first_name 또는 firstName 필드 처리
            if (request.containsKey("first_name")) {
                member.setFirstName((String) request.get("first_name"));
            } else if (request.containsKey("firstName")) {
                member.setFirstName((String) request.get("firstName"));
            }
            
            // phone_number 또는 phoneNumber 필드 처리
            if (request.containsKey("phone_number")) {
                member.setPhoneNumber((String) request.get("phone_number"));
            } else if (request.containsKey("phoneNumber")) {
                member.setPhoneNumber((String) request.get("phoneNumber"));
            }
            
            // lead_data 처리
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> leadDataMap = new HashMap<>();
            if (member.getFirstName() != null) {
                leadDataMap.put("first_name", member.getFirstName());
            }
            if (member.getPhoneNumber() != null) {
                leadDataMap.put("phone_number", member.getPhoneNumber());
            }
            member.setLeadData(objectMapper.writeValueAsString(leadDataMap));
            
            ListMember added = listService.addMember(id, member);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", added);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PutMapping("/lists/{id}/members/{email}")
    public ResponseEntity<Map<String, Object>> updateMember(@PathVariable Long id, @PathVariable String email, @RequestBody Map<String, Object> request) {
        try {
            String decodedEmail = java.net.URLDecoder.decode(email, "UTF-8");
            Optional<ListMember> optionalMember = listService.getListMemberByEmail(id, decodedEmail);
            
            if (optionalMember.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Member not found");
                return ResponseEntity.notFound().build();
            }
            
            ListMember member = optionalMember.get();
            
            // first_name 또는 firstName 필드 처리
            if (request.containsKey("first_name")) {
                member.setFirstName((String) request.get("first_name"));
            } else if (request.containsKey("firstName")) {
                member.setFirstName((String) request.get("firstName"));
            }
            
            // phone_number 또는 phoneNumber 필드 처리
            if (request.containsKey("phone_number")) {
                member.setPhoneNumber((String) request.get("phone_number"));
            } else if (request.containsKey("phoneNumber")) {
                member.setPhoneNumber((String) request.get("phoneNumber"));
            }
            
            // lead_data 업데이트
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> leadDataMap = new HashMap<>();
            if (member.getFirstName() != null) {
                leadDataMap.put("first_name", member.getFirstName());
            }
            if (member.getPhoneNumber() != null) {
                leadDataMap.put("phone_number", member.getPhoneNumber());
            }
            member.setLeadData(objectMapper.writeValueAsString(leadDataMap));
            
            ListMember updated = listService.updateMember(member);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @DeleteMapping("/lists/{id}/members/{email}")
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable Long id, @PathVariable String email) {
        try {
            boolean removed = listService.removeMember(id, email);
            Map<String, Object> response = new HashMap<>();
            if (removed) {
                response.put("success", true);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Member not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @DeleteMapping("/lists/{id}/members")
    public ResponseEntity<Map<String, Object>> removeMembers(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> emails = (List<String>) request.get("emails");
            if (emails == null || emails.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "삭제할 이메일 목록이 필요합니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            int deleted = 0;
            for (String email : emails) {
                if (listService.removeMember(id, email)) {
                    deleted++;
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("deleted", deleted);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/lists/{id}/export")
    public ResponseEntity<?> exportList(@PathVariable Long id) {
        try {
            List<ListMember> members = listService.getListMembers(id);
            
            // CSV 생성
            StringBuilder csv = new StringBuilder();
            // BOM for Excel UTF-8 compatibility
            csv.append('\uFEFF');
            csv.append("이메일,이름,휴대폰,추가일\n");
            
            for (ListMember member : members) {
                csv.append("\"").append(member.getLeadEmail() != null ? member.getLeadEmail() : "").append("\",");
                csv.append("\"").append(member.getFirstName() != null ? member.getFirstName() : "").append("\",");
                csv.append("\"").append(member.getPhoneNumber() != null ? member.getPhoneNumber() : "").append("\",");
                csv.append("\"").append(member.getAddedAt() != null ? member.getAddedAt().toString() : "").append("\"\n");
            }
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=utf-8")
                .header("Content-Disposition", "attachment; filename=\"list-" + id + "-" + System.currentTimeMillis() + ".csv\"")
                .body(csv.toString());
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/lists/{id}/import")
    public ResponseEntity<Map<String, Object>> importList(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) request.get("data");
            
            if (data == null || data.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "가져올 데이터가 없습니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            int imported = 0;
            int errors = 0;
            
            for (Map<String, Object> row : data) {
                String email = (String) row.get("email");
                if (email != null && !email.trim().isEmpty()) {
                    try {
                        ListMember member = new ListMember();
                        member.setListId(id);
                        member.setLeadEmail(email);
                        member.setFirstName((String) row.getOrDefault("first_name", ""));
                        member.setPhoneNumber((String) row.getOrDefault("phone_number", ""));
                        member.setLeadData("{}");
                        
                        listService.addMember(id, member);
                        imported++;
                    } catch (Exception e) {
                        errors++;
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("imported", imported);
            response.put("errors", errors);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PutMapping("/lists/{id}/goal")
    public ResponseEntity<Map<String, Object>> updateGoal(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Integer goalCount = request.get("goal_count") != null ? 
                Integer.parseInt(request.get("goal_count").toString()) : 0;
            String goalDescription = (String) request.getOrDefault("goal_description", "");
            
            java.util.Optional<ListEntity> optionalList = listService.getListById(id);
            if (optionalList.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "List not found");
                return ResponseEntity.notFound().build();
            }
            
            ListEntity list = optionalList.get();
            list.setGoalCount(goalCount);
            list.setGoalDescription(goalDescription);
            ListEntity updated = listService.updateList(id, list);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/leads/{email}/lists")
    public ResponseEntity<Map<String, Object>> getListsByEmail(@PathVariable String email) {
        try {
            String decodedEmail = java.net.URLDecoder.decode(email, "UTF-8");
            List<ListEntity> lists = listService.getListsByEmail(decodedEmail);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

