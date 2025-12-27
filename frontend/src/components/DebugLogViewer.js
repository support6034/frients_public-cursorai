import React, { useState, useEffect } from 'react';
import api from '../api';
import './DebugLogViewer.css';

function DebugLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    component: '',
    direction: '',
    limit: 50
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadLogs();
    
    // 자동 새로고침 설정
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
      }, 3000); // 3초마다 새로고침
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [filters, autoRefresh]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.component) params.append('component', filters.component);
      if (filters.direction) params.append('direction', filters.direction);
      params.append('limit', filters.limit);

      const response = await api.get(`/api/debug-logs?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('로그 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'success' || status === 'received') return 'status-success';
    if (status === 'error') return 'status-error';
    if (status === 'skipped') return 'status-skipped';
    return 'status-info';
  };

  const getDirectionIcon = (direction) => {
    return direction === 'IN' ? '⬇️' : '⬆️';
  };

  const getComponentLabel = (component) => {
    return component === 'GW' ? '게이트웨이' : '워크플로우';
  };

  const getActionLabel = (action) => {
    const labels = {
      '스마트스토어 API 폴링': '스마트스토어 API 폴링',
      'GTM 트리거 발생': 'GTM 트리거 발생',
      'GTM 이벤트 수신': 'GTM 이벤트 수신',
      '알림봇 웹훅 API 호출': '알림봇 웹훅 API 호출'
    };
    return labels[action] || action;
  };

  const handleGWTest = async () => {
    try {
      const response = await api.post('/api/test/gw-smartstore-poll');
      if (response.data.success) {
        alert('GW 테스트 완료!\n스마트스토어 API 폴링 및 GTM 트리거가 발생했습니다.');
        loadLogs(); // 로그 새로고침
      }
    } catch (error) {
      console.error('GW 테스트 오류:', error);
      alert('GW 테스트 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleWFTest = async () => {
    try {
      const response = await api.post('/api/test/wf-gtm-event', {
        event: '결제완료',
        email: 'test@example.com',
        customerName: '테스트 고객',
        customerPhone: '010-1234-5678',
        orderId: `ORDER-${Date.now()}`,
        orderAmount: 50000
      });
      if (response.data.success) {
        alert('WF 테스트 완료!\nGTM 이벤트 수신 및 워크플로우 처리가 완료되었습니다.');
        loadLogs(); // 로그 새로고침
      }
    } catch (error) {
      console.error('WF 테스트 오류:', error);
      alert('WF 테스트 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="debug-log-viewer">
      <div className="debug-log-header">
        <h2>GW/WF 디버그 로그</h2>
        <div className="debug-log-controls">
          <div className="test-buttons">
            <button className="test-btn test-btn-gw" onClick={handleGWTest}>
              🧪 GW 테스트
            </button>
            <button className="test-btn test-btn-wf" onClick={handleWFTest}>
              🧪 WF 테스트
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침 (3초)
          </label>
          <button onClick={loadLogs} disabled={loading}>
            {loading ? '로딩 중...' : '새로고침'}
          </button>
        </div>
      </div>

      <div className="debug-log-filters">
        <select
          value={filters.component}
          onChange={(e) => setFilters({ ...filters, component: e.target.value })}
        >
          <option value="">전체 컴포넌트</option>
          <option value="GW">게이트웨이 (GW)</option>
          <option value="WF">워크플로우 (WF)</option>
        </select>

        <select
          value={filters.direction}
          onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
        >
          <option value="">전체 방향</option>
          <option value="IN">수신 (IN)</option>
          <option value="OUT">발신 (OUT)</option>
        </select>

        <select
          value={filters.limit}
          onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
        >
          <option value="20">최근 20개</option>
          <option value="50">최근 50개</option>
          <option value="100">최근 100개</option>
          <option value="200">최근 200개</option>
        </select>
      </div>

      <div className="debug-log-list">
        {logs.length === 0 ? (
          <div className="empty-logs">로그가 없습니다.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`debug-log-item ${getStatusBadgeClass(log.status)}`}>
              <div className="log-header">
                <div className="log-meta">
                  <span className="log-component">{getComponentLabel(log.component)}</span>
                  <span className="log-direction">{getDirectionIcon(log.direction)} {log.direction}</span>
                  <span className="log-time">{formatDateTime(log.created_at)}</span>
                </div>
                <span className={`log-status ${getStatusBadgeClass(log.status)}`}>
                  {log.status === 'success' ? '✅ 성공' : 
                   log.status === 'received' ? '📥 수신' :
                   log.status === 'error' ? '❌ 오류' :
                   log.status === 'skipped' ? '⏭️ 건너뜀' : log.status}
                </span>
              </div>
              
              <div className="log-action">
                <strong>{getActionLabel(log.action)}</strong>
                {log.url && (
                  <span className="log-url" title={log.url}>
                    {log.url.length > 60 ? log.url.substring(0, 60) + '...' : log.url}
                  </span>
                )}
              </div>

              {log.request_data && (
                <div className="log-data">
                  <div className="log-data-label">📤 요청 데이터:</div>
                  <pre className="log-data-content">{JSON.stringify(log.request_data, null, 2)}</pre>
                </div>
              )}

              {log.response_data && (
                <div className="log-data">
                  <div className="log-data-label">📥 응답 데이터:</div>
                  <pre className="log-data-content">{JSON.stringify(log.response_data, null, 2)}</pre>
                </div>
              )}

              {log.error_message && (
                <div className="log-error">
                  <div className="log-error-label">⚠️ 오류 메시지:</div>
                  <div className="log-error-content">{log.error_message}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DebugLogViewer;

