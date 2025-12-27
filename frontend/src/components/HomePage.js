import React from 'react';
import './HomePage.css';

function HomePage({ onNavigate }) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>마케팅 자동화 플랫폼</h1>
        <p>효율적인 마케팅 자동화 도구를 선택하세요</p>
      </div>

      <div className="home-menu-grid">
        <div 
          className="menu-card"
          onClick={() => onNavigate('marketing-automation')}
        >
          <div className="menu-card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>마케팅자동화</h2>
          <p>GTM 이벤트를 웹훅으로 자동 전달하는 워크플로우 시스템</p>
          <div className="menu-card-arrow">→</div>
        </div>

        <div 
          className="menu-card"
          onClick={() => onNavigate('ai-bot')}
        >
          <div className="menu-card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
          </div>
          <h2>AI 알림봇</h2>
          <p>쇼핑몰 주문 알림톡 자동 발송 서비스</p>
          <div className="menu-card-arrow">→</div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

