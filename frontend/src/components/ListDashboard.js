import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import './ListDashboard.css';

function ListDashboard({ list, onBack, onUpdate }) {
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', first_name: '', phone_number: '' });
  const [importData, setImportData] = useState([]);
  const [listName, setListName] = useState(list.name);
  const [goalCount, setGoalCount] = useState(list.goal_count || 0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMembers();
  }, [list.id]);

  const loadMembers = async () => {
    try {
      const response = await api.get(`/api/lists/${list.id}/members`);
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error('멤버 로드 오류:', error);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.email) {
      alert('이메일은 필수입니다.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/lists/${list.id}/members`, newMember);
      await loadMembers();
      setNewMember({ email: '', first_name: '', phone_number: '' });
      setShowAddModal(false);
      onUpdate && onUpdate();
    } catch (error) {
      alert('멤버 추가 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}명의 리드를 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      const emails = members.filter(m => selectedIds.has(m.id)).map(m => m.lead_email);
      await api.delete(`/api/lists/${list.id}/members`, { data: { emails } });
      await loadMembers();
      setSelectedIds(new Set());
      onUpdate && onUpdate();
    } catch (error) {
      alert('삭제 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleExport = () => {
    window.open(`/api/lists/${list.id}/export`, '_blank');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const data = [];

      lines.slice(1).forEach(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        if (values[0]) {
          data.push({
            email: values[0],
            first_name: values[1] || '',
            phone_number: values[2] || ''
          });
        }
      });

      setImportData(data);
      setShowImportModal(true);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    setLoading(true);
    try {
      const response = await api.post(`/api/lists/${list.id}/import`, { data: importData });
      alert(`${response.data.imported}명 가져오기 완료`);
      await loadMembers();
      setImportData([]);
      setShowImportModal(false);
      onUpdate && onUpdate();
    } catch (error) {
      alert('가져오기 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleRename = async () => {
    if (!listName.trim()) return;
    setLoading(true);
    try {
      await api.put(`/api/lists/${list.id}`, { name: listName, description: list.description });
      onUpdate && onUpdate();
      setShowRenameModal(false);
    } catch (error) {
      alert('이름 변경 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleGoalSave = async () => {
    setLoading(true);
    try {
      await api.put(`/api/lists/${list.id}/goal`, { goal_count: goalCount });
      onUpdate && onUpdate();
      setShowGoalModal(false);
    } catch (error) {
      alert('목표 저장 실패: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleDeleteList = async () => {
    if (!window.confirm('이 리스트를 삭제하시겠습니까? 모든 멤버도 함께 삭제됩니다.')) return;
    try {
      await api.delete(`/api/lists/${list.id}`);
      onBack();
    } catch (error) {
      alert('삭제 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const goalPercentage = goalCount > 0 ? Math.min(100, Math.round((members.length / goalCount) * 100)) : 0;

  return (
    <div className="list-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>◀ 뒤로</button>
          <h2>{list.name}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-secondary btn-sm" onClick={() => setShowRenameModal(true)}>이름수정</button>
          <button className="btn-danger btn-sm" onClick={handleDeleteList}>삭제</button>
        </div>
      </div>

      {/* Goal Section */}
      <div className="goal-section">
        <div className="goal-header">
          <span>목표: {goalCount > 0 ? `${goalCount}명` : '설정안됨'}</span>
          <button className="btn-link" onClick={() => setShowGoalModal(true)}>수정</button>
        </div>
        {goalCount > 0 && (
          <div className="goal-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${goalPercentage}%` }}></div>
            </div>
            <span className="progress-text">{members.length}/{goalCount} ({goalPercentage}%)</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-left">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current.click()}>
            리드 불러오기
          </button>
          <button className="btn-secondary btn-sm" onClick={handleExport}>
            리드 내보내기
          </button>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + 리드 추가
          </button>
        </div>
        <div className="toolbar-right">
          <span className="member-count">전체 리드: {members.length}명</span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bulk-actions">
          <span>선택됨: {selectedIds.size}명</span>
          <button className="btn-danger btn-sm" onClick={handleDeleteSelected}>삭제</button>
        </div>
      )}

      {/* Members Table */}
      <div className="members-table-wrapper">
        <table className="members-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={members.length > 0 && selectedIds.size === members.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>이메일</th>
              <th>이름</th>
              <th>휴대폰</th>
              <th>추가일</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">리드가 없습니다.</td>
              </tr>
            ) : (
              members.map(member => (
                <tr key={member.id}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.id)}
                      onChange={() => toggleSelect(member.id)}
                    />
                  </td>
                  <td>{member.lead_email}</td>
                  <td>{member.first_name || '-'}</td>
                  <td>{member.phone_number || '-'}</td>
                  <td>{new Date(member.added_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>리드 추가</h3>
            <div className="form-group">
              <label>이메일 *</label>
              <input
                type="email"
                className="form-control"
                value={newMember.email}
                onChange={e => setNewMember({...newMember, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                className="form-control"
                value={newMember.first_name}
                onChange={e => setNewMember({...newMember, first_name: e.target.value})}
                placeholder="홍길동"
              />
            </div>
            <div className="form-group">
              <label>휴대폰</label>
              <input
                type="tel"
                className="form-control"
                value={newMember.phone_number}
                onChange={e => setNewMember({...newMember, phone_number: e.target.value})}
                placeholder="010-1234-5678"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleAddMember} disabled={loading}>
                {loading ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h3>리드 불러오기</h3>
            <p className="import-info">{importData.length}명의 리드를 가져옵니다.</p>
            <div className="import-preview">
              <table>
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>휴대폰</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      <td>{row.email}</td>
                      <td>{row.first_name || '-'}</td>
                      <td>{row.phone_number || '-'}</td>
                    </tr>
                  ))}
                  {importData.length > 5 && (
                    <tr><td colSpan="3">... 외 {importData.length - 5}명</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleImport} disabled={loading}>
                {loading ? '가져오는 중...' : '가져오기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>목표 설정</h3>
            <div className="form-group">
              <label>목표 리드 수</label>
              <input
                type="number"
                className="form-control"
                value={goalCount}
                onChange={e => setGoalCount(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowGoalModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleGoalSave} disabled={loading}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>리스트 이름 변경</h3>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                className="form-control"
                value={listName}
                onChange={e => setListName(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRenameModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleRename} disabled={loading}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListDashboard;
