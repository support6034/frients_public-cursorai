import React, { useState, useEffect } from 'react';
import api from '../api';
import WorkflowList from './WorkflowList';
import WorkflowEditor from './WorkflowEditor';
import LogViewer from './LogViewer';
import ListManager from './ListManager';

function MarketingAutomation() {
  const [workflows, setWorkflows] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [activeTab, setActiveTab] = useState('workflows');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await api.get('/api/workflows');
      if (response.data.success) {
        setWorkflows(response.data.data);
      }
    } catch (error) {
      console.error('워크플로우 로드 오류:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setShowEditor(true);
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await api.delete(`/api/workflows/${id}`);
        loadWorkflows();
      } catch (error) {
        console.error('삭제 오류:', error);
      }
    }
  };

  const handleSave = () => {
    setShowEditor(false);
    loadWorkflows();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingWorkflow(null);
  };

  const renderContent = () => {
    if (showEditor) {
      return (
        <WorkflowEditor
          workflow={editingWorkflow}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }

    switch (activeTab) {
      case 'workflows':
        return (
          <>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={handleCreateNew}>
                + 새 워크플로우 만들기
              </button>
            </div>
            <WorkflowList
              workflows={workflows}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        );
      case 'lists':
        return <ListManager />;
      case 'logs':
        return <LogViewer />;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="App-header">
        <h1>워크플로우 자동화 시스템</h1>
        <p>GTM 이벤트 → 웹훅 발동</p>
      </header>

      {!showEditor && (
        <nav className="App-nav">
          <button
            className={`nav-btn ${activeTab === 'workflows' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflows')}
          >
            워크플로우
          </button>
          <button
            className={`nav-btn ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            리스트 관리
          </button>
          <button
            className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            로그
          </button>
        </nav>
      )}

      <div className="container">
        {renderContent()}
      </div>
    </>
  );
}

export default MarketingAutomation;

