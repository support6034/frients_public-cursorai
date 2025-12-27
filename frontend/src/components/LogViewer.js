import React, { useState, useEffect } from 'react';
import api from '../api';
import './LogViewer.css';

function LogViewer() {
  const [activeTab, setActiveTab] = useState('events');
  const [eventLogs, setEventLogs] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [eventsRes, executionsRes] = await Promise.all([
        api.get('/api/event-logs?limit=50'),
        api.get('/api/execution-logs?limit=50')
      ]);

      if (eventsRes.data.success) {
        setEventLogs(eventsRes.data.data);
      }
      if (executionsRes.data.success) {
        setExecutionLogs(executionsRes.data.data);
      }
    } catch (error) {
      console.error('로그 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const formatJson = (data) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return data;
    }
  };

  return (
    <div className="log-viewer">
      <div className="log-header">
        <h2>로그 뷰어</h2>
        <button className="btn btn-sm btn-refresh" onClick={loadLogs} disabled={loading}>
          {loading ? '로딩...' : '새로고침'}
        </button>
      </div>

      <div className="log-tabs">
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          GTM 수신 이벤트 ({eventLogs.length})
        </button>
        <button
          className={`tab ${activeTab === 'executions' ? 'active' : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          웹훅 발송 로그 ({executionLogs.length})
        </button>
      </div>

      <div className="log-content">
        {activeTab === 'events' && (
          <div className="log-table-container">
            {eventLogs.length === 0 ? (
              <div className="empty-state">수신된 이벤트가 없습니다.</div>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이벤트명</th>
                    <th>수신 데이터</th>
                    <th>수신 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>
                        <span className="badge badge-event">{log.event_name}</span>
                      </td>
                      <td>
                        <pre className="json-data">{formatJson(log.event_data)}</pre>
                      </td>
                      <td>{formatDate(log.received_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="log-table-container">
            {executionLogs.length === 0 ? (
              <div className="empty-state">웹훅 발송 기록이 없습니다.</div>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>워크플로우</th>
                    <th>이벤트</th>
                    <th>상태</th>
                    <th>응답</th>
                    <th>실행 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {executionLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.workflow_name}</td>
                      <td>
                        <span className={`badge ${log.status.includes('test') ? 'badge-test' : 'badge-event'}`}>
                          {log.event_name || (log.status.includes('test') ? '웹훅 테스트' : '-')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${log.status.includes('success') ? 'badge-success' : 'badge-error'}`}>
                          {log.status === 'success' && '성공'}
                          {log.status === 'failed' && '실패'}
                          {log.status === 'test_success' && '테스트 성공'}
                          {log.status === 'test_failed' && '테스트 실패'}
                        </span>
                      </td>
                      <td>
                        <pre className="json-data">{formatJson(log.webhook_response)}</pre>
                      </td>
                      <td>{formatDate(log.executed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
