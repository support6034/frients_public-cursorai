import React, { useState, useEffect } from 'react';
import api from '../api';
import PaymentSettings from './PaymentSettings';
import DebugLogViewer from './DebugLogViewer';
import './AIBot.css';

function AIBot() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedIndustry, setSelectedIndustry] = useState('shopping');
  
  // 비즈엠 주문톡 10개 템플릿 (쇼핑몰용)
  const shoppingTemplates = [
    { id: 1, name: '주문접수', description: '주문이 접수되었습니다', default: true },
    { id: 2, name: '결제완료', description: '결제가 완료되었습니다', default: true },
    { id: 3, name: '상품준비중', description: '상품을 준비하고 있습니다', default: true },
    { id: 4, name: '배송시작', description: '배송이 시작되었습니다', default: true },
    { id: 5, name: '배송완료', description: '배송이 완료되었습니다', default: true },
    { id: 6, name: '구매확정', description: '구매가 확정되었습니다', default: false },
    { id: 7, name: '리뷰요청', description: '리뷰를 작성해주세요', default: false },
    { id: 8, name: '재고부족', description: '재고가 부족합니다', default: false },
    { id: 9, name: '주문취소', description: '주문이 취소되었습니다', default: false },
    { id: 10, name: '환불완료', description: '환불이 완료되었습니다', default: false }
  ];
  
  // 기본 템플릿 ID 목록 (주문접수, 결제완료, 상품준비중, 배송시작, 배송완료)
  const defaultTemplateIds = shoppingTemplates.filter(t => t.default).map(t => t.id);
  const [selectedTemplates, setSelectedTemplates] = useState(defaultTemplateIds);
  
  const [settings, setSettings] = useState({
    payment: {},
    integration: {
      smartstore: {
        enabled: false,
        apiKey: '',
        apiSecret: '',
        storeId: ''
      }
    }
  });

  useEffect(() => {
    loadSettings();
    loadSelectedTemplates();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/ai-bot/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    }
  };

  const loadSelectedTemplates = async () => {
    try {
      const response = await api.get('/api/ai-bot/templates');
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setSelectedTemplates(response.data.data);
      } else {
        // 저장된 템플릿이 없으면 기본 템플릿 선택
        const defaults = shoppingTemplates.filter(t => t.default).map(t => t.id);
        setSelectedTemplates(defaults);
        // 서버에 기본 템플릿 저장
        try {
          await api.post('/api/ai-bot/templates', { templateIds: defaults });
        } catch (err) {
          console.error('기본 템플릿 저장 오류:', err);
        }
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      // 오류 발생 시 기본 템플릿 선택
      const defaults = shoppingTemplates.filter(t => t.default).map(t => t.id);
      setSelectedTemplates(defaults);
    }
  };

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  const handleSaveSettings = async () => {
    try {
      await api.post('/api/ai-bot/settings', settings);
      await api.post('/api/ai-bot/templates', { templateIds: selectedTemplates });
      
      // 워크플로우 동기화
      try {
        const syncResponse = await api.post('/api/ai-bot/sync-workflows');
        if (syncResponse.data.success) {
          alert(`설정이 저장되었습니다.\n${syncResponse.data.message}`);
        }
      } catch (syncError) {
        console.error('워크플로우 동기화 오류:', syncError);
        alert('설정은 저장되었지만 워크플로우 동기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const handleSaveIntegration = async () => {
    try {
      await api.post('/api/ai-bot/integration', settings.integration);
      alert('연동 설정이 저장되었습니다.');
    } catch (error) {
      console.error('연동 설정 저장 오류:', error);
      alert('연동 설정 저장에 실패했습니다.');
    }
  };

  const renderDashboard = () => {
    const industries = [
      { id: 'shopping', name: '쇼핑몰', icon: '🛒' },
      { id: 'reservation', name: '예약', icon: '📅', disabled: true },
      { id: 'franchise', name: '프랜차이즈', icon: '🏢', disabled: true },
      { id: 'store', name: '매장', icon: '🏪', disabled: true }
    ];

    return (
      <div className="ai-bot-dashboard">
        <div className="dashboard-header">
          <h1>AI 알림봇</h1>
          <p>쇼핑몰 주문 알림톡 자동 발송 서비스</p>
        </div>

        <div className="industry-selector">
          {industries.map(industry => (
            <div
              key={industry.id}
              className={`industry-card ${selectedIndustry === industry.id ? 'active' : ''} ${industry.disabled ? 'disabled' : ''}`}
              onClick={() => !industry.disabled && setSelectedIndustry(industry.id)}
            >
              <div className="industry-icon">{industry.icon}</div>
              <div className="industry-name">{industry.name}</div>
              {industry.disabled && <div className="coming-soon">준비중</div>}
            </div>
          ))}
        </div>

        {selectedIndustry === 'shopping' && (
          <div className="templates-section">
            <h2>주문톡 템플릿</h2>
            <p className="section-description">쇼핑몰 주문 알림톡 템플릿을 선택하세요</p>
            <div className="templates-grid">
              {shoppingTemplates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplates.includes(template.id) ? 'selected' : ''}`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div className="template-checkbox">
                    {selectedTemplates.includes(template.id) ? '✓' : ''}
                  </div>
                  <div className="template-name">{template.name}</div>
                  <div className="template-description">{template.description}</div>
                  {template.default && <div className="template-badge">기본</div>}
                </div>
              ))}
            </div>
            <div className="templates-actions">
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                선택한 템플릿 저장
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="ai-bot-settings">
        <h1>설정</h1>
        
        <div className="settings-section">
          <h2>1. 결제</h2>
          <p className="section-description">프렌츠 결제 설정 - 알림톡 발송을 위한 충전 서비스</p>
          <PaymentSettings />
        </div>

        <div className="settings-section">
          <h2>2. 연동</h2>
          <p className="section-description">스마트스토어와 연동하여 본 프로젝트와 연결합니다</p>
          <div className="settings-card">
            <div className="form-group">
              <label>스마트스토어 연동 활성화</label>
              <input
                type="checkbox"
                checked={settings.integration.smartstore.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  integration: {
                    ...settings.integration,
                    smartstore: {
                      ...settings.integration.smartstore,
                      enabled: e.target.checked
                    }
                  }
                })}
              />
            </div>
            {settings.integration.smartstore.enabled && (
              <>
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.integration.smartstore.apiKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      integration: {
                        ...settings.integration,
                        smartstore: {
                          ...settings.integration.smartstore,
                          apiKey: e.target.value
                        }
                      }
                    })}
                    placeholder="스마트스토어 API Key 입력"
                  />
                </div>
                <div className="form-group">
                  <label>API Secret</label>
                  <input
                    type="password"
                    className="form-control"
                    value={settings.integration.smartstore.apiSecret}
                    onChange={(e) => setSettings({
                      ...settings,
                      integration: {
                        ...settings.integration,
                        smartstore: {
                          ...settings.integration.smartstore,
                          apiSecret: e.target.value
                        }
                      }
                    })}
                    placeholder="스마트스토어 API Secret 입력"
                  />
                </div>
                <div className="form-group">
                  <label>스토어 ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.integration.smartstore.storeId}
                    onChange={(e) => setSettings({
                      ...settings,
                      integration: {
                        ...settings.integration,
                        smartstore: {
                          ...settings.integration.smartstore,
                          storeId: e.target.value
                        }
                      }
                    })}
                    placeholder="스마트스토어 ID 입력"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleSaveIntegration}>
                  연동 설정 저장
                </button>
              </>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>3. 템플릿 선택</h2>
          <p className="section-description">발송할 템플릿을 선택하세요</p>
          <div className="settings-card">
            <div className="templates-list">
              {shoppingTemplates.map(template => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplates.includes(template.id) ? 'selected' : ''}`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template.id)}
                    onChange={() => handleTemplateToggle(template.id)}
                  />
                  <div className="template-info">
                    <div className="template-name">{template.name}</div>
                    <div className="template-description">{template.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleSaveSettings}>
              템플릿 선택 저장
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-bot">
      <header className="ai-bot-header">
        <h1>AI 알림봇</h1>
        <p>쇼핑몰 주문 알림톡 자동 발송</p>
      </header>

      <nav className="ai-bot-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          대시보드
        </button>
        <button
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          설정
        </button>
      </nav>

      <div className="ai-bot-content">
        {activeTab === 'dashboard' && (
          <>
            {renderDashboard()}
            <DebugLogViewer />
          </>
        )}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}

export default AIBot;

