import React from 'react';
import './LogicToggle.css';

function LogicToggle({ value, onChange }) {
  return (
    <div className="logic-toggle">
      <button
        className={`logic-btn ${value === 'AND' ? 'active' : ''}`}
        onClick={() => onChange('AND')}
      >
        AND
      </button>
      <button
        className={`logic-btn ${value === 'OR' ? 'active' : ''}`}
        onClick={() => onChange('OR')}
      >
        OR
      </button>
    </div>
  );
}

export default LogicToggle;
