import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import './WorkflowList.css';

function WorkflowList({ workflows, onEdit, onDelete, onRefresh }) {
  const [launching, setLaunching] = useState({});
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [goalType, setGoalType] = useState('conversion');
  const [goalTarget, setGoalTarget] = useState(0);
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [leadCounts, setLeadCounts] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  // 실시간 상태 업데이트를 위한 로컬 상태
  const [localWorkflowStates, setLocalWorkflowStates] = useState({});

  useEffect(() => {
    loadFolders();
    loadLeadCounts();
  }, [workflows]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadLeadCounts = async () => {
    try {
      const counts = {};
      for (const workflow of workflows) {
        const response = await api.get(`/api/workflows/${workflow.id}/lead-count`);
        if (response.data.success) {
          counts[workflow.id] = response.data.count;
        }
      }
      setLeadCounts(counts);
    } catch (error) {
      console.error('리드수 로드 오류:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await api.get('/api/folders');
      if (response.data.success) {
        setFolders(response.data.data);
      }
    } catch (error) {
      console.error('폴더 로드 오류:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  const handleLaunch = async (id) => {
    try {
      setLaunching({ ...launching, [id]: true });
      await api.post(`/api/workflows/${id}/launch`);
      // 즉시 로컬 상태 업데이트 (실시간 반영)
      setLocalWorkflowStates(prev => ({ ...prev, [id]: true }));
    } catch (error) {
      alert('런칭에 실패했습니다.');
    } finally {
      setLaunching({ ...launching, [id]: false });
    }
  };

  const handleStop = async (id) => {
    try {
      setLaunching({ ...launching, [id]: true });
      await api.post(`/api/workflows/${id}/stop`);
      // 즉시 로컬 상태 업데이트 (실시간 반영)
      setLocalWorkflowStates(prev => ({ ...prev, [id]: false }));
    } catch (error) {
      alert('중지에 실패했습니다.');
    } finally {
      setLaunching({ ...launching, [id]: false });
    }
  };

  // 워크플로우의 실제 상태 (로컬 오버라이드 적용)
  const getWorkflowLaunchedState = (workflow) => {
    if (localWorkflowStates.hasOwnProperty(workflow.id)) {
      return localWorkflowStates[workflow.id];
    }
    return workflow.is_launched;
  };

  const handleDuplicate = async (workflow) => {
    try {
      const response = await api.post(`/api/workflows/${workflow.id}/duplicate`);
      if (response.data.success && response.data.id) {
        // 복제된 워크플로우를 수정 모드로 열기
        onRefresh && onRefresh();
        // 약간의 딜레이 후 수정 모드로 열기
        setTimeout(async () => {
          const newWorkflow = await api.get(`/api/workflows/${response.data.id}`);
          if (newWorkflow.data.success) {
            onEdit(newWorkflow.data.data);
          }
        }, 300);
      }
    } catch (error) {
      alert('복제에 실패했습니다.');
    }
  };

  const getFolderName = (folderId) => {
    if (!folderId) return '-';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : '-';
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.post('/api/folders', { name: newFolderName });
      await loadFolders();
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (error) {
      alert('폴더 생성에 실패했습니다.');
    }
  };

  const handleSaveGoal = async () => {
    if (!selectedWorkflow) return;
    try {
      await api.put(`/api/workflows/${selectedWorkflow.id}/goal`, {
        goal_type: goalType,
        goal_target: goalTarget
      });
      onRefresh && onRefresh();
      setShowGoalModal(false);
    } catch (error) {
      alert('목표 저장에 실패했습니다.');
    }
  };

  const handleMoveToFolder = async () => {
    if (!selectedWorkflow) return;
    try {
      await api.put(`/api/workflows/${selectedWorkflow.id}/folder`, {
        folder_id: targetFolderId
      });
      onRefresh && onRefresh();
      setShowMoveModal(false);
    } catch (error) {
      alert('이동에 실패했습니다.');
    }
  };

  const openGoalModal = (workflow) => {
    setSelectedWorkflow(workflow);
    setGoalType(workflow.goal_type || 'conversion');
    setGoalTarget(workflow.goal_target || 0);
    setShowGoalModal(true);
  };

  const openMoveModal = (workflow) => {
    setSelectedWorkflow(workflow);
    setTargetFolderId(workflow.folder_id);
    setShowMoveModal(true);
  };

  const getConditionsSummary = (workflow) => {
    if (!workflow.conditions) {
      return workflow.event_name ? `이벤트: ${workflow.event_name}` : '-';
    }
    try {
      const conditions = JSON.parse(workflow.conditions);
      const types = conditions.map(c => c.type === 'list' ? '리스트' : '이벤트');
      return [...new Set(types)].join('+') || '-';
    } catch {
      return '-';
    }
  };

  const getActionsSummary = (workflow) => {
    if (!workflow.actions) {
      return workflow.webhook_url ? '웹훅' : '-';
    }
    try {
      const actions = JSON.parse(workflow.actions);
      const types = actions.map(a => a.type === 'list' ? '리스트' : '웹훅');
      return [...new Set(types)].join('+') || '-';
    } catch {
      return '-';
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(w => {
      if (statusFilter === 'live' && !w.is_launched) return false;
      if (statusFilter === 'draft' && w.is_launched) return false;
      if (selectedFolder !== 'all') {
        if (selectedFolder === 'none' && w.folder_id) return false;
        if (selectedFolder !== 'none' && w.folder_id !== parseInt(selectedFolder)) return false;
      }
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  return (
    <div className="workflow-list">
      {/* Toolbar */}
      <div className="workflow-toolbar">
        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="live">라이브</option>
            <option value="draft">초안</option>
          </select>

          <select
            className="filter-select"
            value={selectedFolder}
            onChange={e => setSelectedFolder(e.target.value)}
          >
            <option value="all">전체 폴더</option>
            <option value="none">폴더 없음</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <input
            type="text"
            className="search-input"
            placeholder="워크플로우 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <button className="btn-secondary btn-sm" onClick={() => setShowFolderModal(true)}>
            + 새 폴더
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredWorkflows.length === 0 ? (
        <div className="empty-state">
          <p>워크플로우가 없습니다.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>폴더</th>
                <th onClick={() => handleSort('name')} className="sortable">
                  이름 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>조건</th>
                <th>액션</th>
                <th>상태</th>
                <th>리드수</th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  생성일 {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td className="folder-cell">
                    <span className="folder-badge">{getFolderName(workflow.folder_id)}</span>
                  </td>
                  <td className="name-cell">
                    <span className="workflow-name">{workflow.name || '(이름 없음)'}</span>
                  </td>
                  <td className="summary-cell">{getConditionsSummary(workflow)}</td>
                  <td className="summary-cell">{getActionsSummary(workflow)}</td>
                  <td>
                    <span className={`status-badge ${getWorkflowLaunchedState(workflow) ? 'live' : 'draft'}`}>
                      {getWorkflowLaunchedState(workflow) ? '라이브' : '초안'}
                    </span>
                  </td>
                  <td className="lead-count-cell">
                    <span className="lead-count">{leadCounts[workflow.id] ?? '-'}</span>
                  </td>
                  <td className="date-cell">{formatDate(workflow.created_at)}</td>
                  <td className="actions-cell">
                    {/* 버튼 그룹: 수정, 런칭/중지, 복제 */}
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" onClick={() => onEdit(workflow)} title="수정">
                        수정
                      </button>
                      {getWorkflowLaunchedState(workflow) ? (
                        <button
                          className="btn-action btn-stop"
                          onClick={() => handleStop(workflow.id)}
                          disabled={launching[workflow.id]}
                          title="중지"
                        >
                          {launching[workflow.id] ? '...' : '중지'}
                        </button>
                      ) : (
                        <button
                          className="btn-action btn-launch"
                          onClick={() => handleLaunch(workflow.id)}
                          disabled={launching[workflow.id]}
                          title="런칭"
                        >
                          {launching[workflow.id] ? '...' : '런칭'}
                        </button>
                      )}
                      <button className="btn-action btn-duplicate" onClick={() => handleDuplicate(workflow)} title="복제">
                        복제
                      </button>
                    </div>

                    {/* 드롭다운 메뉴: 목표, 폴더이동, 삭제 */}
                    <div className="dropdown-container" ref={openDropdown === workflow.id ? dropdownRef : null}>
                      <button
                        className="btn-action btn-more"
                        onClick={() => setOpenDropdown(openDropdown === workflow.id ? null : workflow.id)}
                      >
                        ⋯
                      </button>
                      {openDropdown === workflow.id && (
                        <div className="dropdown-menu">
                          <button onClick={() => { openGoalModal(workflow); setOpenDropdown(null); }}>
                            🎯 목표 설정
                          </button>
                          <button onClick={() => { openMoveModal(workflow); setOpenDropdown(null); }}>
                            📁 폴더 이동
                          </button>
                          <button className="danger" onClick={() => { onDelete(workflow.id); setOpenDropdown(null); }}>
                            🗑️ 삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>새 폴더 만들기</h3>
            <div className="form-group">
              <label>폴더 이름</label>
              <input
                type="text"
                className="form-control"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="폴더 이름"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowFolderModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleCreateFolder}>생성</button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>워크플로우 목표</h3>
            <div className="form-group">
              <label>목표 유형</label>
              <select
                className="form-control"
                value={goalType}
                onChange={e => setGoalType(e.target.value)}
              >
                <option value="conversion">전환</option>
                <option value="signup">가입</option>
                <option value="engagement">참여</option>
              </select>
            </div>
            <div className="form-group">
              <label>목표 수치</label>
              <input
                type="number"
                className="form-control"
                value={goalTarget}
                onChange={e => setGoalTarget(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            {selectedWorkflow && selectedWorkflow.goal_target > 0 && (
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (selectedWorkflow.goal_current / selectedWorkflow.goal_target) * 100)}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {selectedWorkflow.goal_current}/{selectedWorkflow.goal_target}
                  ({Math.round((selectedWorkflow.goal_current / selectedWorkflow.goal_target) * 100)}%)
                </span>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowGoalModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleSaveGoal}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Folder Modal */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>폴더로 이동</h3>
            <div className="form-group">
              <label>폴더 선택</label>
              <select
                className="form-control"
                value={targetFolderId || ''}
                onChange={e => setTargetFolderId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">폴더 없음</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowMoveModal(false)}>취소</button>
              <button className="btn-primary" onClick={handleMoveToFolder}>이동</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowList;
