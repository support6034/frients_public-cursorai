package com.grouptest.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.ListMember;
import com.grouptest.entity.Workflow;
import com.grouptest.entity.WorkflowProcessedLead;
import com.grouptest.repository.ListMemberRepository;
import com.grouptest.repository.WorkflowProcessedLeadRepository;
import com.grouptest.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkflowService {
    
    @Autowired
    private WorkflowRepository workflowRepository;
    
    @Autowired
    private ListMemberRepository listMemberRepository;
    
    @Autowired
    private WorkflowProcessedLeadRepository workflowProcessedLeadRepository;
    
    @Autowired
    private WorkflowExecutionService workflowExecutionService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<Workflow> getAllWorkflows() {
        return workflowRepository.findAll();
    }
    
    public Optional<Workflow> getWorkflowById(Long id) {
        return workflowRepository.findById(id);
    }
    
    public List<Workflow> getLaunchedWorkflows() {
        return workflowRepository.findByIsLaunchedTrue();
    }
    
    public Workflow createWorkflow(Workflow workflow) {
        return workflowRepository.save(workflow);
    }
    
    public Workflow updateWorkflow(Long id, Workflow workflowData) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow workflow = optionalWorkflow.get();
            workflow.setName(workflowData.getName());
            workflow.setEventName(workflowData.getEventName());
            workflow.setFilter(workflowData.getFilter());
            workflow.setFrequency(workflowData.getFrequency());
            workflow.setFrequencyPeriod(workflowData.getFrequencyPeriod());
            workflow.setWebhookUrl(workflowData.getWebhookUrl());
            workflow.setWebhookParams(workflowData.getWebhookParams());
            workflow.setConditions(workflowData.getConditions());
            workflow.setActions(workflowData.getActions());
            workflow.setConditionLogic(workflowData.getConditionLogic());
            workflow.setActionLogic(workflowData.getActionLogic());
            workflow.setConditionGroups(workflowData.getConditionGroups());
            workflow.setGroupLogic(workflowData.getGroupLogic());
            workflow.setConditionSettings(workflowData.getConditionSettings());
            workflow.setGoalGroups(workflowData.getGoalGroups());
            workflow.setGoalGroupLogic(workflowData.getGoalGroupLogic());
            workflow.setFolderId(workflowData.getFolderId());
            workflow.setGoalType(workflowData.getGoalType());
            workflow.setGoalTarget(workflowData.getGoalTarget());
            return workflowRepository.save(workflow);
        }
        return null;
    }
    
    public boolean deleteWorkflow(Long id) {
        if (workflowRepository.existsById(id)) {
            workflowRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public Workflow launchWorkflow(Long id) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow workflow = optionalWorkflow.get();
            workflow.setIsLaunched(true);
            Workflow saved = workflowRepository.save(workflow);
            
            // 백그라운드에서 기존 리드 처리
            processExistingLeadsForWorkflow(id, saved);
            
            return saved;
        }
        return null;
    }
    
    /**
     * 워크플로우 런칭 시 기존 리드에 대해 액션 실행
     */
    @Async
    public void processExistingLeadsForWorkflow(Long workflowId, Workflow workflow) {
        try {
            // 조건 설정 파싱
            Map<String, Object> conditionSettings = new HashMap<>();
            conditionSettings.put("addCurrentLeads", true);
            conditionSettings.put("onlyFirstTime", true);
            
            if (workflow.getConditionSettings() != null && !workflow.getConditionSettings().isEmpty()) {
                try {
                    conditionSettings = objectMapper.readValue(
                        workflow.getConditionSettings(),
                        new TypeReference<Map<String, Object>>() {}
                    );
                } catch (Exception e) {
                    // 파싱 실패 시 기본값 사용
                }
            }
            
            // addCurrentLeads가 false면 기존 리드 처리 안 함
            if (conditionSettings.get("addCurrentLeads") != null && 
                !Boolean.TRUE.equals(conditionSettings.get("addCurrentLeads"))) {
                System.out.println("워크플로우 " + workflowId + ": addCurrentLeads=false, 기존 리드 처리 건너뜀");
                return;
            }
            
            // 조건 그룹 파싱
            List<Map<String, Object>> conditionGroups = new ArrayList<>();
            if (workflow.getConditionGroups() != null && !workflow.getConditionGroups().isEmpty()) {
                try {
                    conditionGroups = objectMapper.readValue(
                        workflow.getConditionGroups(),
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                } catch (Exception e) {
                    conditionGroups = new ArrayList<>();
                }
            } else if (workflow.getConditions() != null && !workflow.getConditions().isEmpty()) {
                try {
                    List<Map<String, Object>> conditions = objectMapper.readValue(
                        workflow.getConditions(),
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                    Map<String, Object> group = new HashMap<>();
                    group.put("id", 1L);
                    group.put("logic", workflow.getConditionLogic() != null ? workflow.getConditionLogic() : "AND");
                    group.put("conditions", conditions);
                    conditionGroups.add(group);
                } catch (Exception e) {
                    conditionGroups = new ArrayList<>();
                }
            }
            
            // 리스트 조건에서 리드 목록 가져오기
            Set<Long> listIds = new HashSet<>();
            for (Map<String, Object> group : conditionGroups) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> conditions = (List<Map<String, Object>>) group.getOrDefault("conditions", new ArrayList<>());
                for (Map<String, Object> cond : conditions) {
                    if ("list".equals(cond.get("type"))) {
                        Object listIdObj = cond.get("list_id");
                        if (listIdObj != null) {
                            Long listId = listIdObj instanceof Number ? 
                                ((Number) listIdObj).longValue() : 
                                Long.parseLong(listIdObj.toString());
                            listIds.add(listId);
                        }
                    }
                }
            }
            
            if (listIds.isEmpty()) {
                System.out.println("워크플로우 " + workflowId + ": 리스트 조건 없음");
                return;
            }
            
            // 조건을 만족하는 리드 조회 (중복 제거)
            List<ListMember> members = listMemberRepository.findAll().stream()
                .filter(m -> listIds.contains(m.getListId()))
                .collect(Collectors.toMap(
                    ListMember::getLeadEmail,
                    m -> m,
                    (m1, m2) -> m1 // 중복 시 첫 번째 선택
                ))
                .values()
                .stream()
                .collect(Collectors.toList());
            
            System.out.println("워크플로우 " + workflowId + ": " + members.size() + "개의 리드 발견");
            
            // onlyFirstTime이 true면 이미 처리된 리드 조회
            Set<String> processedLeads = new HashSet<>();
            if (Boolean.TRUE.equals(conditionSettings.get("onlyFirstTime"))) {
                List<WorkflowProcessedLead> processed = workflowProcessedLeadRepository.findAll()
                    .stream()
                    .filter(p -> p.getWorkflowId().equals(workflowId))
                    .collect(Collectors.toList());
                processedLeads = processed.stream()
                    .map(WorkflowProcessedLead::getLeadEmail)
                    .collect(Collectors.toSet());
            }
            
            // 액션 파싱
            List<Map<String, Object>> actions = new ArrayList<>();
            if (workflow.getActions() != null && !workflow.getActions().isEmpty()) {
                try {
                    actions = objectMapper.readValue(
                        workflow.getActions(),
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                } catch (Exception e) {
                    actions = new ArrayList<>();
                }
            }
            
            // 레거시 형식 지원
            if (actions.isEmpty() && workflow.getWebhookUrl() != null) {
                Map<String, Object> webhookAction = new HashMap<>();
                webhookAction.put("type", "webhook");
                webhookAction.put("webhook_url", workflow.getWebhookUrl());
                try {
                    webhookAction.put("webhook_params", 
                        workflow.getWebhookParams() != null ? 
                        objectMapper.readValue(workflow.getWebhookParams(), new TypeReference<Map<String, Object>>() {}) : 
                        new HashMap<>());
                } catch (Exception e) {
                    webhookAction.put("webhook_params", new HashMap<>());
                }
                actions.add(webhookAction);
            }
            
            // 각 리드에 대해 순차적으로 액션 실행
            for (ListMember member : members) {
                String leadEmail = member.getLeadEmail();
                
                // onlyFirstTime=true면 이미 처리된 리드 건너뜀
                if (Boolean.TRUE.equals(conditionSettings.get("onlyFirstTime")) && processedLeads.contains(leadEmail)) {
                    System.out.println("워크플로우 " + workflowId + ": " + leadEmail + " 이미 처리됨, 건너뜀");
                    continue;
                }
                
                try {
                    // 리드 데이터 구성
                    Map<String, Object> leadData = new HashMap<>();
                    leadData.put("email", leadEmail);
                    leadData.put("first_name", member.getFirstName() != null ? member.getFirstName() : "");
                    leadData.put("phone_number", member.getPhoneNumber() != null ? member.getPhoneNumber() : "");
                    
                    if (member.getLeadData() != null && !member.getLeadData().isEmpty()) {
                        try {
                            Map<String, Object> parsedData = objectMapper.readValue(
                                member.getLeadData(),
                                new TypeReference<Map<String, Object>>() {}
                            );
                            leadData.putAll(parsedData);
                        } catch (Exception e) {
                            // 파싱 실패 시 무시
                        }
                    }
                    
                    // 액션 실행
                    workflowExecutionService.executeActions(
                        actions,
                        workflow.getActionLogic() != null ? workflow.getActionLogic() : "AND",
                        leadEmail,
                        leadData,
                        workflow,
                        null // eventId는 null (기존 리드 처리)
                    );
                    
                    // onlyFirstTime=true면 처리 완료 기록
                    if (Boolean.TRUE.equals(conditionSettings.get("onlyFirstTime"))) {
                        if (!workflowProcessedLeadRepository.existsByWorkflowIdAndLeadEmail(workflowId, leadEmail)) {
                            WorkflowProcessedLead processed = new WorkflowProcessedLead();
                            processed.setWorkflowId(workflowId);
                            processed.setLeadEmail(leadEmail);
                            workflowProcessedLeadRepository.save(processed);
                        }
                    }
                    
                    System.out.println("워크플로우 " + workflowId + ": " + leadEmail + " 처리 완료");
                } catch (Exception e) {
                    System.err.println("워크플로우 " + workflowId + ": " + leadEmail + " 처리 오류: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("워크플로우 " + workflowId + ": 기존 리드 처리 완료");
        } catch (Exception e) {
            System.err.println("워크플로우 " + workflowId + ": 기존 리드 처리 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public Workflow stopWorkflow(Long id) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow workflow = optionalWorkflow.get();
            workflow.setIsLaunched(false);
            return workflowRepository.save(workflow);
        }
        return null;
    }
    
    public Workflow duplicateWorkflow(Long id) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow original = optionalWorkflow.get();
            Workflow duplicate = new Workflow();
            duplicate.setName(original.getName() + " (복사본)");
            duplicate.setEventName(original.getEventName());
            duplicate.setFilter(original.getFilter());
            duplicate.setFrequency(original.getFrequency());
            duplicate.setFrequencyPeriod(original.getFrequencyPeriod());
            duplicate.setWebhookUrl(original.getWebhookUrl());
            duplicate.setWebhookParams(original.getWebhookParams());
            duplicate.setIsLaunched(false);
            duplicate.setConditions(original.getConditions());
            duplicate.setActions(original.getActions());
            duplicate.setConditionLogic(original.getConditionLogic());
            duplicate.setActionLogic(original.getActionLogic());
            duplicate.setConditionGroups(original.getConditionGroups());
            duplicate.setGroupLogic(original.getGroupLogic());
            duplicate.setConditionSettings(original.getConditionSettings());
            duplicate.setGoalGroups(original.getGoalGroups());
            duplicate.setGoalGroupLogic(original.getGoalGroupLogic());
            duplicate.setFolderId(original.getFolderId());
            duplicate.setGoalType(original.getGoalType());
            duplicate.setGoalTarget(original.getGoalTarget());
            duplicate.setGoalCurrent(0);
            return workflowRepository.save(duplicate);
        }
        return null;
    }
    
    /**
     * 워크플로우 조건을 만족하는 리드 수 조회
     */
    public long getLeadCount(Long workflowId) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(workflowId);
        if (!optionalWorkflow.isPresent()) {
            return 0;
        }
        
        Workflow workflow = optionalWorkflow.get();
        
        // 조건 그룹 파싱
        List<Map<String, Object>> conditionGroups = new ArrayList<>();
        if (workflow.getConditionGroups() != null && !workflow.getConditionGroups().isEmpty()) {
            try {
                conditionGroups = objectMapper.readValue(
                    workflow.getConditionGroups(),
                    new TypeReference<List<Map<String, Object>>>() {}
                );
            } catch (Exception e) {
                conditionGroups = new ArrayList<>();
            }
        } else if (workflow.getConditions() != null && !workflow.getConditions().isEmpty()) {
            try {
                List<Map<String, Object>> conditions = objectMapper.readValue(
                    workflow.getConditions(),
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                Map<String, Object> group = new HashMap<>();
                group.put("id", 1L);
                group.put("logic", workflow.getConditionLogic() != null ? workflow.getConditionLogic() : "AND");
                group.put("conditions", conditions);
                conditionGroups.add(group);
            } catch (Exception e) {
                conditionGroups = new ArrayList<>();
            }
        }
        
        // 리스트 조건에서 리드 수 계산
        Set<Long> listIds = new HashSet<>();
        for (Map<String, Object> group : conditionGroups) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) group.getOrDefault("conditions", new ArrayList<>());
            for (Map<String, Object> cond : conditions) {
                if ("list".equals(cond.get("type"))) {
                    Object listIdObj = cond.get("list_id");
                    if (listIdObj != null) {
                        Long listId = listIdObj instanceof Number ? 
                            ((Number) listIdObj).longValue() : 
                            Long.parseLong(listIdObj.toString());
                        listIds.add(listId);
                    }
                }
            }
        }
        
        if (listIds.isEmpty()) {
            return 0;
        }
        
        // 리스트 멤버 수 합산 (중복 제거)
        return listMemberRepository.findAll().stream()
            .filter(m -> listIds.contains(m.getListId()))
            .map(ListMember::getLeadEmail)
            .distinct()
            .count();
    }
    
    /**
     * 워크플로우 테스트 (웹훅 발동 테스트)
     */
    public Map<String, Object> testWorkflow(Long workflowId, Map<String, Object> testData) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(workflowId);
        if (!optionalWorkflow.isPresent()) {
            throw new IllegalArgumentException("Workflow not found");
        }
        
        Workflow workflow = optionalWorkflow.get();
        
        // 웹훅 URL이 없으면 에러
        if (workflow.getWebhookUrl() == null || workflow.getWebhookUrl().isEmpty()) {
            throw new IllegalArgumentException("Webhook URL is not set");
        }
        
        // 웹훅 파라미터 파싱
        Map<String, Object> webhookParams = new HashMap<>();
        if (workflow.getWebhookParams() != null && !workflow.getWebhookParams().isEmpty()) {
            try {
                webhookParams = objectMapper.readValue(
                    workflow.getWebhookParams(),
                    new TypeReference<Map<String, Object>>() {}
                );
            } catch (Exception e) {
                webhookParams = new HashMap<>();
            }
        }
        
        // 알림봇 API인 경우 형식 변환, 아니면 기존 방식
        Map<String, Object> processedParams;
        if (workflow.getWebhookUrl().contains("alimbot.com")) {
            processedParams = workflowExecutionService.transformToAlimbotFormat(webhookParams, testData);
        } else {
            processedParams = workflowExecutionService.processParameters(webhookParams, testData);
        }
        
        System.out.println("웹훅 테스트: " + workflow.getWebhookUrl() + " " + processedParams);
        
        try {
            // 웹훅 발동
            Map<String, Object> response = workflowExecutionService.executeWebhookTest(
                workflow.getWebhookUrl(),
                processedParams
            );
            
            // 테스트 성공 로그 저장
            Map<String, Object> logData = new HashMap<>();
            logData.put("test", true);
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("url", workflow.getWebhookUrl());
            requestData.put("params", processedParams);
            logData.put("request", requestData);
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("status", 200);
            responseData.put("data", response);
            logData.put("response", responseData);
            
            workflowExecutionService.saveExecutionLog(
                workflow.getId(),
                null, // eventId는 null (테스트)
                objectMapper.writeValueAsString(logData),
                "test_success",
                null
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", 200);
            result.put("data", response);
            return result;
        } catch (Exception e) {
            System.err.println("웹훅 테스트 오류: " + e.getMessage());
            
            // 테스트 실패 로그 저장
            Map<String, Object> logData = new HashMap<>();
            logData.put("test", true);
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("url", workflow.getWebhookUrl());
            requestData.put("params", processedParams);
            logData.put("request", requestData);
            logData.put("error", e.getMessage());
            if (e.getCause() != null) {
                logData.put("details", e.getCause().getMessage());
            }
            
            try {
                workflowExecutionService.saveExecutionLog(
                    workflow.getId(),
                    null, // eventId는 null (테스트)
                    objectMapper.writeValueAsString(logData),
                    "test_failed",
                    e.getMessage()
                );
            } catch (Exception ex) {
                // 로그 저장 실패 무시
            }
            
            throw new RuntimeException("Webhook test failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * 워크플로우 목표 설정
     */
    public Workflow updateGoal(Long id, String goalType, Integer goalTarget) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow workflow = optionalWorkflow.get();
            if (goalType != null) {
                workflow.setGoalType(goalType);
            }
            if (goalTarget != null) {
                workflow.setGoalTarget(goalTarget);
            }
            return workflowRepository.save(workflow);
        }
        return null;
    }
    
    /**
     * 워크플로우 폴더 이동
     */
    public Workflow moveToFolder(Long id, Long folderId) {
        Optional<Workflow> optionalWorkflow = workflowRepository.findById(id);
        if (optionalWorkflow.isPresent()) {
            Workflow workflow = optionalWorkflow.get();
            workflow.setFolderId(folderId);
            return workflowRepository.save(workflow);
        }
        return null;
    }
}

