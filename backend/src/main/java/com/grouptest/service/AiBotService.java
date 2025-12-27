package com.grouptest.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grouptest.entity.AiBotSetting;
import com.grouptest.entity.AiBotTemplate;
import com.grouptest.entity.Workflow;
import com.grouptest.repository.AiBotSettingRepository;
import com.grouptest.repository.AiBotTemplateRepository;
import com.grouptest.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AiBotService {
    
    @Autowired
    private AiBotSettingRepository aiBotSettingRepository;
    
    @Autowired
    private AiBotTemplateRepository aiBotTemplateRepository;
    
    @Autowired
    private WorkflowRepository workflowRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 템플릿 ID와 이벤트/템플릿 코드 매핑
    private static final Map<Integer, TemplateConfig> TEMPLATE_CONFIGS = Map.of(
        1, new TemplateConfig("주문접수", "order_received"),
        2, new TemplateConfig("결제완료", "payment_completed"),
        3, new TemplateConfig("상품준비중", "preparing_product"),
        4, new TemplateConfig("배송시작", "shipping_started"),
        5, new TemplateConfig("배송완료", "shipping_completed"),
        6, new TemplateConfig("구매확정", "purchase_confirmed"),
        7, new TemplateConfig("리뷰요청", "review_request"),
        8, new TemplateConfig("재고부족", "out_of_stock"),
        9, new TemplateConfig("주문취소", "order_cancelled"),
        10, new TemplateConfig("환불완료", "refund_completed")
    );
    
    // 템플릿 ID와 이름 매핑
    private static final Map<Integer, String> TEMPLATE_NAMES = Map.of(
        1, "주문접수",
        2, "결제완료",
        3, "상품준비중",
        4, "배송시작",
        5, "배송완료",
        6, "구매확정",
        7, "리뷰요청",
        8, "재고부족",
        9, "주문취소",
        10, "환불완료"
    );
    
    public Optional<AiBotSetting> getSettings(String industry) {
        return aiBotSettingRepository.findByIndustry(industry);
    }
    
    public AiBotSetting saveSettings(AiBotSetting settings) {
        return aiBotSettingRepository.save(settings);
    }
    
    /**
     * 연동 설정만 저장 (payment_config는 유지)
     */
    @Transactional
    public AiBotSetting saveIntegration(String industry, String integrationConfig) {
        Optional<AiBotSetting> existing = aiBotSettingRepository.findByIndustry(industry);
        
        if (existing.isPresent()) {
            AiBotSetting settings = existing.get();
            settings.setIntegrationConfig(integrationConfig);
            return aiBotSettingRepository.save(settings);
        } else {
            AiBotSetting newSettings = new AiBotSetting();
            newSettings.setIndustry(industry);
            newSettings.setIntegrationConfig(integrationConfig);
            return aiBotSettingRepository.save(newSettings);
        }
    }
    
    public List<AiBotTemplate> getTemplates(String industry) {
        return aiBotTemplateRepository.findByIndustry(industry);
    }
    
    public List<AiBotTemplate> getSelectedTemplates(String industry) {
        return aiBotTemplateRepository.findByIndustryAndIsSelectedTrue(industry);
    }
    
    public AiBotTemplate saveTemplate(AiBotTemplate template) {
        return aiBotTemplateRepository.save(template);
    }
    
    public List<AiBotTemplate> saveTemplates(List<AiBotTemplate> templates) {
        return aiBotTemplateRepository.saveAll(templates);
    }
    
    /**
     * 템플릿 ID 배열로 템플릿 저장 (원본과 호환)
     */
    @Transactional
    public List<AiBotTemplate> saveTemplatesByIds(String industry, List<Integer> templateIds) {
        // 기존 선택 해제
        List<AiBotTemplate> existingTemplates = aiBotTemplateRepository.findByIndustry(industry);
        for (AiBotTemplate template : existingTemplates) {
            template.setIsSelected(false);
        }
        aiBotTemplateRepository.saveAll(existingTemplates);
        
        // 새 템플릿 선택
        List<AiBotTemplate> templatesToSave = new ArrayList<>();
        for (Integer templateId : templateIds) {
            AiBotTemplate template = existingTemplates.stream()
                .filter(t -> t.getTemplateId().equals(templateId))
                .findFirst()
                .orElse(new AiBotTemplate());
            
            template.setIndustry(industry);
            template.setTemplateId(templateId);
            template.setTemplateName(TEMPLATE_NAMES.getOrDefault(templateId, "템플릿" + templateId));
            template.setIsSelected(true);
            templatesToSave.add(template);
        }
        
        return aiBotTemplateRepository.saveAll(templatesToSave);
    }
    
    /**
     * 선택된 템플릿에 맞는 워크플로우 자동 생성/업데이트
     */
    @Transactional
    public SyncWorkflowResult syncWorkflows(String industry) {
        // 선택된 템플릿 조회
        List<AiBotTemplate> selectedTemplates = aiBotTemplateRepository.findByIndustryAndIsSelectedTrue(industry);
        
        if (selectedTemplates.isEmpty()) {
            throw new IllegalArgumentException("선택된 템플릿이 없습니다.");
        }
        
        // 연동 설정 조회
        Optional<AiBotSetting> settingsOpt = aiBotSettingRepository.findByIndustry(industry);
        if (settingsOpt.isEmpty() || settingsOpt.get().getIntegrationConfig() == null) {
            throw new IllegalArgumentException("연동 설정이 없습니다.");
        }
        
        AiBotSetting settings = settingsOpt.get();
        Map<String, Object> integration;
        try {
            integration = objectMapper.readValue(settings.getIntegrationConfig(), 
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("연동 설정 파싱 오류: " + e.getMessage(), e);
        }
        
        String webhookUrl = "https://tools.alimbot.com/api/v1/msg/process";
        List<WorkflowSyncInfo> syncResults = new ArrayList<>();
        
        for (AiBotTemplate template : selectedTemplates) {
            TemplateConfig config = TEMPLATE_CONFIGS.get(template.getTemplateId());
            if (config == null) continue;
            
            String workflowName = "[AI알림봇] " + template.getTemplateName();
            
            // 기존 워크플로우 확인
            Optional<Workflow> existingOpt = workflowRepository.findAll().stream()
                .filter(w -> workflowName.equals(w.getName()))
                .findFirst();
            
            // 웹훅 파라미터 생성
            Map<String, Object> webhookParams = new HashMap<>();
            webhookParams.put("bizmId", integration.getOrDefault("bizmId", ""));
            webhookParams.put("key", integration.getOrDefault("key", ""));
            webhookParams.put("type", "03");
            webhookParams.put("profile", integration.getOrDefault("profile", ""));
            webhookParams.put("tempCode", config.templateCode);
            webhookParams.put("message", template.getTemplateName() + " 알림입니다.");
            webhookParams.put("email", "{{email}}");
            webhookParams.put("first_name", "{{customerName}}");
            webhookParams.put("phone_number", "{{customerPhone}}");
            webhookParams.put("paramCount", 0);
            webhookParams.put("buttonCount", 0);
            
            String webhookParamsJson;
            try {
                webhookParamsJson = objectMapper.writeValueAsString(webhookParams);
            } catch (Exception e) {
                throw new RuntimeException("웹훅 파라미터 생성 오류: " + e.getMessage(), e);
            }
            
            // 조건 그룹 생성 (이벤트 조건)
            Map<String, Object> condition = new HashMap<>();
            condition.put("type", "custom_event");
            condition.put("event_name", config.event);
            condition.put("filter", "존재하는");
            condition.put("frequency", 1);
            condition.put("frequency_period", "기간과 상관없이");
            
            Map<String, Object> conditionGroup = new HashMap<>();
            conditionGroup.put("id", System.currentTimeMillis());
            conditionGroup.put("logic", "AND");
            conditionGroup.put("conditions", Arrays.asList(condition));
            
            List<Map<String, Object>> conditionGroups = Arrays.asList(conditionGroup);
            String conditionGroupsJson;
            try {
                conditionGroupsJson = objectMapper.writeValueAsString(conditionGroups);
            } catch (Exception e) {
                throw new RuntimeException("조건 그룹 생성 오류: " + e.getMessage(), e);
            }
            
            // 액션 생성
            Map<String, Object> action = new HashMap<>();
            action.put("step", 1);
            action.put("type", "webhook");
            action.put("webhook_url", webhookUrl);
            action.put("webhook_params", webhookParamsJson);
            
            List<Map<String, Object>> actions = Arrays.asList(action);
            String actionsJson;
            try {
                actionsJson = objectMapper.writeValueAsString(actions);
            } catch (Exception e) {
                throw new RuntimeException("액션 생성 오류: " + e.getMessage(), e);
            }
            
            if (existingOpt.isPresent()) {
                // 기존 워크플로우 업데이트
                Workflow workflow = existingOpt.get();
                workflow.setEventName(config.event);
                workflow.setWebhookUrl(webhookUrl);
                workflow.setWebhookParams(webhookParamsJson);
                workflow.setConditionGroups(conditionGroupsJson);
                workflow.setGroupLogic("AND");
                workflow.setActions(actionsJson);
                workflow.setActionLogic("AND");
                workflow.setFilter("존재하는");
                workflow.setFrequency(1);
                workflow.setFrequencyPeriod("기간과 상관없이");
                
                workflowRepository.save(workflow);
                syncResults.add(new WorkflowSyncInfo(workflow.getId(), workflowName, "updated"));
            } else {
                // 새 워크플로우 생성
                Workflow workflow = new Workflow();
                workflow.setName(workflowName);
                workflow.setEventName(config.event);
                workflow.setWebhookUrl(webhookUrl);
                workflow.setWebhookParams(webhookParamsJson);
                workflow.setConditionGroups(conditionGroupsJson);
                workflow.setGroupLogic("AND");
                workflow.setActions(actionsJson);
                workflow.setActionLogic("AND");
                workflow.setFilter("존재하는");
                workflow.setFrequency(1);
                workflow.setFrequencyPeriod("기간과 상관없이");
                workflow.setIsLaunched(false);
                
                Workflow saved = workflowRepository.save(workflow);
                syncResults.add(new WorkflowSyncInfo(saved.getId(), workflowName, "created"));
            }
        }
        
        return new SyncWorkflowResult(syncResults.size(), syncResults);
    }
    
    // 내부 클래스
    private static class TemplateConfig {
        final String event;
        final String templateCode;
        
        TemplateConfig(String event, String templateCode) {
            this.event = event;
            this.templateCode = templateCode;
        }
    }
    
    public static class WorkflowSyncInfo {
        private Long id;
        private String name;
        private String action; // "created" or "updated"
        
        public WorkflowSyncInfo(Long id, String name, String action) {
            this.id = id;
            this.name = name;
            this.action = action;
        }
        
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getAction() { return action; }
    }
    
    public static class SyncWorkflowResult {
        private int count;
        private List<WorkflowSyncInfo> workflows;
        
        public SyncWorkflowResult(int count, List<WorkflowSyncInfo> workflows) {
            this.count = count;
            this.workflows = workflows;
        }
        
        public int getCount() { return count; }
        public List<WorkflowSyncInfo> getWorkflows() { return workflows; }
    }
}

