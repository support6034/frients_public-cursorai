import React, { useState, useEffect } from 'react';
import api from '../api';
import ListDashboard from './ListDashboard';
import './ListManager.css';

function ListManager() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const response = await api.get('/api/lists');
      if (response.data.success) {
        setLists(response.data.data);
        // Update selected list if it exists
        if (selectedList) {
          const updated = response.data.data.find(l => l.id === selectedList.id);
          if (updated) setSelectedList(updated);
        }
      }
    } catch (error) {
      console.error('리스트 로드 오류:', error);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    setLoading(true);
    try {
      const response = await api.post('/api/lists', {
        name: newListName,
        description: newListDescription
      });
      if (response.data.success) {
        await loadLists();
        setShowCreateModal(false);
        setNewListName('');
        setNewListDescription('');
      }
    } catch (error) {
      console.error('리스트 생성 오류:', error);
      alert('리스트 생성 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleListClick = (list) => {
    setSelectedList(list);
    setShowDashboard(true);
  };

  const handleBackFromDashboard = () => {
    setShowDashboard(false);
    setSelectedList(null);
    loadLists();
  };

  // Show dashboard view
  if (showDashboard && selectedList) {
    return (
      <ListDashboard
        list={selectedList}
        onBack={handleBackFromDashboard}
        onUpdate={loadLists}
      />
    );
  }

  // Show list overview
  return (
    <div className="list-manager">
      <div className="list-manager-header">
        <h2>리스트 관리</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + 새 리스트
        </button>
      </div>

      <div className="lists-grid">
        {lists.length === 0 ? (
          <div className="empty-message">
            리스트가 없습니다. 새 리스트를 만들어보세요.
          </div>
        ) : (
          lists.map(list => (
            <div
              key={list.id}
              className="list-card"
              onClick={() => handleListClick(list)}
            >
              <div className="list-card-header">
                <h3>{list.name}</h3>
              </div>
              <div className="list-card-body">
                {list.description && (
                  <p className="list-description">{list.description}</p>
                )}
                <div className="list-stats">
                  <div className="stat">
                    <span className="stat-value">{list.member_count || 0}</span>
                    <span className="stat-label">리드</span>
                  </div>
                  {list.goal_count > 0 && (
                    <div className="stat">
                      <span className="stat-value">
                        {Math.round((list.member_count / list.goal_count) * 100)}%
                      </span>
                      <span className="stat-label">목표</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 리스트 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>새 리스트 만들기</h3>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                className="form-control"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="리스트 이름"
              />
            </div>
            <div className="form-group">
              <label>설명 (선택)</label>
              <textarea
                className="form-control"
                value={newListDescription}
                onChange={e => setNewListDescription(e.target.value)}
                placeholder="리스트 설명"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
              <button className="btn-primary" onClick={createList} disabled={loading}>
                {loading ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListManager;
