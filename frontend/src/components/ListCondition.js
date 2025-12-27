import React from 'react';
import './ConditionItem.css';

function ListCondition({ condition, lists, onChange, onRemove }) {
  return (
    <div className="condition-item list-condition">
      <div className="condition-header">
        <span className="condition-icon">📋</span>
        <span className="condition-title">리스트</span>
        <button className="btn-remove" onClick={onRemove}>×</button>
      </div>

      <div className="condition-body">
        <div className="form-group">
          <label>필터</label>
          <select
            className="form-control"
            value={condition.filter}
            onChange={(e) => onChange({ ...condition, filter: e.target.value })}
          >
            <option value="in_list">다음 리스트에 속한 리드</option>
            <option value="not_in_list">다음 리스트에 속하지 않는 리드</option>
          </select>
        </div>

        <div className="form-group">
          <label>리스트</label>
          <select
            className="form-control"
            value={condition.list_id || ''}
            onChange={(e) => onChange({
              ...condition,
              list_id: e.target.value ? parseInt(e.target.value) : null
            })}
          >
            <option value="">Any List (모든 리스트)</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.member_count || 0}명)
              </option>
            ))}
          </select>
        </div>

        <div className="condition-info">
          대상: 조건을 만족하는 모든 리드
        </div>
      </div>
    </div>
  );
}

export default ListCondition;
