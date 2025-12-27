package com.grouptest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workflows")
public class Workflow {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "event_name", nullable = false)
    private String eventName;
    
    @Column(columnDefinition = "TEXT")
    private String filter;
    
    private Integer frequency = 1;
    
    @Column(name = "frequency_period")
    private String frequencyPeriod;
    
    @Column(name = "webhook_url", nullable = false, columnDefinition = "TEXT")
    private String webhookUrl;
    
    @Column(name = "webhook_params", columnDefinition = "TEXT")
    private String webhookParams;
    
    @Column(name = "is_launched")
    private Boolean isLaunched = false;
    
    @Column(columnDefinition = "TEXT")
    private String conditions;
    
    @Column(columnDefinition = "TEXT")
    private String actions;
    
    @Column(name = "condition_logic")
    private String conditionLogic = "AND";
    
    @Column(name = "action_logic")
    private String actionLogic = "AND";
    
    @Column(name = "condition_groups", columnDefinition = "TEXT")
    private String conditionGroups;
    
    @Column(name = "group_logic")
    private String groupLogic = "AND";
    
    @Column(name = "condition_settings", columnDefinition = "TEXT")
    private String conditionSettings;
    
    @Column(name = "goal_groups", columnDefinition = "TEXT")
    private String goalGroups;
    
    @Column(name = "goal_group_logic")
    private String goalGroupLogic = "AND";
    
    @Column(name = "folder_id")
    private Long folderId;
    
    @Column(name = "goal_type")
    private String goalType;
    
    @Column(name = "goal_target")
    private Integer goalTarget;
    
    @Column(name = "goal_current")
    private Integer goalCurrent = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    
    public String getFilter() { return filter; }
    public void setFilter(String filter) { this.filter = filter; }
    
    public Integer getFrequency() { return frequency; }
    public void setFrequency(Integer frequency) { this.frequency = frequency; }
    
    public String getFrequencyPeriod() { return frequencyPeriod; }
    public void setFrequencyPeriod(String frequencyPeriod) { this.frequencyPeriod = frequencyPeriod; }
    
    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }
    
    public String getWebhookParams() { return webhookParams; }
    public void setWebhookParams(String webhookParams) { this.webhookParams = webhookParams; }
    
    public Boolean getIsLaunched() { return isLaunched; }
    public void setIsLaunched(Boolean isLaunched) { this.isLaunched = isLaunched; }
    
    public String getConditions() { return conditions; }
    public void setConditions(String conditions) { this.conditions = conditions; }
    
    public String getActions() { return actions; }
    public void setActions(String actions) { this.actions = actions; }
    
    public String getConditionLogic() { return conditionLogic; }
    public void setConditionLogic(String conditionLogic) { this.conditionLogic = conditionLogic; }
    
    public String getActionLogic() { return actionLogic; }
    public void setActionLogic(String actionLogic) { this.actionLogic = actionLogic; }
    
    public String getConditionGroups() { return conditionGroups; }
    public void setConditionGroups(String conditionGroups) { this.conditionGroups = conditionGroups; }
    
    public String getGroupLogic() { return groupLogic; }
    public void setGroupLogic(String groupLogic) { this.groupLogic = groupLogic; }
    
    public String getConditionSettings() { return conditionSettings; }
    public void setConditionSettings(String conditionSettings) { this.conditionSettings = conditionSettings; }
    
    public String getGoalGroups() { return goalGroups; }
    public void setGoalGroups(String goalGroups) { this.goalGroups = goalGroups; }
    
    public String getGoalGroupLogic() { return goalGroupLogic; }
    public void setGoalGroupLogic(String goalGroupLogic) { this.goalGroupLogic = goalGroupLogic; }
    
    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }
    
    public String getGoalType() { return goalType; }
    public void setGoalType(String goalType) { this.goalType = goalType; }
    
    public Integer getGoalTarget() { return goalTarget; }
    public void setGoalTarget(Integer goalTarget) { this.goalTarget = goalTarget; }
    
    public Integer getGoalCurrent() { return goalCurrent; }
    public void setGoalCurrent(Integer goalCurrent) { this.goalCurrent = goalCurrent; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

