package com.grouptest.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "list_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"list_id", "lead_email"})
})
public class ListMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "list_id", nullable = false)
    private Long listId;
    
    @Column(name = "lead_email", nullable = false)
    @JsonProperty("lead_email")
    private String leadEmail;
    
    @Column(name = "lead_data", columnDefinition = "TEXT")
    @JsonProperty("lead_data")
    private String leadData;
    
    @Column(name = "first_name")
    @JsonProperty("first_name")
    private String firstName;
    
    @Column(name = "phone_number")
    @JsonProperty("phone_number")
    private String phoneNumber;
    
    @Column(name = "added_at")
    @JsonProperty("added_at")
    private LocalDateTime addedAt;
    
    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getListId() { return listId; }
    public void setListId(Long listId) { this.listId = listId; }
    
    public String getLeadEmail() { return leadEmail; }
    public void setLeadEmail(String leadEmail) { this.leadEmail = leadEmail; }
    
    public String getLeadData() { return leadData; }
    public void setLeadData(String leadData) { this.leadData = leadData; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
}

