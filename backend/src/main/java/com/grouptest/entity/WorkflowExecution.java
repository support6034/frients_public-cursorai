package com.grouptest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_executions")
public class WorkflowExecution {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "workflow_id")
    private Long workflowId;
    
    @Column(name = "event_id")
    private Long eventId;
    
    @Column(name = "webhook_response", columnDefinition = "TEXT")
    private String webhookResponse;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "executed_at")
    private LocalDateTime executedAt;
    
    @PrePersist
    protected void onCreate() {
        executedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getWorkflowId() { return workflowId; }
    public void setWorkflowId(Long workflowId) { this.workflowId = workflowId; }
    
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    
    public String getWebhookResponse() { return webhookResponse; }
    public void setWebhookResponse(String webhookResponse) { this.webhookResponse = webhookResponse; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getExecutedAt() { return executedAt; }
    public void setExecutedAt(LocalDateTime executedAt) { this.executedAt = executedAt; }
}

