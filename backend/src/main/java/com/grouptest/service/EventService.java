package com.grouptest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.DebugLog;
import com.grouptest.entity.EventLog;
import com.grouptest.entity.Workflow;
import com.grouptest.entity.WorkflowExecution;
import com.grouptest.repository.DebugLogRepository;
import com.grouptest.repository.EventLogRepository;
import com.grouptest.repository.WorkflowExecutionRepository;
import com.grouptest.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EventService {
    
    @Autowired
    private EventLogRepository eventLogRepository;
    
    @Autowired
    private WorkflowRepository workflowRepository;
    
    @Autowired
    private WorkflowExecutionRepository workflowExecutionRepository;
    
    @Autowired
    private DebugLogRepository debugLogRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public EventLog saveEvent(String eventName, Map<String, Object> eventData) {
        try {
            // WF 디버그 로그 저장 (GTM 이벤트 수신)
            saveDebugLog(
                "WF",
                "IN",
                "GTM 이벤트 수신",
                "/api/events",
                eventData,
                null,
                "received",
                null
            );
            
            EventLog eventLog = new EventLog();
            eventLog.setEventName(eventName);
            eventLog.setEventData(objectMapper.writeValueAsString(eventData));
            return eventLogRepository.save(eventLog);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save event", e);
        }
    }
    
    public List<EventLog> getAllEvents() {
        return eventLogRepository.findAll();
    }
    
    public List<String> getDistinctEventNames() {
        return eventLogRepository.findDistinctEventNames();
    }
    
    @Autowired
    private WorkflowExecutionService workflowExecutionService;
    
    public void processEvent(EventLog eventLog) {
        // 런칭된 워크플로우 찾기
        List<Workflow> launchedWorkflows = workflowRepository.findByIsLaunchedTrue();
        
        // 이벤트 데이터 파싱
        Map<String, Object> eventData;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(eventLog.getEventData(), Map.class);
            eventData = parsed;
        } catch (Exception e) {
            eventData = new HashMap<>();
        }
        
        String leadEmail = (String) eventData.getOrDefault("email", eventData.getOrDefault("lead_email", ""));
        
        // 각 워크플로우에 대해 조건 확인 및 실행
        for (Workflow workflow : launchedWorkflows) {
            try {
                // 워크플로우 정규화
                WorkflowExecutionService.NormalizedWorkflow normalized = 
                    workflowExecutionService.normalizeWorkflow(workflow);
                
                // 조건 평가
                boolean conditionsMet = workflowExecutionService.evaluateConditions(
                    normalized.getConditionGroups(),
                    normalized.getGroupLogic(),
                    leadEmail,
                    eventData
                );
                
                if (conditionsMet) {
                    // 목표 조건 확인 (목표 조건 충족 시 액션 실행 중단)
                    boolean goalMet = workflowExecutionService.evaluateGoalConditions(
                        workflow,
                        leadEmail,
                        eventData
                    );
                    
                    if (goalMet) {
                        System.out.println("워크플로우 \"" + workflow.getName() + "\" 목표 조건 충족, 액션 실행 중단");
                        // 목표 진행률 업데이트
                        workflowExecutionService.updateGoalProgress(workflow);
                        continue; // 다음 워크플로우로
                    }
                    
                    System.out.println("워크플로우 \"" + workflow.getName() + "\" 조건 충족, 액션 실행");
                    
                    // 액션 실행
                    workflowExecutionService.executeActions(
                        normalized.getActions(),
                        normalized.getActionLogic(),
                        leadEmail,
                        eventData,
                        workflow,
                        eventLog.getId()
                    );
                }
            } catch (Exception e) {
                System.err.println("워크플로우 실행 오류: " + e.getMessage());
                e.printStackTrace();
                // 에러 로그 저장
                saveExecutionLog(workflow.getId(), eventLog.getId(), null, "failed", e.getMessage());
            }
        }
    }
    
    private void saveExecutionLog(Long workflowId, Long eventId, String webhookResponse, String status, String errorMessage) {
        WorkflowExecution execution = new WorkflowExecution();
        execution.setWorkflowId(workflowId);
        execution.setEventId(eventId);
        execution.setWebhookResponse(webhookResponse);
        execution.setStatus(status);
        workflowExecutionRepository.save(execution);
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
}

