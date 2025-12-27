-- PostgreSQL 스키마 생성 스크립트
-- SQLite에서 PostgreSQL로 마이그레이션

-- 워크플로우 테이블
CREATE TABLE IF NOT EXISTS workflows (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    filter TEXT,
    frequency INTEGER DEFAULT 1,
    frequency_period VARCHAR(50),
    webhook_url TEXT NOT NULL,
    webhook_params TEXT,
    is_launched BOOLEAN DEFAULT false,
    conditions TEXT,
    actions TEXT,
    condition_logic VARCHAR(10) DEFAULT 'AND',
    action_logic VARCHAR(10) DEFAULT 'AND',
    condition_groups TEXT,
    group_logic VARCHAR(10) DEFAULT 'AND',
    condition_settings TEXT,
    goal_groups TEXT,
    goal_group_logic VARCHAR(10) DEFAULT 'AND',
    folder_id BIGINT,
    goal_type VARCHAR(50),
    goal_target INTEGER,
    goal_current INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 테스트 리드 테이블
CREATE TABLE IF NOT EXISTS test_leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(50),
    custom_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 이벤트 로그 테이블
CREATE TABLE IF NOT EXISTS event_logs (
    id BIGSERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_data TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_logs_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_received ON event_logs(received_at DESC);

-- 워크플로우 실행 로그 테이블
CREATE TABLE IF NOT EXISTS workflow_executions (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT,
    event_id BIGINT,
    webhook_response TEXT,
    status VARCHAR(50),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES event_logs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_event ON workflow_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed ON workflow_executions(executed_at DESC);

-- 리스트 테이블
CREATE TABLE IF NOT EXISTS lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    goal_count INTEGER DEFAULT 0,
    goal_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 리스트 멤버 테이블
CREATE TABLE IF NOT EXISTS list_members (
    id BIGSERIAL PRIMARY KEY,
    list_id BIGINT NOT NULL,
    lead_email VARCHAR(255) NOT NULL,
    lead_data TEXT,
    first_name VARCHAR(255),
    phone_number VARCHAR(50),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    UNIQUE(list_id, lead_email)
);

CREATE INDEX IF NOT EXISTS idx_list_members_email ON list_members(lead_email);
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_name ON list_members(first_name);

-- 워크플로우 폴더 테이블
CREATE TABLE IF NOT EXISTS workflow_folders (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES workflow_folders(id) ON DELETE CASCADE
);

-- 워크플로우별 처리된 리드 추적 테이블
CREATE TABLE IF NOT EXISTS workflow_processed_leads (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    lead_email VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    UNIQUE(workflow_id, lead_email)
);

CREATE INDEX IF NOT EXISTS idx_processed_leads_workflow ON workflow_processed_leads(workflow_id);
CREATE INDEX IF NOT EXISTS idx_processed_leads_email ON workflow_processed_leads(lead_email);

-- AI 알림봇 설정 테이블
CREATE TABLE IF NOT EXISTS ai_bot_settings (
    id BIGSERIAL PRIMARY KEY,
    industry VARCHAR(50) NOT NULL DEFAULT 'shopping',
    payment_config TEXT,
    integration_config TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 알림봇 템플릿 선택 테이블
CREATE TABLE IF NOT EXISTS ai_bot_templates (
    id BIGSERIAL PRIMARY KEY,
    industry VARCHAR(50) NOT NULL DEFAULT 'shopping',
    template_id INTEGER NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(industry, template_id)
);

-- 프렌츠 결제 잔액 테이블
CREATE TABLE IF NOT EXISTS payment_balance (
    id BIGSERIAL PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 프렌츠 충전 내역 테이블
CREATE TABLE IF NOT EXISTS payment_history (
    id BIGSERIAL PRIMARY KEY,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    imp_uid VARCHAR(255),
    merchant_uid VARCHAR(255),
    payment_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

-- GW/WF 디버그 로그 테이블
CREATE TABLE IF NOT EXISTS debug_logs (
    id BIGSERIAL PRIMARY KEY,
    component VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    action VARCHAR(255) NOT NULL,
    url TEXT,
    request_data TEXT,
    response_data TEXT,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_debug_logs_component ON debug_logs(component);
CREATE INDEX IF NOT EXISTS idx_debug_logs_created ON debug_logs(created_at DESC);

-- workflows 테이블에 folder_id 외래키 추가
ALTER TABLE workflows ADD CONSTRAINT fk_workflows_folder 
    FOREIGN KEY (folder_id) REFERENCES workflow_folders(id) ON DELETE SET NULL;

