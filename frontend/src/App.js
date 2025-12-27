import React, { useState } from 'react';
import HomePage from './components/HomePage';
import MarketingAutomation from './components/MarketingAutomation';
import AIBot from './components/AIBot';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'marketing-automation':
        return <MarketingAutomation />;
      case 'ai-bot':
        return <AIBot />;
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App">
      {/* 상위 메뉴 */}
      <nav className="App-top-menu">
        <div className="top-menu-container">
          <button
            className={`top-menu-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            홈
          </button>
          <button
            className={`top-menu-btn ${currentPage === 'marketing-automation' ? 'active' : ''}`}
            onClick={() => setCurrentPage('marketing-automation')}
          >
            마케팅자동화
          </button>
          <button
            className={`top-menu-btn ${currentPage === 'ai-bot' ? 'active' : ''}`}
            onClick={() => setCurrentPage('ai-bot')}
          >
            AI 알림봇
          </button>
        </div>
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;
