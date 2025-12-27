import React from 'react';
import './ConditionItem.css';

function ListAction({ action, lists, onChange, onRemove }) {
  return (
    <div className="action-item list-action">
      <div className="action-header">
        <span className="action-icon">📋</span>
        <span className="action-title">리스트</span>
        <button className="btn-remove" onClick={onRemove}>×</button>
      </div>

      <div className="action-body">
        <div className="form-group">
          <label>액션</label>
          <select
            className="form-control"
            value={action.action}
            onChange={(e) => onChange({ ...action, action: e.target.value })}
          >
            <option value="add">추가하기</option>
            <option value="remove">제거하기</option>
          </select>
        </div>

        <div className="form-group">
          <label>리스트</label>
          <select
            className="form-control"
            value={action.list_id || ''}
            onChange={(e) => onChange({
              ...action,
              list_id: e.target.value ? parseInt(e.target.value) : null
            })}
          >
            <option value="">-- 리스트를 선택하세요 --</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.member_count || 0}명)
              </option>
            ))}
          </select>
        </div>

        <div className="action-info">
          {action.action === 'add'
            ? '조건을 만족하는 리드를 선택한 리스트에 추가합니다.'
            : '조건을 만족하는 리드를 선택한 리스트에서 제거합니다.'}
        </div>
      </div>
    </div>
  );
}

export default ListAction;
