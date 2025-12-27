import React, { useState, useEffect, useRef } from 'react';
import './ConditionItem.css';

// 기본 웹훅 파라미터 (알림봇 설정)
const DEFAULT_WEBHOOK_PARAMS = {
  bizmId: 'loveyh7744',
  key: '3be7febe866444dab6a9cf227654f69d',
  type: '03',
  message_type: 'AI',
  profile: 'f7ff2667e635e1750eb9146a83915d6d1dc986b0',
  tempCode: 'purchase_confirmed_test_group',
  message: '안녕하세요. #{고객}님!  주문이 완료되었습니다.',
  buttonCount: '1',
  button1_type: 'WL',
  button1_name: '주문 내역 보러 가기',
  button1_pc: 'https://placegarden.kr/order/detail',
  button1_mobile: 'https://placegarden.kr/order/detail',
  paramCount: '1',
  param1: '{{first_name}}'
};

const DEFAULT_WEBHOOK_URL = 'https://new.alimbot.com/api/v1/msg/process';

function WebhookAction({ action, onChange, onRemove, autoLoadDefaults = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 자동 초기설정 로드 (최초 1회만)
    if (autoLoadDefaults && !hasInitialized.current) {
      if (!action.webhook_url && Object.keys(action.webhook_params || {}).length === 0) {
        hasInitialized.current = true;
        onChange({
          ...action,
          webhook_url: DEFAULT_WEBHOOK_URL,
          webhook_params: { ...DEFAULT_WEBHOOK_PARAMS }
        });
        setIsExpanded(true);
      }
    }
  }, []);

  const handleChange = (field, value) => {
    onChange({
      ...action,
      [field]: value
    });
  };

  const handleParamChange = (key, value) => {
    const newParams = { ...action.webhook_params, [key]: value };
    onChange({ ...action, webhook_params: newParams });
  };

  const addParam = () => {
    const key = `param_${Date.now()}`;
    const newParams = { ...action.webhook_params, [key]: '' };
    onChange({ ...action, webhook_params: newParams });
  };

  const removeParam = (key) => {
    const newParams = { ...action.webhook_params };
    delete newParams[key];
    onChange({ ...action, webhook_params: newParams });
  };

  const renameParam = (oldKey, newKey) => {
    if (oldKey === newKey) return;
    const newParams = {};
    for (const [k, v] of Object.entries(action.webhook_params || {})) {
      if (k === oldKey) {
        newParams[newKey] = v;
      } else {
        newParams[k] = v;
      }
    }
    onChange({ ...action, webhook_params: newParams });
  };

  const loadDefaultSettings = () => {
    onChange({
      ...action,
      webhook_url: DEFAULT_WEBHOOK_URL,
      webhook_params: { ...DEFAULT_WEBHOOK_PARAMS }
    });
    setIsExpanded(true);
  };

  const paramCount = Object.keys(action.webhook_params || {}).length;

  return (
    <div className="action-item webhook-action">
      <div className="action-header">
        <span className="action-icon">🔗</span>
        <span className="action-title">웹훅 발동</span>
        <button
          className="btn-expand"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
        <button className="btn-remove" onClick={onRemove}>×</button>
      </div>

      <div className="action-body">
        <div className="form-group">
          <label>Webhook URL</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://example.com/webhook"
            value={action.webhook_url || ''}
            onChange={(e) => handleChange('webhook_url', e.target.value)}
          />
        </div>

        {!isExpanded && paramCount > 0 && (
          <div className="params-summary">
            파라미터 {paramCount}개 설정됨
          </div>
        )}

        {!action.webhook_url && Object.keys(action.webhook_params || {}).length === 0 && (
          <button
            className="btn-load-default"
            onClick={loadDefaultSettings}
          >
            🔧 초기설정 불러오기 (알림봇)
          </button>
        )}

        {isExpanded && (
          <div className="form-group">
            <label>파라미터</label>
            <div className="params-list">
              {Object.entries(action.webhook_params || {}).map(([key, value]) => (
                <div key={key} className="param-row" style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="키"
                    defaultValue={key}
                    onBlur={(e) => renameParam(key, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="값 (예: {{email}})"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <button
                    className="btn-remove-param"
                    onClick={() => removeParam(key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e53e3e',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0 0.5rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-add-param"
              onClick={addParam}
              style={{
                background: 'none',
                border: '1px dashed #cbd5e0',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                color: '#4a5568',
                cursor: 'pointer',
                width: '100%',
                marginTop: '0.5rem'
              }}
            >
              + 파라미터 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WebhookAction;
