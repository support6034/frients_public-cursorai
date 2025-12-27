import React from 'react';
import ListCondition from './ListCondition';
import CustomEventCondition from './CustomEventCondition';
import LogicToggle from './LogicToggle';
import './ConditionGroup.css';

function ConditionGroup({
  group,
  groupIndex,
  lists,
  onUpdate,
  onRemove,
  isOnly
}) {
  const addCondition = (type) => {
    const newCondition = type === 'list'
      ? { type: 'list', filter: 'in_list', list_id: null }
      : { type: 'custom_event', event_name: '', filter: '존재하는', frequency: 1, frequency_period: '기간과 상관없이' };

    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition]
    });
  };

  const updateCondition = (index, updatedCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedCondition;
    onUpdate({ ...group, conditions: newConditions });
  };

  const removeCondition = (index) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({ ...group, conditions: newConditions });
  };

  const handleLogicChange = (newLogic) => {
    onUpdate({ ...group, logic: newLogic });
  };

  return (
    <div className="condition-group">
      <div className="group-header">
        <span className="group-label">그룹 {groupIndex + 1}</span>
        {!isOnly && (
          <button className="btn-remove-group" onClick={onRemove}>
            그룹 삭제
          </button>
        )}
      </div>

      <div className="group-content">
        {group.conditions.length === 0 ? (
          <div className="group-empty">
            조건을 추가하세요
          </div>
        ) : (
          group.conditions.map((condition, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className="group-logic-toggle">
                  <LogicToggle
                    value={group.logic}
                    onChange={handleLogicChange}
                  />
                </div>
              )}
              {condition.type === 'list' ? (
                <ListCondition
                  condition={condition}
                  lists={lists}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                />
              ) : (
                <CustomEventCondition
                  condition={condition}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                />
              )}
            </React.Fragment>
          ))
        )}

        <div className="group-add-buttons">
          <button
            className="btn-add-small"
            onClick={() => addCondition('list')}
          >
            + 리스트
          </button>
          <button
            className="btn-add-small"
            onClick={() => addCondition('custom_event')}
          >
            + 이벤트
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConditionGroup;
