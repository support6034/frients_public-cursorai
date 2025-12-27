package com.grouptest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_processed_leads", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"workflow_id", "lead_email"})
})
public class WorkflowProcessedLead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;
    
    @Column(name = "lead_email", nullable = false)
    private String leadEmail;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @PrePersist
    protected void onCreate() {
        processedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getWorkflowId() { return workflowId; }
    public void setWorkflowId(Long workflowId) { this.workflowId = workflowId; }
    
    public String getLeadEmail() { return leadEmail; }
    public void setLeadEmail(String leadEmail) { this.leadEmail = leadEmail; }
    
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}

