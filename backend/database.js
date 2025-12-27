const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'workflow.db');
const db = new sqlite3.Database(dbPath);

// 데이터베이스 초기화
db.serialize(() => {
  // 워크플로우 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      event_name TEXT NOT NULL,
      filter TEXT,
      frequency INTEGER DEFAULT 1,
      frequency_period TEXT,
      webhook_url TEXT NOT NULL,
      webhook_params TEXT,
      is_launched BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 테스트 리드 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS test_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone_number TEXT,
      custom_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 이벤트 로그 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_data TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 워크플로우 실행 로그 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER,
      event_id INTEGER,
      webhook_response TEXT,
      status TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id),
      FOREIGN KEY (event_id) REFERENCES event_logs(id)
    )
  `);

  // 리스트 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 리스트 멤버 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS list_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      lead_email TEXT NOT NULL,
      lead_data TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      UNIQUE(list_id, lead_email)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_list_members_email ON list_members(lead_email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id)`);

  // 워크플로우 폴더 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS workflow_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES workflow_folders(id)
    )
  `);

  // list_members 테이블 확장 (마이그레이션)
  db.run(`ALTER TABLE list_members ADD COLUMN first_name TEXT`, (err) => {});
  db.run(`ALTER TABLE list_members ADD COLUMN phone_number TEXT`, (err) => {});
  db.run(`CREATE INDEX IF NOT EXISTS idx_list_members_name ON list_members(first_name)`);

  // lists 테이블 확장 (목표 기능)
  db.run(`ALTER TABLE lists ADD COLUMN goal_count INTEGER DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE lists ADD COLUMN goal_description TEXT`, (err) => {});

  // workflows 테이블에 새 컬럼 추가 (마이그레이션)
  db.run(`ALTER TABLE workflows ADD COLUMN conditions TEXT`, (err) => {
    // 이미 존재하면 무시
  });
  db.run(`ALTER TABLE workflows ADD COLUMN actions TEXT`, (err) => {
    // 이미 존재하면 무시
  });
  db.run(`ALTER TABLE workflows ADD COLUMN condition_logic TEXT DEFAULT 'AND'`, (err) => {
    // 이미 존재하면 무시
  });
  db.run(`ALTER TABLE workflows ADD COLUMN action_logic TEXT DEFAULT 'AND'`, (err) => {});

  // 2레이어 조건 그룹 컬럼 추가
  db.run(`ALTER TABLE workflows ADD COLUMN condition_groups TEXT`, (err) => {});
  db.run(`ALTER TABLE workflows ADD COLUMN group_logic TEXT DEFAULT 'AND'`, (err) => {});

  // 조건 설정 컬럼 추가
  db.run(`ALTER TABLE workflows ADD COLUMN condition_settings TEXT`, (err) => {});

  // 목표 조건 그룹 컬럼 추가
  db.run(`ALTER TABLE workflows ADD COLUMN goal_groups TEXT`, (err) => {});
  db.run(`ALTER TABLE workflows ADD COLUMN goal_group_logic TEXT DEFAULT 'AND'`, (err) => {});

  // workflows 테이블 폴더/목표 컬럼 추가
  db.run(`ALTER TABLE workflows ADD COLUMN folder_id INTEGER`, (err) => {});
  db.run(`ALTER TABLE workflows ADD COLUMN goal_type TEXT`, (err) => {});
  db.run(`ALTER TABLE workflows ADD COLUMN goal_target INTEGER`, (err) => {});
  db.run(`ALTER TABLE workflows ADD COLUMN goal_current INTEGER DEFAULT 0`, (err) => {});

  // 워크플로우별 처리된 리드 추적 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS workflow_processed_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      lead_email TEXT NOT NULL,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      UNIQUE(workflow_id, lead_email)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_processed_leads_workflow ON workflow_processed_leads(workflow_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_processed_leads_email ON workflow_processed_leads(lead_email)`);

  // AI 알림봇 설정 테이블 (ai_bot_settings - 기존 호환성 유지)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_bot_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industry TEXT NOT NULL DEFAULT 'shopping',
      payment_config TEXT,
      integration_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI 알림봇 템플릿 선택 테이블 (ai_bot_templates - 기존 호환성 유지)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_bot_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industry TEXT NOT NULL DEFAULT 'shopping',
      template_id INTEGER NOT NULL,
      template_name TEXT NOT NULL,
      is_selected BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(industry, template_id)
    )
  `);

  // AI 알림봇 설정 테이블 (ai_alimbot_settings - 새 용어)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_alimbot_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industry TEXT NOT NULL DEFAULT 'shopping',
      payment_config TEXT,
      integration_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI 알림봇 템플릿 선택 테이블 (ai_alimbot_templates - 새 용어)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_alimbot_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industry TEXT NOT NULL DEFAULT 'shopping',
      template_id INTEGER NOT NULL,
      template_name TEXT NOT NULL,
      is_selected BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(industry, template_id)
    )
  `);

  // 프렌츠 결제 잔액 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_balance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      balance INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 프렌츠 충전 내역 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      imp_uid TEXT,
      merchant_uid TEXT,
      payment_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // GW/WF 디버그 로그 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS debug_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component TEXT NOT NULL,
      direction TEXT NOT NULL,
      action TEXT NOT NULL,
      url TEXT,
      request_data TEXT,
      response_data TEXT,
      status TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_debug_logs_component ON debug_logs(component)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_debug_logs_created ON debug_logs(created_at DESC)`);
});

module.exports = db;
