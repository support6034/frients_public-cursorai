import React, { useState } from 'react';
import api from '../api';
import './WorkflowAction.css';

function WorkflowAction({ action, onChange, workflowId }) {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testLeadData, setTestLeadData] = useState({
    email: '',
    first_name: '',
    phone_number: '',
    customFields: {}
  });
  const [savedTestLeads, setSavedTestLeads] = useState([]);

  const handleUrlChange = (url) => {
    onChange({
      ...action,
      webhook_url: url
    });
  };

  const handleParamChange = (index, field, value) => {
    const params = { ...action.webhook_params };
    const keys = Object.keys(params);
    const oldKey = keys[index];

    if (field === 'key') {
      // 키 변경
      const oldValue = params[oldKey];
      delete params[oldKey];
      params[value] = oldValue;
    } else {
      // 값 변경
      params[oldKey] = value;
    }

    onChange({
      ...action,
      webhook_params: params
    });
  };

  const handleAddParam = () => {
    const params = { ...action.webhook_params };
    const newKey = `param${Object.keys(params).length + 1}`;
    params[newKey] = '';

    onChange({
      ...action,
      webhook_params: params
    });
  };

  const handleRemoveParam = (key) => {
    const params = { ...action.webhook_params };
    delete params[key];

    onChange({
      ...action,
      webhook_params: params
    });
  };

  const handleTestLeadChange = (field, value) => {
    setTestLeadData({
      ...testLeadData,
      [field]: value
    });
  };

  const handleCustomFieldChange = (key, value) => {
    setTestLeadData({
      ...testLeadData,
      customFields: {
        ...testLeadData.customFields,
        [key]: value
      }
    });
  };

  const handleTest = async () => {
    if (!workflowId) {
      alert('워크플로우를 먼저 저장해주세요.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // 테스트 리드 데이터와 커스텀 필드를 합침
      const combinedTestData = {
        ...testLeadData,
        ...testLeadData.customFields,
        event: '테스트'
      };

      const response = await api.post(`/api/workflows/${workflowId}/test`, {
        testData: combinedTestData
      });

      setTestResult({
        success: true,
        message: '웹훅 테스트 성공!',
        data: response.data
      });

      setShowTestModal(false);
    } catch (error) {
      setTestResult({
        success: false,
        message: '웹훅 테스트 실패',
        error: error.response?.data || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const loadSavedTestLeads = async () => {
    try {
      const response = await api.get('/api/test-leads');
      if (response.data.success) {
        setSavedTestLeads(response.data.data);
      }
    } catch (error) {
      console.error('테스트 리드 로드 오류:', error);
    }
  };

  const handleSelectTestLead = (lead) => {
    setTestLeadData({
      email: lead.email || '',
      first_name: lead.name || '',
      phone_number: lead.phone_number || '',
      customFields: lead.custom_data || {}
    });
  };

  const handleSaveTestLead = async () => {
    try {
      await api.post('/api/test-leads', {
        name: testLeadData.first_name,
        email: testLeadData.email,
        phone_number: testLeadData.phone_number,
        custom_data: testLeadData.customFields
      });
      alert('테스트 리드가 저장되었습니다.');
      loadSavedTestLeads();
    } catch (error) {
      console.error('테스트 리드 저장 오류:', error);
      alert('저장 실패');
    }
  };

  return (
    <div className="workflow-action">
      <div className="section-header">
        <div className="step-badge">2</div>
        <h3>액션</h3>
        <button className="btn-done">DONE</button>
      </div>

      <div className="section-description">
        리드가 위의 조건들을 충족시킬 때 다음 액션들을 가동합니다
        <br />
        <span className="example-text">예시: 목록에 추가하기, 이메일 보내기 등</span>
      </div>

      <div className="action-box">
        <div className="action-header">
          <span className="icon">⚓</span>
          <span className="title">웹훅 발동하기</span>
          <span className="chevron">›</span>
          <span className="subtitle">액션 정하기</span>
        </div>

        <div className="form-group">
          <label>URL to POST to</label>
          <input
            type="text"
            className="form-control"
            value={action.webhook_url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://new.alimbot.com/api/v1/msg/process"
          />
        </div>

        <div className="form-group">
          <label>추가의 변수 (parameter)</label>
          <div className="params-list">
            {Object.entries(action.webhook_params).map(([key, value], index) => (
              <div key={index} className="param-row">
                <input
                  type="text"
                  className="form-control param-key"
                  value={key}
                  onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                  placeholder="key"
                />
                <span className="separator">:</span>
                <input
                  type="text"
                  className="form-control param-value"
                  value={value}
                  onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                  placeholder="value 또는 {{변수명}}"
                />
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveParam(key)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <button className="btn-add-param" onClick={handleAddParam}>
            + 변수 (parameter) 추가하기
          </button>
        </div>

        <div className="test-section">
          <button
            className="btn-test"
            onClick={() => {
              setShowTestModal(true);
              loadSavedTestLeads();
            }}
            disabled={!action.webhook_url}
          >
            웹훅 테스트 실행
          </button>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <h4>{testResult.message}</h4>
              <pre>{JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>웹훅 테스트 - 리드 데이터 입력</h3>
              <button className="btn-close" onClick={() => setShowTestModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="saved-leads-section">
                <label>저장된 테스트 리드 선택 (선택사항)</label>
                <select
                  className="form-control"
                  onChange={(e) => {
                    const lead = savedTestLeads.find(l => l.id === parseInt(e.target.value));
                    if (lead) handleSelectTestLead(lead);
                  }}
                >
                  <option value="">-- 직접 입력하거나 선택 --</option>
                  {savedTestLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="test-lead-inputs">
                <div className="form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    className="form-control"
                    value={testLeadData.email}
                    onChange={(e) => handleTestLeadChange('email', e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    className="form-control"
                    value={testLeadData.first_name}
                    onChange={(e) => handleTestLeadChange('first_name', e.target.value)}
                    placeholder="홍길동"
                  />
                </div>

                <div className="form-group">
                  <label>전화번호</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={testLeadData.phone_number}
                    onChange={(e) => handleTestLeadChange('phone_number', e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="custom-fields-section">
                  <label>추가 필드 (선택사항)</label>
                  {Object.keys(testLeadData.customFields).map(key => (
                    <div key={key} className="param-row">
                      <input
                        type="text"
                        className="form-control param-key"
                        value={key}
                        disabled
                      />
                      <span className="separator">:</span>
                      <input
                        type="text"
                        className="form-control param-value"
                        value={testLeadData.customFields[key]}
                        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    className="btn-add-param"
                    onClick={() => {
                      const key = prompt('필드명을 입력하세요:');
                      if (key) handleCustomFieldChange(key, '');
                    }}
                  >
                    + 필드 추가
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleSaveTestLead}
              >
                이 리드 저장
              </button>
              <button
                className="btn btn-primary"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? '테스트 중...' : '테스트 실행'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-footer">
        <button className="btn-save">완료</button>
      </div>
    </div>
  );
}

export default WorkflowAction;
