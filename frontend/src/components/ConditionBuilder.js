import React, { useState, useEffect } from 'react';
import api from '../api';
import ConditionGroup from './ConditionGroup';
import LogicToggle from './LogicToggle';
import './ConditionBuilder.css';

function ConditionBuilder({
  conditionGroups,
  groupLogic,
  onGroupsChange,
  onGroupLogicChange,
  // 조건 설정 옵션
  conditionSettings,
  onConditionSettingsChange,
  // 목표 설정 모달
  onOpenGoalModal
}) {
  const [lists, setLists] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [matchingLeads, setMatchingLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // 기본 설정값
  const settings = conditionSettings || {
    addCurrentLeads: false,      // 현재 조건을 충족하는 리드 추가 (기본값: 해제)
    onlyFirstTime: true,         // 최초 충족 시에만 추가 (기본값: 체크)
    enableGoal: false            // 목표 설정 (기본값: 해제)
  };

  const handleSettingChange = (key, value) => {
    onConditionSettingsChange && onConditionSettingsChange({
      ...settings,
      [key]: value
    });
  };

  // 조건을 만족하는 리드 조회
  const loadMatchingLeads = async () => {
    setLoadingLeads(true);
    try {
      // 리스트 조건에서 리드 가져오기
      const listIds = [];
      conditionGroups.forEach(group => {
        (group.conditions || []).forEach(cond => {
          if (cond.type === 'list' && cond.list_id) {
            listIds.push(cond.list_id);
          }
        });
      });

      if (listIds.length > 0) {
        const leads = [];
        for (const listId of listIds) {
          const response = await api.get(`/api/lists/${listId}/members`);
          if (response.data.success) {
            leads.push(...response.data.data);
          }
        }
        // 중복 제거
        const uniqueLeads = leads.reduce((acc, lead) => {
          if (!acc.find(l => l.lead_email === lead.lead_email)) {
            acc.push(lead);
          }
          return acc;
        }, []);
        setMatchingLeads(uniqueLeads);
      } else {
        setMatchingLeads([]);
      }
    } catch (error) {
      console.error('리드 조회 오류:', error);
    } finally {
      setLoadingLeads(false);
    }
    setShowLeadsModal(true);
  };

  useEffect(() => {
    loadLists();
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

  const addGroup = () => {
    const newGroup = {
      id: Date.now(),
      logic: 'AND',
      conditions: []
    };
    onGroupsChange([...conditionGroups, newGroup]);
  };

  const updateGroup = (index, updatedGroup) => {
    const newGroups = [...conditionGroups];
    newGroups[index] = updatedGroup;
    onGroupsChange(newGroups);
  };

  const removeGroup = (index) => {
    const newGroups = conditionGroups.filter((_, i) => i !== index);
    onGroupsChange(newGroups);
  };

  return (
    <div className="condition-builder">
      <div className="builder-header">
        <span className="builder-number">1</span>
        <span className="builder-title">조건</span>
      </div>

      <div className="builder-content">
        {conditionGroups.length === 0 ? (
          <div className="empty-state">
            조건 그룹이 없습니다. 아래 버튼으로 그룹을 추가하세요.
          </div>
        ) : (
          conditionGroups.map((group, index) => (
            <React.Fragment key={group.id || index}>
              {index > 0 && (
                <div className="group-logic-separator">
                  <LogicToggle
                    value={groupLogic}
                    onChange={onGroupLogicChange}
                  />
                </div>
              )}
              <ConditionGroup
                group={group}
                groupIndex={index}
                lists={lists}
                onUpdate={(updated) => updateGroup(index, updated)}
                onRemove={() => removeGroup(index)}
                isOnly={conditionGroups.length === 1}
              />
            </React.Fragment>
          ))
        )}

        <div className="add-buttons">
          <button className="btn-add" onClick={addGroup}>
            <span className="btn-icon">+</span>
            새 그룹 추가
          </button>
        </div>

        {/* 조건 설정 토글 버튼 */}
        <div className="condition-settings">
          <button
            className={`btn-settings-toggle ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <span className="toggle-icon">{showSettings ? '▼' : '▶'}</span>
            조건 설정
          </button>

          {showSettings && (
            <div className="settings-options">
              {/* 옵션 1: 현재 조건을 충족하는 리드 추가 */}
              <div className="setting-option">
                <label className="setting-checkbox-compact">
                  <input
                    type="checkbox"
                    checked={settings.addCurrentLeads}
                    onChange={(e) => handleSettingChange('addCurrentLeads', e.target.checked)}
                  />
                  <span>현재 이 조건들을 충족시키는 리드를 워크플로우에 더하기</span>
                </label>
                <span
                  className="leads-check-link"
                  onClick={loadMatchingLeads}
                >
                  {loadingLeads ? '확인 중...' : '현재 몇 명의 리드가 이 조건을 충족시키는지 확인하기'}
                </span>
              </div>

              {/* 옵션 2: 최초 충족시에만 추가 */}
              <div className="setting-option">
                <label className="setting-checkbox-compact">
                  <input
                    type="checkbox"
                    checked={settings.onlyFirstTime}
                    onChange={(e) => handleSettingChange('onlyFirstTime', e.target.checked)}
                  />
                  <span>리드가 최초로 조건을 충족시킬 때만 워크플로우에 더하기</span>
                </label>
                {!settings.onlyFirstTime && (
                  <span className="setting-warning">
                    이 부분을 체크하지 않으면, 리드가 조건을 충족할 때 마다 워크플로우에 추가됩니다
                  </span>
                )}
              </div>

              {/* 옵션 3: 목표 설정 */}
              <div className="setting-option">
                <label className="setting-checkbox-compact">
                  <input
                    type="checkbox"
                    checked={settings.enableGoal}
                    onChange={(e) => handleSettingChange('enableGoal', e.target.checked)}
                  />
                  <span>목표 설정하기</span>
                </label>
                <span className="setting-description">
                  목표를 사용하여 워크플로우의 성공 여부를 판단하기
                </span>
                {settings.enableGoal && (
                  <button className="btn-goal-setting" onClick={onOpenGoalModal}>
                    목표 조건 설정
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 리드 확인 팝업 모달 */}
        {showLeadsModal && (
          <div className="modal-overlay" onClick={() => setShowLeadsModal(false)}>
            <div className="leads-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>조건을 충족하는 리드 ({matchingLeads.length}명)</h3>
                <button className="modal-close" onClick={() => setShowLeadsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {matchingLeads.length === 0 ? (
                  <p className="no-leads">조건을 충족하는 리드가 없습니다.</p>
                ) : (
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>이메일</th>
                        <th>이름</th>
                        <th>전화번호</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchingLeads.map((lead, idx) => (
                        <tr key={idx}>
                          <td>{lead.lead_email}</td>
                          <td>{lead.first_name || '-'}</td>
                          <td>{lead.phone_number || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConditionBuilder;
