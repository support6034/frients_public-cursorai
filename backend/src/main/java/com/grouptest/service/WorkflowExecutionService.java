package com.grouptest.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.DebugLog;
import com.grouptest.entity.ListMember;
import com.grouptest.entity.Workflow;
import com.grouptest.entity.WorkflowExecution;
import com.grouptest.repository.DebugLogRepository;
import com.grouptest.repository.ListMemberRepository;
import com.grouptest.repository.WorkflowExecutionRepository;
import com.grouptest.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class WorkflowExecutionService {
    
    @Autowired
    private ListMemberRepository listMemberRepository;
    
    @Autowired
    private WorkflowExecutionRepository workflowExecutionRepository;
    
    @Autowired
    private DebugLogRepository debugLogRepository;
    
    @Autowired
    private WorkflowRepository workflowRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * 워크플로우 정규화 (하위 호환성)
     */
    public NormalizedWorkflow normalizeWorkflow(Workflow workflow) {
        try {
            // 새 형식 (condition_groups)
            if (workflow.getConditionGroups() != null && !workflow.getConditionGroups().isEmpty()) {
                List<Map<String, Object>> conditionGroups = parseJson(workflow.getConditionGroups(), 
                    new TypeReference<List<Map<String, Object>>>() {});
                List<Map<String, Object>> actions = parseJson(workflow.getActions(), 
                    new TypeReference<List<Map<String, Object>>>() {});
                
                return new NormalizedWorkflow(
                    conditionGroups,
                    workflow.getGroupLogic() != null ? workflow.getGroupLogic() : "AND",
                    actions != null ? actions : new ArrayList<>(),
                    workflow.getActionLogic() != null ? workflow.getActionLogic() : "AND"
                );
            }
            
            // 기존 형식 (conditions 배열)
            if (workflow.getConditions() != null && !workflow.getConditions().isEmpty()) {
                List<Map<String, Object>> conditions = parseJson(workflow.getConditions(), 
                    new TypeReference<List<Map<String, Object>>>() {});
                List<Map<String, Object>> actions = parseJson(workflow.getActions(), 
                    new TypeReference<List<Map<String, Object>>>() {});
                
                // 기존 조건들을 하나의 그룹으로 래핑
                Map<String, Object> group = new HashMap<>();
                group.put("id", System.currentTimeMillis());
                group.put("logic", workflow.getConditionLogic() != null ? workflow.getConditionLogic() : "AND");
                group.put("conditions", conditions);
                
                return new NormalizedWorkflow(
                    Arrays.asList(group),
                    "AND",
                    actions != null ? actions : new ArrayList<>(),
                    workflow.getActionLogic() != null ? workflow.getActionLogic() : "AND"
                );
            }
            
            // 레거시 형식 (event_name 단일 필드)
            if (workflow.getEventName() != null) {
                Map<String, Object> condition = new HashMap<>();
                condition.put("type", "custom_event");
                condition.put("event_name", workflow.getEventName());
                condition.put("filter", workflow.getFilter() != null ? workflow.getFilter() : "존재하는");
                condition.put("frequency", workflow.getFrequency() != null ? workflow.getFrequency() : 1);
                condition.put("frequency_period", workflow.getFrequencyPeriod() != null ? workflow.getFrequencyPeriod() : "기간과 상관없이");
                
                Map<String, Object> group = new HashMap<>();
                group.put("id", System.currentTimeMillis());
                group.put("logic", "AND");
                group.put("conditions", Arrays.asList(condition));
                
                List<Map<String, Object>> actions = new ArrayList<>();
                if (workflow.getWebhookUrl() != null) {
                    Map<String, Object> webhookAction = new HashMap<>();
                    webhookAction.put("step", 1);
                    webhookAction.put("type", "webhook");
                    webhookAction.put("webhook_url", workflow.getWebhookUrl());
                    try {
                        webhookAction.put("webhook_params", 
                            workflow.getWebhookParams() != null ? 
                            parseJson(workflow.getWebhookParams(), new TypeReference<Map<String, Object>>() {}) : 
                            new HashMap<>());
                    } catch (Exception e) {
                        webhookAction.put("webhook_params", new HashMap<>());
                    }
                    actions.add(webhookAction);
                }
                
                return new NormalizedWorkflow(
                    Arrays.asList(group),
                    "AND",
                    actions,
                    "AND"
                );
            }
            
            return new NormalizedWorkflow(new ArrayList<>(), "AND", new ArrayList<>(), "AND");
        } catch (Exception e) {
            throw new RuntimeException("Failed to normalize workflow", e);
        }
    }
    
    /**
     * 조건 평가 (조건 그룹 포함)
     */
    public boolean evaluateConditions(List<Map<String, Object>> conditionGroups, String groupLogic, 
                                      String leadEmail, Map<String, Object> eventData) {
        if (conditionGroups == null || conditionGroups.isEmpty()) {
            return true;
        }
        
        List<Boolean> groupResults = new ArrayList<>();
        for (Map<String, Object> group : conditionGroups) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) group.get("conditions");
            String logic = (String) group.getOrDefault("logic", "AND");
            
            boolean groupResult = evaluateConditionGroup(conditions, logic, leadEmail, eventData);
            groupResults.add(groupResult);
        }
        
        // 그룹 간 로직 평가
        if ("OR".equalsIgnoreCase(groupLogic)) {
            return groupResults.stream().anyMatch(r -> r);
        } else {
            return groupResults.stream().allMatch(r -> r);
        }
    }
    
    /**
     * 조건 그룹 평가
     */
    private boolean evaluateConditionGroup(List<Map<String, Object>> conditions, String logic, 
                                          String leadEmail, Map<String, Object> eventData) {
        if (conditions == null || conditions.isEmpty()) {
            return true;
        }
        
        List<Boolean> results = new ArrayList<>();
        for (Map<String, Object> condition : conditions) {
            String type = (String) condition.get("type");
            boolean result = false;
            
            if ("list".equals(type)) {
                result = evaluateListCondition(condition, leadEmail);
            } else if ("custom_event".equals(type)) {
                result = evaluateEventCondition(condition, eventData);
            }
            
            results.add(result);
        }
        
        // 조건 간 로직 평가
        if ("OR".equalsIgnoreCase(logic)) {
            return results.stream().anyMatch(r -> r);
        } else {
            return results.stream().allMatch(r -> r);
        }
    }
    
    /**
     * 리스트 조건 평가
     */
    private boolean evaluateListCondition(Map<String, Object> condition, String leadEmail) {
        if (leadEmail == null || leadEmail.isEmpty()) {
            String filter = (String) condition.getOrDefault("filter", "in_list");
            return "not_in_list".equals(filter);
        }
        
        Object listIdObj = condition.get("list_id");
        
        if (listIdObj == null) {
            // Any list 체크
            List<ListMember> members = listMemberRepository.findByLeadEmail(leadEmail);
            boolean inAnyList = !members.isEmpty();
            String filter = (String) condition.getOrDefault("filter", "in_list");
            return "in_list".equals(filter) ? inAnyList : !inAnyList;
        } else {
            // 특정 리스트 체크
            Long listId = listIdObj instanceof Number ? ((Number) listIdObj).longValue() : Long.parseLong(listIdObj.toString());
            Optional<ListMember> member = listMemberRepository.findByListIdAndLeadEmail(listId, leadEmail);
            boolean inList = member.isPresent();
            String filter = (String) condition.getOrDefault("filter", "in_list");
            return "in_list".equals(filter) ? inList : !inList;
        }
    }
    
    /**
     * 이벤트 조건 평가
     */
    private boolean evaluateEventCondition(Map<String, Object> condition, Map<String, Object> eventData) {
        String conditionEventName = (String) condition.get("event_name");
        String eventName = (String) eventData.getOrDefault("event", eventData.getOrDefault("event_name", ""));
        
        boolean eventMatches = conditionEventName != null && conditionEventName.equals(eventName);
        
        String filter = (String) condition.getOrDefault("filter", "존재하는");
        String filterLower = filter.toLowerCase();
        boolean filterExists = !filterLower.contains("않") && !filterLower.contains("not");
        
        return filterExists ? eventMatches : !eventMatches;
    }
    
    /**
     * 액션 실행
     */
    public void executeActions(List<Map<String, Object>> actions, String actionLogic, 
                              String leadEmail, Map<String, Object> eventData, 
                              Workflow workflow, Long eventId) {
        if (actions == null || actions.isEmpty()) {
            return;
        }
        
        for (Map<String, Object> action : actions) {
            try {
                String type = (String) action.get("type");
                if ("list".equals(type)) {
                    executeListAction(action, leadEmail, eventData);
                } else if ("webhook".equals(type)) {
                    executeWebhookAction(action, eventData, workflow, eventId);
                }
            } catch (Exception e) {
                System.err.println("액션 실행 오류: " + e.getMessage());
                // 다음 액션 계속 실행
            }
        }
    }
    
    /**
     * 리스트 액션 실행
     */
    private void executeListAction(Map<String, Object> action, String leadEmail, Map<String, Object> eventData) {
        if (leadEmail == null || leadEmail.isEmpty()) {
            System.out.println("리스트 액션: 이메일 없음, 건너뜀");
            return;
        }
        
        Object listIdObj = action.get("list_id");
        if (listIdObj == null) {
            return;
        }
        
        Long listId = listIdObj instanceof Number ? ((Number) listIdObj).longValue() : Long.parseLong(listIdObj.toString());
        String actionType = (String) action.getOrDefault("action", "add");
        
        Map<String, Object> leadDataMap = new HashMap<>();
        leadDataMap.put("first_name", eventData.getOrDefault("first_name", ""));
        leadDataMap.put("phone_number", eventData.getOrDefault("phone_number", ""));
        leadDataMap.putAll(eventData);
        
        try {
            String leadData = objectMapper.writeValueAsString(leadDataMap);
            
            if ("add".equals(actionType)) {
                Optional<ListMember> existing = listMemberRepository.findByListIdAndLeadEmail(listId, leadEmail);
                if (existing.isPresent()) {
                    ListMember member = existing.get();
                    member.setLeadData(leadData);
                    listMemberRepository.save(member);
                } else {
                    ListMember member = new ListMember();
                    member.setListId(listId);
                    member.setLeadEmail(leadEmail);
                    member.setLeadData(leadData);
                    member.setFirstName((String) eventData.getOrDefault("first_name", ""));
                    member.setPhoneNumber((String) eventData.getOrDefault("phone_number", ""));
                    listMemberRepository.save(member);
                }
                System.out.println("리스트 " + listId + "에 " + leadEmail + " 추가됨");
            } else {
                listMemberRepository.findByListIdAndLeadEmail(listId, leadEmail)
                    .ifPresent(listMemberRepository::delete);
                System.out.println("리스트 " + listId + "에서 " + leadEmail + " 제거됨");
            }
        } catch (Exception e) {
            throw new RuntimeException("리스트 액션 실행 오류", e);
        }
    }
    
    /**
     * 웹훅 액션 실행
     */
    private void executeWebhookAction(Map<String, Object> action, Map<String, Object> eventData, 
                                     Workflow workflow, Long eventId) {
        String webhookUrl = (String) action.get("webhook_url");
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            return;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> webhookParams = (Map<String, Object>) action.getOrDefault("webhook_params", new HashMap<>());
        
        Map<String, Object> processedParams;
        if (webhookUrl.contains("alimbot.com")) {
            processedParams = transformToAlimbotFormat(webhookParams, eventData);
        } else {
            processedParams = processParameters(webhookParams, eventData);
        }
        
        System.out.println("웹훅 발동: " + webhookUrl + " " + processedParams);
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(webhookUrl, processedParams, Map.class);
            
            // WF 디버그 로그 저장 (웹훅 발동 성공)
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("url", webhookUrl);
            requestData.put("params", processedParams);
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("status", 200);
            responseData.put("data", response);
            saveDebugLog("WF", "OUT", "웹훅 발동", webhookUrl, requestData, responseData, "success", null);
            
            Map<String, Object> logData = new HashMap<>();
            logData.put("request", requestData);
            logData.put("response", responseData);
            
            saveExecutionLog(workflow.getId(), eventId, objectMapper.writeValueAsString(logData), "success", null);
            System.out.println("웹훅 발동 성공");
        } catch (Exception e) {
            System.err.println("웹훅 발동 오류: " + e.getMessage());
            
            // WF 디버그 로그 저장 (웹훅 발동 실패)
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("url", webhookUrl);
            requestData.put("params", processedParams);
            Map<String, Object> errorResponseData = null;
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorResponseData = new HashMap<>();
                errorResponseData.put("error", e.getCause().getMessage());
            }
            saveDebugLog("WF", "OUT", "웹훅 발동", webhookUrl, requestData, errorResponseData, "failed", e.getMessage());
            
            Map<String, Object> logData = new HashMap<>();
            logData.put("request", requestData);
            logData.put("error", e.getMessage());
            
            try {
                saveExecutionLog(workflow.getId(), eventId, objectMapper.writeValueAsString(logData), "failed", e.getMessage());
            } catch (Exception ex) {
                // 로그 저장 실패 무시
            }
        }
    }
    
    /**
     * 파라미터 변수 치환
     */
    public Map<String, Object> processParameters(Map<String, Object> params, Map<String, Object> eventData) {
        Map<String, Object> processed = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            
            if (value instanceof String) {
                String strValue = (String) value;
                if (strValue.startsWith("{{") && strValue.endsWith("}}")) {
                    String varName = strValue.substring(2, strValue.length() - 2).trim();
                    processed.put(key, eventData.getOrDefault(varName, strValue));
                } else {
                    processed.put(key, value);
                }
            } else {
                processed.put(key, value);
            }
        }
        
        return processed;
    }
    
    /**
     * 알림봇 API 형식으로 변환
     */
    public Map<String, Object> transformToAlimbotFormat(Map<String, Object> params, Map<String, Object> eventData) {
        Map<String, Object> alimbotPayload = new HashMap<>();
        
        // 기본 필드 (원본과 동일하게)
        alimbotPayload.put("subscribed", true);
        alimbotPayload.put("cid", generateMsgId());
        alimbotPayload.put("createdAt", null);  // ✅ 추가
        alimbotPayload.put("updatedAt", null);  // ✅ 추가
        alimbotPayload.put("email", eventData.getOrDefault("email", ""));
        alimbotPayload.put("leadScore", 0);
        alimbotPayload.put("trackable", true);
        alimbotPayload.put("wpTrackable", false);
        alimbotPayload.put("crmExportable", false);
        alimbotPayload.put("receiveNum", null);  // ✅ 추가
        alimbotPayload.put("key", null);  // ✅ 추가
        alimbotPayload.put("channelType", null);  // ✅ 추가
        
        // dynamic_attributes (원본과 동일하게)
        Map<String, Object> dynamicAttributes = new HashMap<>();
        dynamicAttributes.put("first_name", eventData.getOrDefault("first_name", ""));
        dynamicAttributes.put("phone_number", eventData.getOrDefault("phone_number", ""));
        dynamicAttributes.put("geoip_country", "Republic of Korea");
        dynamicAttributes.put("geoip_state", "");  // ✅ 추가
        dynamicAttributes.put("geoip_city", "");  // ✅ 추가
        dynamicAttributes.put("eu_ip_address", false);  // ✅ 추가
        alimbotPayload.put("dynamic_attributes", dynamicAttributes);
        
        // extra_parameters (원본과 동일하게)
        Map<String, Object> extraParams = new HashMap<>();
        extraParams.put("bizmId", params.getOrDefault("bizmId", ""));
        extraParams.put("key", params.getOrDefault("key", ""));
        extraParams.put("type", params.getOrDefault("type", "03"));
        extraParams.put("profile", params.getOrDefault("profile", ""));
        extraParams.put("receiveNum", null);  // ✅ 추가
        extraParams.put("senderNumber", null);  // ✅ 추가
        extraParams.put("smsTitle", null);  // ✅ 추가
        extraParams.put("tempCode", params.getOrDefault("tempCode", ""));
        extraParams.put("message", params.getOrDefault("message", ""));
        extraParams.put("messageType", params.getOrDefault("message_type", "AI"));  // ✅ 추가
        
        int paramCount = params.get("paramCount") != null ? 
            Integer.parseInt(params.get("paramCount").toString()) : 0;
        int buttonCount = params.get("buttonCount") != null ? 
            Integer.parseInt(params.get("buttonCount").toString()) : 0;
        
        extraParams.put("paramCount", paramCount);
        extraParams.put("buttonCount", buttonCount);
        
        // params 객체 (원본 템플릿 유지, 변수 치환 안 함)
        Map<String, Object> paramsObj = new HashMap<>();
        for (int i = 1; i <= paramCount; i++) {
            String paramKey = "param" + i;
            paramsObj.put(paramKey, params.getOrDefault(paramKey, ""));
        }
        extraParams.put("params", paramsObj);
        
        // 버튼 관련 (원본 값 사용)
        Map<String, Object> buttonTypes = new HashMap<>();
        Map<String, Object> buttonNames = new HashMap<>();
        Map<String, Object> buttonPcUrls = new HashMap<>();
        Map<String, Object> buttonMobileUrls = new HashMap<>();
        
        for (int i = 1; i <= buttonCount; i++) {
            buttonTypes.put("button" + i + "_type", params.getOrDefault("button" + i + "_type", ""));
            buttonNames.put("button" + i + "_name", params.getOrDefault("button" + i + "_name", ""));
            buttonPcUrls.put("button" + i + "_pc", params.getOrDefault("button" + i + "_pc", ""));
            buttonMobileUrls.put("button" + i + "_mobile", params.getOrDefault("button" + i + "_mobile", ""));
        }
        
        extraParams.put("buttonTypes", buttonTypes);
        extraParams.put("buttonNames", buttonNames);
        extraParams.put("buttonPcUrls", buttonPcUrls);
        extraParams.put("buttonMobileUrls", buttonMobileUrls);
        
        alimbotPayload.put("extra_parameters", extraParams);
        
        return alimbotPayload;
    }
    
    /**
     * 메시지 ID 생성 (18자리 hex)
     */
    private String generateMsgId() {
        String hex = Long.toHexString(System.currentTimeMillis()) + 
                    Long.toHexString((long)(Math.random() * Long.MAX_VALUE));
        return hex.substring(0, Math.min(18, hex.length()));
    }
    
    /**
     * 실행 로그 저장
     */
    public void saveExecutionLog(Long workflowId, Long eventId, String webhookResponse, String status, String errorMessage) {
        WorkflowExecution execution = new WorkflowExecution();
        execution.setWorkflowId(workflowId);
        execution.setEventId(eventId);
        execution.setWebhookResponse(webhookResponse);
        execution.setStatus(status);
        workflowExecutionRepository.save(execution);
    }
    
    /**
     * 웹훅 테스트 실행
     */
    public Map<String, Object> executeWebhookTest(String webhookUrl, Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(webhookUrl, params, Map.class);
        return response != null ? response : new HashMap<>();
    }
    
    /**
     * 목표 조건 평가
     */
    public boolean evaluateGoalConditions(Workflow workflow, String leadEmail, Map<String, Object> eventData) {
        try {
            // 목표 조건 그룹이 없으면 목표 조건 없음
            if (workflow.getGoalGroups() == null || workflow.getGoalGroups().isEmpty()) {
                return false;
            }
            
            // 목표 조건 그룹 파싱
            List<Map<String, Object>> goalGroups = parseJson(workflow.getGoalGroups(), 
                new TypeReference<List<Map<String, Object>>>() {});
            
            if (goalGroups == null || goalGroups.isEmpty()) {
                return false;
            }
            
            String goalGroupLogic = workflow.getGoalGroupLogic() != null ? 
                workflow.getGoalGroupLogic() : "AND";
            
            // 목표 조건 평가 (조건 평가와 동일한 로직 사용)
            return evaluateConditions(goalGroups, goalGroupLogic, leadEmail, eventData);
        } catch (Exception e) {
            System.err.println("목표 조건 평가 오류: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 목표 진행률 업데이트
     */
    public void updateGoalProgress(Workflow workflow) {
        try {
            if (workflow.getGoalTarget() == null || workflow.getGoalTarget() <= 0) {
                return; // 목표가 설정되지 않음
            }
            
            Integer current = workflow.getGoalCurrent() != null ? workflow.getGoalCurrent() : 0;
            workflow.setGoalCurrent(current + 1);
            
            // 목표 달성 확인
            if (workflow.getGoalCurrent() >= workflow.getGoalTarget()) {
                System.out.println("워크플로우 \"" + workflow.getName() + "\" 목표 달성!");
                // 필요시 워크플로우 중지 또는 다른 처리
            }
            
            workflowRepository.save(workflow);
        } catch (Exception e) {
            System.err.println("목표 진행률 업데이트 오류: " + e.getMessage());
        }
    }
    
    /**
     * 디버그 로그 저장 헬퍼 함수
     */
    private void saveDebugLog(String component, String direction, String action, String url,
                             Map<String, Object> requestData, Map<String, Object> responseData,
                             String status, String errorMessage) {
        try {
            DebugLog debugLog = new DebugLog();
            debugLog.setComponent(component);
            debugLog.setDirection(direction);
            debugLog.setAction(action);
            debugLog.setUrl(url);
            
            if (requestData != null) {
                debugLog.setRequestData(objectMapper.writeValueAsString(requestData));
            }
            if (responseData != null) {
                debugLog.setResponseData(objectMapper.writeValueAsString(responseData));
            }
            
            debugLog.setStatus(status);
            debugLog.setErrorMessage(errorMessage);
            
            debugLogRepository.save(debugLog);
        } catch (Exception e) {
            System.err.println("디버그 로그 저장 오류: " + e.getMessage());
        }
    }
    
    /**
     * JSON 파싱 헬퍼
     */
    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        try {
            if (json == null || json.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JSON", e);
        }
    }
    
    /**
     * 정규화된 워크플로우 데이터 클래스
     */
    public static class NormalizedWorkflow {
        private List<Map<String, Object>> conditionGroups;
        private String groupLogic;
        private List<Map<String, Object>> actions;
        private String actionLogic;
        
        public NormalizedWorkflow(List<Map<String, Object>> conditionGroups, String groupLogic,
                                 List<Map<String, Object>> actions, String actionLogic) {
            this.conditionGroups = conditionGroups;
            this.groupLogic = groupLogic;
            this.actions = actions;
            this.actionLogic = actionLogic;
        }
        
        public List<Map<String, Object>> getConditionGroups() { return conditionGroups; }
        public String getGroupLogic() { return groupLogic; }
        public List<Map<String, Object>> getActions() { return actions; }
        public String getActionLogic() { return actionLogic; }
    }
}

