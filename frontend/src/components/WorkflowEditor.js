import React, { useState, useEffect } from 'react';
import api from '../api';
import ConditionBuilder from './ConditionBuilder';
import ActionBuilder from './ActionBuilder';
import ConditionGroup from './ConditionGroup';
import LogicToggle from './LogicToggle';
import './WorkflowEditor.css';

function WorkflowEditor({ workflow, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [conditionGroups, setConditionGroups] = useState([]);
  const [groupLogic, setGroupLogic] = useState('AND');
  const [actions, setActions] = useState([]);
  const [conditionSettings, setConditionSettings] = useState({
    addCurrentLeads: true,
    onlyFirstTime: true
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalGroups, setGoalGroups] = useState([]);
  const [goalGroupLogic, setGoalGroupLogic] = useState('AND');
  const [lists, setLists] = useState([]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);

      // 새 형식 (condition_groups)
      if (workflow.condition_groups) {
        try {
          const parsedGroups = typeof workflow.condition_groups === 'string'
            ? JSON.parse(workflow.condition_groups)
            : workflow.condition_groups;
          setConditionGroups(parsedGroups);
        } catch (e) {
          setConditionGroups([]);
        }
        setGroupLogic(workflow.group_logic || 'AND');

        try {
          const parsedActions = typeof workflow.actions === 'string'
            ? JSON.parse(workflow.actions)
            : workflow.actions;
          setActions(parsedActions || []);
        } catch (e) {
          setActions([]);
        }
      }
      // 기존 형식 (conditions 배열) → 단일 그룹으로 마이그레이션
      else if (workflow.conditions) {
        try {
          const parsedConditions = typeof workflow.conditions === 'string'
            ? JSON.parse(workflow.conditions)
            : workflow.conditions;

          // 기존 조건들을 하나의 그룹으로 래핑
          setConditionGroups([{
            id: Date.now(),
            logic: workflow.condition_logic || 'AND',
            conditions: parsedConditions
          }]);
          setGroupLogic('AND');
        } catch (e) {
          setConditionGroups([]);
        }

        try {
          const parsedActions = typeof workflow.actions === 'string'
            ? JSON.parse(workflow.actions)
            : workflow.actions;
          // step 번호 부여
          setActions((parsedActions || []).map((a, i) => ({ ...a, step: i + 1 })));
        } catch (e) {
          setActions([]);
        }
      }
      // 레거시 형식 (event_name 단일 필드)
      else if (workflow.event_name) {
        setConditionGroups([{
          id: Date.now(),
          logic: 'AND',
          conditions: [{
            type: 'custom_event',
            event_name: workflow.event_name,
            filter: workflow.filter || '존재하는',
            frequency: workflow.frequency || 1,
            frequency_period: workflow.frequency_period || '기간과 상관없이'
          }]
        }]);
        setGroupLogic('AND');

        if (workflow.webhook_url) {
          setActions([{
            step: 1,
            type: 'webhook',
            webhook_url: workflow.webhook_url,
            webhook_params: workflow.webhook_params || {}
          }]);
        } else {
          setActions([]);
        }
      } else {
        setConditionGroups([]);
        setActions([]);
      }
    } else {
      // 새 워크플로우: 빈 상태로 시작
      setConditionGroups([]);
      setActions([]);
    }

    // 조건 설정 로드
    if (workflow?.condition_settings) {
      try {
        const parsedSettings = typeof workflow.condition_settings === 'string'
          ? JSON.parse(workflow.condition_settings)
          : workflow.condition_settings;
        setConditionSettings(parsedSettings);
      } catch (e) {
        setConditionSettings({ addCurrentLeads: true, onlyFirstTime: true });
      }
    }

    // 목표 조건 그룹 로드
    if (workflow?.goal_groups) {
      try {
        const parsedGoalGroups = typeof workflow.goal_groups === 'string'
          ? JSON.parse(workflow.goal_groups)
          : workflow.goal_groups;
        setGoalGroups(parsedGoalGroups || []);
      } catch (e) {
        setGoalGroups([]);
      }
      setGoalGroupLogic(workflow.goal_group_logic || 'AND');
    }
  }, [workflow]);

  // 리스트 로드
  useEffect(() => {
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
    loadLists();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('워크플로우 이름을 입력하세요.');
      return;
    }

    // 조건 검증: 최소 하나의 그룹에 조건이 있어야 함
    const hasConditions = conditionGroups.some(g => g.conditions && g.conditions.length > 0);
    if (!hasConditions) {
      alert('최소 하나의 조건을 추가하세요.');
      return;
    }

    if (actions.length === 0) {
      alert('최소 하나의 액션을 추가하세요.');
      return;
    }

    try {
      // 하위 호환성을 위해 기존 필드도 유지
      const firstCondition = conditionGroups[0]?.conditions?.[0];
      const firstWebhook = actions.find(a => a.type === 'webhook');

      const data = {
        name,
        // 새 형식
        condition_groups: JSON.stringify(conditionGroups),
        group_logic: groupLogic,
        actions: JSON.stringify(actions),
        // 조건 설정
        condition_settings: JSON.stringify(conditionSettings),
        // 목표 조건 그룹
        goal_groups: JSON.stringify(goalGroups),
        goal_group_logic: goalGroupLogic,
        // 기존 형식도 유지 (하위 호환)
        conditions: JSON.stringify(conditionGroups.flatMap(g => g.conditions || [])),
        condition_logic: conditionGroups[0]?.logic || 'AND',
        // 레거시 필드
        event_name: firstCondition?.type === 'custom_event' ? firstCondition.event_name : null,
        filter: firstCondition?.type === 'custom_event' ? firstCondition.filter : null,
        frequency: firstCondition?.type === 'custom_event' ? firstCondition.frequency : 1,
        frequency_period: firstCondition?.type === 'custom_event' ? firstCondition.frequency_period : '기간과 상관없이',
        webhook_url: firstWebhook?.webhook_url || null,
        webhook_params: firstWebhook?.webhook_params || null
      };

      if (workflow) {
        await api.put(`/api/workflows/${workflow.id}`, {
          ...data,
          is_launched: workflow.is_launched || 0
        });
      } else {
        await api.post('/api/workflows', data);
      }

      onSave();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  return (
    <div className="workflow-editor">
      <div className="editor-header">
        <h2>{workflow ? '워크플로우 수정' : '새 워크플로우'}</h2>
        <div>
          <button className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="form-group">
          <label>워크플로우 이름</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 주문완료 알림톡 발송"
          />
        </div>

        <ConditionBuilder
          conditionGroups={conditionGroups}
          groupLogic={groupLogic}
          onGroupsChange={setConditionGroups}
          onGroupLogicChange={setGroupLogic}
          conditionSettings={conditionSettings}
          onConditionSettingsChange={setConditionSettings}
          onOpenGoalModal={() => setShowGoalModal(true)}
        />

        <ActionBuilder
          actions={actions}
          onActionsChange={setActions}
        />
      </div>

      {/* 목표 설정 모달 */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="goal-modal" onClick={e => e.stopPropagation()}>
            <div className="goal-modal-header">
              <h3>목표 조건 설정</h3>
              <button className="modal-close" onClick={() => setShowGoalModal(false)}>×</button>
            </div>
            <div className="goal-modal-body">
              <p className="goal-description">
                리드가 아래 목표 조건을 충족하면 워크플로우의 액션을 더 이상 수행하지 않습니다.
              </p>

              <div className="goal-builder">
                <div className="goal-header">
                  <span className="goal-number">목표</span>
                  <span className="goal-title">조건</span>
                </div>

                <div className="goal-content">
                  {goalGroups.length === 0 ? (
                    <div className="empty-state">
                      목표 조건 그룹이 없습니다. 아래 버튼으로 그룹을 추가하세요.
                    </div>
                  ) : (
                    goalGroups.map((group, index) => (
                      <React.Fragment key={group.id || index}>
                        {index > 0 && (
                          <div className="group-logic-separator">
                            <LogicToggle
                              value={goalGroupLogic}
                              onChange={setGoalGroupLogic}
                            />
                          </div>
                        )}
                        <ConditionGroup
                          group={group}
                          groupIndex={index}
                          lists={lists}
                          onUpdate={(updated) => {
                            const newGroups = [...goalGroups];
                            newGroups[index] = updated;
                            setGoalGroups(newGroups);
                          }}
                          onRemove={() => {
                            setGoalGroups(goalGroups.filter((_, i) => i !== index));
                          }}
                          isOnly={goalGroups.length === 1}
                        />
                      </React.Fragment>
                    ))
                  )}

                  <div className="add-buttons">
                    <button
                      className="btn-add"
                      onClick={() => {
                        const newGroup = {
                          id: Date.now(),
                          logic: 'AND',
                          conditions: []
                        };
                        setGoalGroups([...goalGroups, newGroup]);
                      }}
                    >
                      <span className="btn-icon">+</span>
                      새 그룹 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="goal-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={() => setShowGoalModal(false)}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowEditor;
