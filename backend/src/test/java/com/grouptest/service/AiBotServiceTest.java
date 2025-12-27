package com.grouptest.service;

import com.grouptest.entity.AiBotSetting;
import com.grouptest.entity.AiBotTemplate;
import com.grouptest.repository.AiBotSettingRepository;
import com.grouptest.repository.AiBotTemplateRepository;
import com.grouptest.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * AiBotService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
class AiBotServiceTest {
    
    @Mock
    private AiBotSettingRepository aiBotSettingRepository;
    
    @Mock
    private AiBotTemplateRepository aiBotTemplateRepository;
    
    @Mock
    private WorkflowRepository workflowRepository;
    
    @InjectMocks
    private AiBotService aiBotService;
    
    private String testIndustry = "shopping";
    
    @BeforeEach
    void setUp() {
        // 테스트 전 초기화
    }
    
    @Test
    void testGetSettings_WhenExists_ReturnsSettings() {
        // Given
        AiBotSetting setting = new AiBotSetting();
        setting.setIndustry(testIndustry);
        setting.setIntegrationConfig("{\"smartstore\":{\"enabled\":true}}");
        
        when(aiBotSettingRepository.findByIndustry(testIndustry))
            .thenReturn(Optional.of(setting));
        
        // When
        Optional<AiBotSetting> result = aiBotService.getSettings(testIndustry);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(testIndustry, result.get().getIndustry());
        verify(aiBotSettingRepository).findByIndustry(testIndustry);
    }
    
    @Test
    void testGetSettings_WhenNotExists_ReturnsEmpty() {
        // Given
        when(aiBotSettingRepository.findByIndustry(testIndustry))
            .thenReturn(Optional.empty());
        
        // When
        Optional<AiBotSetting> result = aiBotService.getSettings(testIndustry);
        
        // Then
        assertFalse(result.isPresent());
        verify(aiBotSettingRepository).findByIndustry(testIndustry);
    }
    
    @Test
    void testSaveSettings_SavesAndReturns() {
        // Given
        AiBotSetting setting = new AiBotSetting();
        setting.setIndustry(testIndustry);
        
        when(aiBotSettingRepository.save(any(AiBotSetting.class)))
            .thenReturn(setting);
        
        // When
        AiBotSetting result = aiBotService.saveSettings(setting);
        
        // Then
        assertNotNull(result);
        assertEquals(testIndustry, result.getIndustry());
        verify(aiBotSettingRepository).save(setting);
    }
    
    @Test
    void testSaveIntegration_WhenExists_UpdatesIntegrationConfig() {
        // Given
        AiBotSetting existing = new AiBotSetting();
        existing.setId(1L);
        existing.setIndustry(testIndustry);
        existing.setPaymentConfig("{\"balance\":1000}");
        existing.setIntegrationConfig("{\"old\":\"config\"}");
        
        when(aiBotSettingRepository.findByIndustry(testIndustry))
            .thenReturn(Optional.of(existing));
        when(aiBotSettingRepository.save(any(AiBotSetting.class)))
            .thenReturn(existing);
        
        String newIntegrationConfig = "{\"smartstore\":{\"enabled\":true}}";
        
        // When
        AiBotSetting result = aiBotService.saveIntegration(testIndustry, newIntegrationConfig);
        
        // Then
        assertNotNull(result);
        assertEquals(newIntegrationConfig, result.getIntegrationConfig());
        assertEquals("{\"balance\":1000}", result.getPaymentConfig()); // payment_config는 유지
        verify(aiBotSettingRepository).findByIndustry(testIndustry);
        verify(aiBotSettingRepository).save(any(AiBotSetting.class));
    }
    
    @Test
    void testSaveIntegration_WhenNotExists_CreatesNew() {
        // Given
        when(aiBotSettingRepository.findByIndustry(testIndustry))
            .thenReturn(Optional.empty());
        
        AiBotSetting newSetting = new AiBotSetting();
        newSetting.setIndustry(testIndustry);
        newSetting.setIntegrationConfig("{\"smartstore\":{\"enabled\":true}}");
        
        when(aiBotSettingRepository.save(any(AiBotSetting.class)))
            .thenReturn(newSetting);
        
        String integrationConfig = "{\"smartstore\":{\"enabled\":true}}";
        
        // When
        AiBotSetting result = aiBotService.saveIntegration(testIndustry, integrationConfig);
        
        // Then
        assertNotNull(result);
        assertEquals(testIndustry, result.getIndustry());
        assertEquals(integrationConfig, result.getIntegrationConfig());
        verify(aiBotSettingRepository).findByIndustry(testIndustry);
        verify(aiBotSettingRepository).save(any(AiBotSetting.class));
    }
    
    @Test
    void testSaveTemplatesByIds_UpdatesSelection() {
        // Given
        List<Integer> templateIds = Arrays.asList(1, 2, 3);
        
        List<AiBotTemplate> existingTemplates = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            AiBotTemplate template = new AiBotTemplate();
            template.setId((long) i);
            template.setIndustry(testIndustry);
            template.setTemplateId(i);
            template.setIsSelected(false);
            existingTemplates.add(template);
        }
        
        when(aiBotTemplateRepository.findByIndustry(testIndustry))
            .thenReturn(existingTemplates);
        when(aiBotTemplateRepository.saveAll(anyList()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        List<AiBotTemplate> result = aiBotService.saveTemplatesByIds(testIndustry, templateIds);
        
        // Then
        assertNotNull(result);
        assertEquals(3, result.size());
        
        // 선택된 템플릿 확인
        for (AiBotTemplate template : result) {
            assertTrue(template.getIsSelected());
            assertTrue(templateIds.contains(template.getTemplateId()));
        }
        
        // 기존 템플릿 선택 해제 확인
        verify(aiBotTemplateRepository).saveAll(anyList());
    }
    
    @Test
    void testSyncWorkflows_WhenNoSelectedTemplates_ThrowsException() {
        // Given
        when(aiBotTemplateRepository.findByIndustryAndIsSelectedTrue(testIndustry))
            .thenReturn(Collections.emptyList());
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            aiBotService.syncWorkflows(testIndustry);
        });
    }
    
    @Test
    void testSyncWorkflows_WhenNoIntegrationConfig_ThrowsException() {
        // Given
        AiBotTemplate template = new AiBotTemplate();
        template.setTemplateId(1);
        template.setTemplateName("주문접수");
        template.setIsSelected(true);
        
        when(aiBotTemplateRepository.findByIndustryAndIsSelectedTrue(testIndustry))
            .thenReturn(Arrays.asList(template));
        when(aiBotSettingRepository.findByIndustry(testIndustry))
            .thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            aiBotService.syncWorkflows(testIndustry);
        });
    }
}

