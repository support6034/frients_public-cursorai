import React, { useState, useEffect } from 'react';
import api from '../api';
import './WorkflowCondition.css';

function WorkflowCondition({ condition, onChange }) {
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
    <div className="workflow-condition">
      <div className="section-header">
        <div className="step-badge">1</div>
        <h3>조건</h3>
        <button className="btn-done">DONE</button>
      </div>

      <div className="section-description">
        다음 조건들을 충족 시키는 리드를 워크플로우에 추가합니다
        <br />
        <span className="example-text">예시: Join a List, Industry is Healthcare etc.</span>
      </div>

      <div className="condition-box">
        <div className="condition-header">
          <span className="icon">⚡</span>
          <span className="title">커스텀 이벤트</span>
          <span className="chevron">›</span>
          <span className="subtitle">리드 조건 정하기:</span>
        </div>

        <div className="form-group">
          <label>이벤트 (실제 수신된 이벤트 선택)</label>
          <select
            className="form-control"
            value={condition.event_name}
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
          <small className="help-text">
            예: 주문완료, 예약완료 등 - GTM에서 수신된 이벤트만 표시됩니다
          </small>
        </div>

        <div className="form-group">
          <label>필터 (조건 설정)</label>
          <select
            className="form-control"
            value={condition.filter}
            onChange={(e) => handleChange('filter', e.target.value)}
          >
            <option value="존재하는">
              존재하는 - 선택한 이벤트가 수신되면 조건 만족
            </option>
            <option value="존재하지않는">
              존재하지 않는 - 선택한 이벤트가 수신되지 않으면 조건 만족
            </option>
          </select>
          <small className="help-text">
            {condition.filter === '존재하는'
              ? `"${condition.event_name || '이벤트'}" 이벤트가 발생하면 액션이 실행됩니다.`
              : `"${condition.event_name || '이벤트'}" 이벤트가 발생하지 않으면 액션이 실행됩니다.`
            }
          </small>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>빈도</label>
            <div className="frequency-inputs">
              <select
                className="form-control"
                value="최소"
                onChange={() => {}}
              >
                <option value="최소">최소</option>
                <option value="최대">최대</option>
                <option value="정확히">정확히</option>
              </select>
              <input
                type="number"
                className="form-control"
                value={condition.frequency}
                onChange={(e) => handleChange('frequency', parseInt(e.target.value))}
                min="1"
              />
              <span>회</span>
            </div>
          </div>

          <div className="form-group">
            <label>기간</label>
            <select
              className="form-control"
              value={condition.frequency_period}
              onChange={(e) => handleChange('frequency_period', e.target.value)}
            >
              <option value="기간과 상관없이">기간과 상관없이</option>
              <option value="지난 7일">지난 7일</option>
              <option value="지난 30일">지난 30일</option>
              <option value="지난 90일">지난 90일</option>
            </select>
          </div>
        </div>

        <button className="btn-add-constraint">+ Add Constraint</button>
      </div>

      {eventData && (
        <div className="event-data-preview">
          <h4>수신 이벤트 데이터 미리보기:</h4>
          <pre>{JSON.stringify(eventData, null, 2)}</pre>
          <div className="available-variables">
            <strong>사용 가능한 변수:</strong>
            <div className="variable-list">
              {Object.keys(eventData).map((key) => (
                <span key={key} className="variable-badge">
                  {`{{${key}}}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="section-footer">
        <button className="btn-save">저장</button>
      </div>
    </div>
  );
}

export default WorkflowCondition;
