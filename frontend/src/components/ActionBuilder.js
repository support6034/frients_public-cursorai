import React, { useState, useEffect } from 'react';
import api from '../api';
import ListAction from './ListAction';
import WebhookAction from './WebhookAction';
import './ActionBuilder.css';

function ActionBuilder({ actions, onActionsChange }) {
  const [lists, setLists] = useState([]);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(null);
  // 웹훅 테스트 관련 상태
  const [showLeadSearch, setShowLeadSearch] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  // 이벤트 데이터 참조
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    loadLists();
    loadAvailableEvents();
  }, []);

  const loadLists = async () => {
    try {
      const response = await api.get('/api/lists');
      if (response.data.success) {
        setLists(response.data.data);
      }
    } catch (error) {
      console.error('리스트 로드 오류:', error);
    }
  };

  const loadAvailableEvents = async () => {
    try {
      const response = await api.get('/api/events');
      if (response.data.success) {
        setAvailableEvents(response.data.data);
      }
    } catch (error) {
      console.error('이벤트 목록 로드 오류:', error);
    }
  };

  const loadEventData = async (eventName) => {
    if (!eventName) {
      setEventData(null);
      return;
    }
    try {
      const response = await api.get('/api/event-logs');
      if (response.data.success) {
        const event = response.data.data.find(e => e.event_name === eventName);
        if (event) {
          setEventData(event.event_data);
        }
      }
    } catch (error) {
      console.error('이벤트 데이터 로드 오류:', error);
    }
  };

  const handleEventSelect = (eventName) => {
    setSelectedEvent(eventName);
    loadEventData(eventName);
  };

  // 리드 검색
  const searchLeads = async () => {
    if (!leadSearchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 모든 리스트에서 리드 검색
      const results = [];
      for (const list of lists) {
        const response = await api.get(`/api/lists/${list.id}/members`);
        if (response.data.success) {
          const matchingLeads = response.data.data.filter(lead =>
            lead.lead_email.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
            (lead.first_name && lead.first_name.toLowerCase().includes(leadSearchQuery.toLowerCase())) ||
            (lead.phone_number && lead.phone_number.includes(leadSearchQuery))
          );
          matchingLeads.forEach(lead => {
            if (!results.find(r => r.lead_email === lead.lead_email)) {
              results.push({ ...lead, list_name: list.name });
            }
          });
        }
      }
      setSearchResults(results);
    } catch (error) {
      console.error('리드 검색 오류:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLead = (lead) => {
    setSelectedLead(lead);
    setShowLeadSearch(false);
    setSearchResults([]);
    setLeadSearchQuery('');
  };

  // 웹훅 테스트 실행
  const handleWebhookTest = async () => {
    // 웹훅 액션 찾기
    const webhookAction = actions.find(a => a.type === 'webhook');
    if (!webhookAction || !webhookAction.webhook_url) {
      setTestResult({ success: false, error: 'Webhook URL이 설정되지 않았습니다.' });
      return;
    }

    if (!selectedLead) {
      setTestResult({ success: false, error: '테스트할 리드를 선택하세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // 리드 데이터로 웹훅 테스트
      const testData = {
        email: selectedLead.lead_email,
        first_name: selectedLead.first_name || '',
        phone_number: selectedLead.phone_number || '',
        ...(selectedLead.lead_data || {})
      };

      const response = await api.post('/api/webhook-test', {
        webhook_url: webhookAction.webhook_url,
        webhook_params: webhookAction.webhook_params || {},
        testData
      });

      setTestResult({
        success: true,
        message: '웹훅 테스트 성공!',
        response: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data?.details
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 웹훅 액션 존재 여부 확인
  const hasWebhookAction = actions.some(a => a.type === 'webhook' && a.webhook_url);

  const addAction = (type) => {
    const step = actions.length + 1;
    const newAction = type === 'list'
      ? { step, type: 'list', action: 'add', list_id: null }
      : { step, type: 'webhook', webhook_url: '', webhook_params: {}, _isNew: true };

    setNewlyAddedIndex(actions.length);
    onActionsChange([...actions, newAction]);
  };

  const updateAction = (index, updatedAction) => {
    const newActions = [...actions];
    newActions[index] = { ...updatedAction, step: index + 1 };
    onActionsChange(newActions);
  };

  const removeAction = (index) => {
    const newActions = actions
      .filter((_, i) => i !== index)
      .map((action, i) => ({ ...action, step: i + 1 }));
    onActionsChange(newActions);
  };

  const moveAction = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === actions.length - 1)
    ) {
      return;
    }

    const newActions = [...actions];
    const targetIndex = index + direction;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];

    // Reassign step numbers
    newActions.forEach((action, i) => {
      action.step = i + 1;
    });

    onActionsChange(newActions);
  };

  return (
    <div className="action-builder">
      <div className="builder-header">
        <span className="builder-number">2</span>
        <span className="builder-title">액션</span>
        <span className="builder-subtitle">순차 실행</span>
      </div>

      <div className="builder-content">
        {actions.length === 0 ? (
          <div className="empty-state">
            액션이 없습니다. 아래 버튼으로 액션을 추가하세요.
          </div>
        ) : (
          <div className="actions-list">
            {actions.map((action, index) => (
              <div key={index} className="action-step-wrapper">
                <div className="step-indicator">
                  <span className="step-number">Step {index + 1}</span>
                  <div className="step-controls">
                    <button
                      className="btn-move"
                      onClick={() => moveAction(index, -1)}
                      disabled={index === 0}
                      title="위로 이동"
                    >
                      ↑
                    </button>
                    <button
                      className="btn-move"
                      onClick={() => moveAction(index, 1)}
                      disabled={index === actions.length - 1}
                      title="아래로 이동"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {action.type === 'list' ? (
                  <ListAction
                    action={action}
                    lists={lists}
                    onChange={(updated) => updateAction(index, updated)}
                    onRemove={() => removeAction(index)}
                  />
                ) : (
                  <WebhookAction
                    action={action}
                    onChange={(updated) => {
                      // 업데이트 시 _isNew 플래그 제거
                      const { _isNew, ...cleanAction } = updated;
                      updateAction(index, cleanAction);
                      if (newlyAddedIndex === index) {
                        setNewlyAddedIndex(null);
                      }
                    }}
                    onRemove={() => removeAction(index)}
                    autoLoadDefaults={action._isNew === true}
                  />
                )}

                {index < actions.length - 1 && (
                  <div className="step-connector">
                    <div className="connector-line"></div>
                    <span className="connector-arrow">↓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 웹훅 테스트 섹션 - 웹훅 액션이 있을 때만 표시 */}
        {hasWebhookAction && (
          <div className="webhook-test-section">
            <div className="test-section-header">
              <h4>웹훅 테스트</h4>
            </div>

            {/* 이벤트 데이터 참조 */}
            <div className="event-reference">
              <label>이벤트 데이터 참조</label>
              <select
                className="form-control"
                value={selectedEvent}
                onChange={(e) => handleEventSelect(e.target.value)}
              >
                <option value="">-- 이벤트를 선택하세요 (선택사항) --</option>
                {availableEvents.map((event, index) => (
                  <option key={index} value={event.event_name}>
                    {event.event_name}
                  </option>
                ))}
              </select>

              {eventData && (
                <div className="variable-list">
                  <span className="variable-label">사용 가능한 변수:</span>
                  {Object.keys(eventData).map((key) => (
                    <span key={key} className="variable-badge">
                      {`{{${key}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 리드 선택 */}
            <div className="lead-selection">
              <label>테스트 리드 선택</label>
              {selectedLead ? (
                <div className="selected-lead">
                  <span className="lead-info">
                    <strong>{selectedLead.first_name || '이름없음'}</strong>
                    <span className="lead-email">{selectedLead.lead_email}</span>
                    {selectedLead.phone_number && (
                      <span className="lead-phone">{selectedLead.phone_number}</span>
                    )}
                  </span>
                  <button
                    className="btn-change-lead"
                    onClick={() => setShowLeadSearch(true)}
                  >
                    변경
                  </button>
                  <button
                    className="btn-clear-lead"
                    onClick={() => setSelectedLead(null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  className="btn-select-lead"
                  onClick={() => setShowLeadSearch(true)}
                >
                  🔍 리드 검색 및 선택
                </button>
              )}
            </div>

            {/* 테스트 버튼 */}
            <div className="test-actions">
              <button
                className="btn-webhook-test"
                onClick={handleWebhookTest}
                disabled={isTesting || !selectedLead}
              >
                {isTesting ? '테스트 중...' : '🧪 웹훅 테스트 실행'}
              </button>
            </div>

            {/* 테스트 결과 */}
            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? (
                  <>
                    <strong>✅ {testResult.message}</strong>
                    {testResult.response?.response && (
                      <div className="test-response">
                        상태: {testResult.response.response.status}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <strong>❌ 테스트 실패</strong>
                    <div className="test-error">{testResult.error}</div>
                    {testResult.details && (
                      <div className="test-details">{JSON.stringify(testResult.details)}</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="add-buttons">
          <button
            className="btn-add"
            onClick={() => addAction('list')}
          >
            <span className="btn-icon">📋</span>
            리스트 추가
          </button>
          <button
            className="btn-add"
            onClick={() => addAction('webhook')}
          >
            <span className="btn-icon">🔗</span>
            웹훅발동 추가
          </button>
        </div>
      </div>

      {/* 리드 검색 모달 */}
      {showLeadSearch && (
        <div className="modal-overlay" onClick={() => setShowLeadSearch(false)}>
          <div className="lead-search-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>리드 검색</h3>
              <button className="modal-close" onClick={() => setShowLeadSearch(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="search-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="이메일, 이름 또는 전화번호로 검색..."
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLeads()}
                />
                <button
                  className="btn-search"
                  onClick={searchLeads}
                  disabled={isSearching}
                >
                  {isSearching ? '검색 중...' : '검색'}
                </button>
              </div>

              <div className="search-results">
                {searchResults.length === 0 ? (
                  <p className="no-results">
                    {leadSearchQuery ? '검색 결과가 없습니다.' : '검색어를 입력하세요.'}
                  </p>
                ) : (
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>이메일</th>
                        <th>이름</th>
                        <th>전화번호</th>
                        <th>리스트</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((lead, idx) => (
                        <tr key={idx}>
                          <td>{lead.lead_email}</td>
                          <td>{lead.first_name || '-'}</td>
                          <td>{lead.phone_number || '-'}</td>
                          <td>{lead.list_name}</td>
                          <td>
                            <button
                              className="btn-select"
                              onClick={() => selectLead(lead)}
                            >
                              선택
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionBuilder;
