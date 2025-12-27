import React, { useState, useEffect } from 'react';
import api from '../api';
import './ConditionItem.css';

function CustomEventCondition({ condition, onChange, onRemove }) {
  const [availableEvents, setAvailableEvents] = useState([]);
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    loadAvailableEvents();
  }, []);

  useEffect(() => {
    if (condition.event_name) {
      loadEventData(condition.event_name);
    }
  }, [condition.event_name]);

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

  const handleChange = (field, value) => {
    onChange({
      ...condition,
      [field]: value
    });
  };

  return (
    <div className="condition-item event-condition">
      <div className="condition-header">
        <span className="condition-icon">⚡</span>
        <span className="condition-title">맞춤이벤트</span>
        <button className="btn-remove" onClick={onRemove}>×</button>
      </div>

      <div className="condition-body">
        <div className="form-group">
          <label>이벤트</label>
          <select
            className="form-control"
            value={condition.event_name || ''}
            onChange={(e) => handleChange('event_name', e.target.value)}
          >
            <option value="">-- 이벤트를 선택하세요 --</option>
            {availableEvents.length === 0 ? (
              <option disabled>수신된 이벤트가 없습니다</option>
            ) : (
              availableEvents.map((event, index) => (
                <option key={index} value={event.event_name}>
                  {event.event_name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <label>필터</label>
          <select
            className="form-control"
            value={condition.filter || '존재하는'}
            onChange={(e) => handleChange('filter', e.target.value)}
          >
            <option value="존재하는">존재하는</option>
            <option value="존재하지않는">존재하지 않는</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>빈도</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select className="form-control" style={{ width: 'auto' }}>
                <option value="최소">최소</option>
              </select>
              <input
                type="number"
                className="form-control"
                style={{ width: '80px' }}
                value={condition.frequency || 1}
                onChange={(e) => handleChange('frequency', parseInt(e.target.value))}
                min="1"
              />
              <span>회</span>
            </div>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>기간</label>
            <select
              className="form-control"
              value={condition.frequency_period || '기간과 상관없이'}
              onChange={(e) => handleChange('frequency_period', e.target.value)}
            >
              <option value="기간과 상관없이">기간과 상관없이</option>
              <option value="지난 7일">지난 7일</option>
              <option value="지난 30일">지난 30일</option>
              <option value="지난 90일">지난 90일</option>
            </select>
          </div>
        </div>

        {eventData && (
          <div className="condition-info">
            <strong>사용 가능한 변수:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              {Object.keys(eventData).map((key) => (
                <span key={key} className="variable-badge" style={{
                  display: 'inline-block',
                  background: '#edf2f7',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginRight: '0.25rem',
                  marginBottom: '0.25rem'
                }}>
                  {`{{${key}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomEventCondition;
