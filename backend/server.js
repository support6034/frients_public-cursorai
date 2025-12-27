const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const db = require('./database');
const gateway = require('./gateway');
const aiAlimbotRouter = require('./routes/ai-alimbot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS 설정: 환경 변수로 허용할 origin 설정 가능
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['*']; // 기본값: 모든 origin 허용 (개발 환경)

app.use(cors({
  origin: function (origin, callback) {
    // 개발 환경 또는 모든 origin 허용
    if (allowedOrigins.includes('*') || !origin) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 헬스체크 엔드포인트 (Render 콜드 스타트 대응)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Workflow Automation API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      lists: '/api/lists',
      workflows: '/api/workflows',
      events: '/api/events'
    }
  });
});

// 디버그 로그 저장 헬퍼 함수
function saveDebugLog(component, direction, action, url, requestData, responseData, status, errorMessage) {
  db.run(
    `INSERT INTO debug_logs (component, direction, action, url, request_data, response_data, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      component,
      direction,
      action,
      url || null,
      requestData ? JSON.stringify(requestData) : null,
      responseData ? JSON.stringify(responseData) : null,
      status || null,
      errorMessage || null
    ],
    (err) => {
      if (err) {
        console.error('디버그 로그 저장 오류:', err);
      }
    }
  );
}

// GTM으로부터 이벤트 수신 엔드포인트
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    const eventName = eventData.event;

    console.log('[WF] GTM 이벤트 수신:', eventName, eventData);

    // WF 디버그 로그 저장 (GTM 이벤트 수신)
    saveDebugLog(
      'WF',
      'IN',
      'GTM 이벤트 수신',
      '/api/events',
      eventData,
      null,
      'received',
      null
    );

    // 이벤트 로그 저장
    const eventId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO event_logs (event_name, event_data) VALUES (?, ?)',
        [eventName, JSON.stringify(eventData)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // 해당 이벤트에 매칭되고 런칭된 워크플로우 찾기
    db.all(
      'SELECT * FROM workflows WHERE is_launched = 1',
      [],
      async (err, workflows) => {
        if (err) {
          console.error('워크플로우 조회 오류:', err);
          return;
        }

        const leadEmail = eventData.email || eventData.lead_email;

        // 각 워크플로우 실행
        for (const workflow of workflows) {
          try {
            // 워크플로우 정규화 (하위 호환성)
            const normalized = normalizeWorkflow(workflow);

            // 조건 평가
            const conditionsMet = await evaluateConditions(
              normalized.conditions,
              normalized.condition_logic,
              leadEmail,
              eventData
            );

            if (conditionsMet) {
              console.log(`워크플로우 "${workflow.name}" 조건 충족, 액션 실행`);

              // 액션 실행
              await executeActions(
                normalized.actions,
                normalized.action_logic,
                leadEmail,
                eventData,
                workflow,
                eventId
              );
            }
          } catch (error) {
            console.error('워크플로우 실행 오류:', error);
          }
        }
      }
    );

    res.status(200).json({ success: true, eventId });
  } catch (error) {
    console.error('이벤트 처리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 워크플로우 실행 함수
async function executeWorkflow(workflow, eventData, eventId) {
  try {
    // 웹훅 파라미터 파싱
    const webhookParams = JSON.parse(workflow.webhook_params || '{}');

    // 알림봇 API인 경우 형식 변환, 아니면 기존 방식
    let processedParams;
    if (workflow.webhook_url && workflow.webhook_url.includes('alimbot.com')) {
      processedParams = transformToAlimbotFormat(webhookParams, eventData);
    } else {
      processedParams = processParameters(webhookParams, eventData);
    }

    console.log('웹훅 발동:', workflow.webhook_url, processedParams);

    // 웹훅 발동
    const response = await axios.post(workflow.webhook_url, processedParams);

    // 실행 로그 저장 (요청 파라미터 + 응답 포함)
    const logData = {
      request: {
        url: workflow.webhook_url,
        params: processedParams
      },
      response: {
        status: response.status,
        data: response.data
      }
    };
    db.run(
      'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
      [workflow.id, eventId, JSON.stringify(logData), 'success']
    );

    console.log('웹훅 발동 성공:', response.status);
  } catch (error) {
    console.error('웹훅 발동 오류:', error.message);

    // 실패 로그에도 요청 파라미터 포함
    const webhookParams = JSON.parse(workflow.webhook_params || '{}');
    const processedParams = processParameters(webhookParams, eventData);
    const logData = {
      request: {
        url: workflow.webhook_url,
        params: processedParams
      },
      error: error.message
    };
    db.run(
      'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
      [workflow.id, eventId, JSON.stringify(logData), 'failed']
    );
  }
}

// 파라미터 변수 치환 함수
function processParameters(params, eventData) {
  const processed = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // 변수 추출 (예: {{email}} -> email)
      const varName = value.slice(2, -2).trim();
      processed[key] = eventData[varName] || value;
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

// 알림봇 API 형식으로 변환하는 함수
function transformToAlimbotFormat(params, eventData) {
  // 알림봇은 dynamic_attributes의 값을 사용해 params 템플릿을 치환하므로
  // params에는 원본 템플릿 변수({{first_name}} 등)를 그대로 전달해야 함

  // params 객체 생성 (원본 템플릿 유지, 변수 치환 안 함)
  const paramsObj = {};
  const paramCount = parseInt(params.paramCount) || 0;
  for (let i = 1; i <= paramCount; i++) {
    paramsObj[`param${i}`] = params[`param${i}`] || '';
  }

  // 버튼 관련 객체들 (원본 값 사용)
  const buttonTypes = {};
  const buttonNames = {};
  const buttonPcUrls = {};
  const buttonMobileUrls = {};
  const buttonCount = parseInt(params.buttonCount) || 0;
  for (let i = 1; i <= buttonCount; i++) {
    buttonTypes[`button${i}_type`] = params[`button${i}_type`] || '';
    buttonNames[`button${i}_name`] = params[`button${i}_name`] || '';
    buttonPcUrls[`button${i}_pc`] = params[`button${i}_pc`] || '';
    buttonMobileUrls[`button${i}_mobile`] = params[`button${i}_mobile`] || '';
  }

  // 알림봇 API 형식으로 변환
  const alimbotPayload = {
    subscribed: true,
    cid: generateMsgId(),
    createdAt: null,
    updatedAt: null,
    email: eventData.email || '',
    leadScore: 0,
    trackable: true,
    wpTrackable: false,
    crmExportable: false,
    receiveNum: null,
    key: null,
    channelType: null,
    dynamic_attributes: {
      first_name: eventData.first_name || '',
      phone_number: eventData.phone_number || '',
      geoip_country: 'Republic of Korea',
      geoip_state: '',
      geoip_city: '',
      eu_ip_address: false
    },
    extra_parameters: {
      bizmId: params.bizmId,
      key: params.key,
      type: params.type || '03',
      profile: params.profile,
      receiveNum: null,
      senderNumber: null,
      smsTitle: null,
      paramCount: paramCount,
      buttonCount: buttonCount,
      message: params.message || '',
      tempCode: params.tempCode,
      messageType: params.message_type || 'AI',
      params: paramsObj,
      buttonTypes: buttonTypes,
      buttonNames: buttonNames,
      buttonPcUrls: buttonPcUrls,
      buttonMobileUrls: buttonMobileUrls
    }
  };

  return alimbotPayload;
}

// 메시지 ID 생성 함수 (18자리 hex)
function generateMsgId() {
  const hex = Math.random().toString(16).substring(2) + Date.now().toString(16);
  return hex.substring(0, 18);
}

// ============================================
// 조건 평가 및 액션 실행 함수
// ============================================

// 워크플로우 정규화 (하위 호환성)
function normalizeWorkflow(workflow) {
  // 새 형식이 있으면 그대로 사용
  if (workflow.conditions) {
    return {
      conditions: JSON.parse(workflow.conditions),
      condition_logic: workflow.condition_logic || 'AND',
      actions: JSON.parse(workflow.actions || '[]'),
      action_logic: workflow.action_logic || 'AND'
    };
  }

  // 기존 형식 → 새 형식 변환
  const conditions = [];
  if (workflow.event_name) {
    conditions.push({
      type: 'custom_event',
      event_name: workflow.event_name,
      filter: workflow.filter || '존재하는',
      frequency: workflow.frequency || 1,
      frequency_period: workflow.frequency_period || '기간과 상관없이'
    });
  }

  const actions = [];
  if (workflow.webhook_url) {
    actions.push({
      type: 'webhook',
      webhook_url: workflow.webhook_url,
      webhook_params: JSON.parse(workflow.webhook_params || '{}')
    });
  }

  return {
    conditions,
    condition_logic: 'AND',
    actions,
    action_logic: 'AND'
  };
}

// 조건 평가 함수
async function evaluateConditions(conditions, logic, leadEmail, eventData) {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  const results = await Promise.all(conditions.map(async (cond) => {
    switch (cond.type) {
      case 'list':
        return await evaluateListCondition(cond, leadEmail);
      case 'custom_event':
        return evaluateEventCondition(cond, eventData);
      default:
        return false;
    }
  }));

  return logic === 'AND'
    ? results.every(r => r)
    : results.some(r => r);
}

// 리스트 조건 평가
function evaluateListCondition(condition, leadEmail) {
  return new Promise((resolve, reject) => {
    if (!leadEmail) {
      resolve(condition.filter === 'not_in_list');
      return;
    }

    if (condition.list_id === null || condition.list_id === undefined) {
      // Any list 체크
      db.get(
        'SELECT 1 FROM list_members WHERE lead_email = ? LIMIT 1',
        [leadEmail],
        (err, row) => {
          if (err) {
            console.error('리스트 조건 평가 오류:', err);
            resolve(false);
          } else {
            const inAnyList = !!row;
            resolve(condition.filter === 'in_list' ? inAnyList : !inAnyList);
          }
        }
      );
    } else {
      // 특정 리스트 체크
      db.get(
        'SELECT 1 FROM list_members WHERE list_id = ? AND lead_email = ?',
        [condition.list_id, leadEmail],
        (err, row) => {
          if (err) {
            console.error('리스트 조건 평가 오류:', err);
            resolve(false);
          } else {
            const inList = !!row;
            resolve(condition.filter === 'in_list' ? inList : !inList);
          }
        }
      );
    }
  });
}

// 이벤트 조건 평가
function evaluateEventCondition(condition, eventData) {
  const eventName = eventData.event || eventData.event_name;
  const eventMatches = condition.event_name === eventName;

  const filterLower = (condition.filter || '').toLowerCase();
  const filterExists = !filterLower.includes('않') && !filterLower.includes('not');

  return filterExists ? eventMatches : !eventMatches;
}

// 액션 실행 함수
async function executeActions(actions, logic, leadEmail, eventData, workflow, eventId) {
  if (!actions || actions.length === 0) {
    return;
  }

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'list':
          await executeListAction(action, leadEmail, eventData);
          break;
        case 'webhook':
          await executeWebhookAction(action, eventData, workflow, eventId);
          break;
      }
    } catch (error) {
      console.error('액션 실행 오류:', error);
      // 다음 액션 계속 실행
    }
  }
}

// 리스트 액션 실행
function executeListAction(action, leadEmail, eventData) {
  return new Promise((resolve, reject) => {
    if (!leadEmail) {
      console.log('리스트 액션: 이메일 없음, 건너뜀');
      resolve();
      return;
    }

    const leadData = JSON.stringify({
      first_name: eventData.first_name || '',
      phone_number: eventData.phone_number || '',
      ...eventData
    });

    if (action.action === 'add') {
      db.run(
        'INSERT OR REPLACE INTO list_members (list_id, lead_email, lead_data) VALUES (?, ?, ?)',
        [action.list_id, leadEmail, leadData],
        (err) => {
          if (err) {
            console.error('리스트 추가 오류:', err);
            reject(err);
          } else {
            console.log(`리스트 ${action.list_id}에 ${leadEmail} 추가됨`);
            resolve();
          }
        }
      );
    } else {
      db.run(
        'DELETE FROM list_members WHERE list_id = ? AND lead_email = ?',
        [action.list_id, leadEmail],
        (err) => {
          if (err) {
            console.error('리스트 제거 오류:', err);
            reject(err);
          } else {
            console.log(`리스트 ${action.list_id}에서 ${leadEmail} 제거됨`);
            resolve();
          }
        }
      );
    }
  });
}

// 웹훅 액션 실행
async function executeWebhookAction(action, eventData, workflow, eventId) {
  const webhookUrl = action.webhook_url;
  const webhookParams = action.webhook_params || {};

  let processedParams;
  if (webhookUrl && webhookUrl.includes('alimbot.com')) {
    processedParams = transformToAlimbotFormat(webhookParams, eventData);
  } else {
    processedParams = processParameters(webhookParams, eventData);
  }

  console.log('웹훅 발동:', webhookUrl, processedParams);

  try {
    const response = await axios.post(webhookUrl, processedParams);

    const logData = {
      request: { url: webhookUrl, params: processedParams },
      response: { status: response.status, data: response.data }
    };
    db.run(
      'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
      [workflow.id, eventId, JSON.stringify(logData), 'success']
    );

    console.log('웹훅 발동 성공:', response.status);
  } catch (error) {
    console.error('웹훅 발동 오류:', error.message);

    const logData = {
      request: { url: webhookUrl, params: processedParams },
      error: error.message
    };
    db.run(
      'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
      [workflow.id, eventId, JSON.stringify(logData), 'failed']
    );
  }
}

// ============================================
// 워크플로우 API
// ============================================

// 워크플로우 생성
app.post('/api/workflows', (req, res) => {
  const {
    name,
    // 기존 형식
    event_name, filter, frequency, frequency_period, webhook_url, webhook_params,
    // 새 형식
    conditions, condition_logic, actions, action_logic,
    // 2레이어 그룹 형식
    condition_groups, group_logic,
    // 조건 설정
    condition_settings,
    // 목표 조건 그룹
    goal_groups, goal_group_logic
  } = req.body;

  // 새 형식이면 conditions/actions 사용, 아니면 기존 값 사용
  const finalEventName = event_name || 'custom_event';
  const finalWebhookUrl = webhook_url || 'https://example.com/webhook';

  db.run(
    `INSERT INTO workflows (name, event_name, filter, frequency, frequency_period, webhook_url, webhook_params, conditions, actions, condition_logic, action_logic, condition_groups, group_logic, condition_settings, goal_groups, goal_group_logic)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      finalEventName,
      filter || '존재하는',
      frequency || 1,
      frequency_period || '기간과 상관없이',
      finalWebhookUrl,
      JSON.stringify(webhook_params || {}),
      conditions || null,
      actions || null,
      condition_logic || 'AND',
      action_logic || 'AND',
      condition_groups || null,
      group_logic || 'AND',
      condition_settings || null,
      goal_groups || null,
      goal_group_logic || 'AND'
    ],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(201).json({ success: true, id: this.lastID });
      }
    }
  );
});

// 워크플로우 목록 조회
app.get('/api/workflows', (req, res) => {
  db.all('SELECT * FROM workflows ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      // webhook_params를 JSON으로 파싱
      const workflows = rows.map(row => ({
        ...row,
        webhook_params: JSON.parse(row.webhook_params || '{}')
      }));
      res.json({ success: true, data: workflows });
    }
  });
});

// 워크플로우 상세 조회
app.get('/api/workflows/:id', (req, res) => {
  db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (!row) {
      res.status(404).json({ success: false, error: 'Workflow not found' });
    } else {
      res.json({
        success: true,
        data: {
          ...row,
          webhook_params: JSON.parse(row.webhook_params || '{}')
        }
      });
    }
  });
});

// 워크플로우 수정
app.put('/api/workflows/:id', (req, res) => {
  const {
    name,
    // 기존 형식
    event_name, filter, frequency, frequency_period, webhook_url, webhook_params, is_launched,
    // 새 형식
    conditions, condition_logic, actions, action_logic,
    // 2레이어 그룹 형식
    condition_groups, group_logic,
    // 조건 설정
    condition_settings,
    // 목표 조건 그룹
    goal_groups, goal_group_logic
  } = req.body;

  // 새 형식이면 conditions/actions 사용, 아니면 기존 값 사용
  const finalEventName = event_name || 'custom_event';
  const finalWebhookUrl = webhook_url || 'https://example.com/webhook';

  db.run(
    `UPDATE workflows
     SET name = ?, event_name = ?, filter = ?, frequency = ?, frequency_period = ?,
         webhook_url = ?, webhook_params = ?, is_launched = ?,
         conditions = ?, actions = ?, condition_logic = ?, action_logic = ?,
         condition_groups = ?, group_logic = ?, condition_settings = ?,
         goal_groups = ?, goal_group_logic = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      name,
      finalEventName,
      filter || '존재하는',
      frequency || 1,
      frequency_period || '기간과 상관없이',
      finalWebhookUrl,
      JSON.stringify(webhook_params || {}),
      is_launched || 0,
      conditions || null,
      actions || null,
      condition_logic || 'AND',
      action_logic || 'AND',
      condition_groups || null,
      group_logic || 'AND',
      condition_settings || null,
      goal_groups || null,
      goal_group_logic || 'AND',
      req.params.id
    ],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// 워크플로우 런칭 (활성화) - 기존 리드에 대해 액션 실행
app.post('/api/workflows/:id/launch', async (req, res) => {
  const workflowId = req.params.id;

  try {
    // 워크플로우 조회
    const workflow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM workflows WHERE id = ?', [workflowId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    // 런칭 상태로 업데이트
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE workflows SET is_launched = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [workflowId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    console.log(`워크플로우 ID ${workflowId} 런칭됨`);

    // 백그라운드에서 기존 리드에 대해 액션 실행
    processExistingLeadsForWorkflow(workflowId, workflow).catch(err => {
      console.error('기존 리드 처리 오류:', err);
    });

    res.json({ success: true, message: '워크플로우가 런칭되었습니다. 기존 리드에 대해 액션을 실행합니다.' });
  } catch (error) {
    console.error('런칭 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 기존 리드에 대해 워크플로우 액션 실행
async function processExistingLeadsForWorkflow(workflowId, workflow) {
  // 조건 설정 파싱
  let conditionSettings = { addCurrentLeads: true, onlyFirstTime: true };
  if (workflow.condition_settings) {
    try {
      conditionSettings = JSON.parse(workflow.condition_settings);
    } catch (e) {}
  }

  // addCurrentLeads가 false면 기존 리드 처리 안 함
  if (!conditionSettings.addCurrentLeads) {
    console.log(`워크플로우 ${workflowId}: addCurrentLeads=false, 기존 리드 처리 건너뜀`);
    return;
  }

  // 조건 파싱
  let conditionGroups = [];
  if (workflow.condition_groups) {
    try {
      conditionGroups = JSON.parse(workflow.condition_groups);
    } catch (e) {
      conditionGroups = [];
    }
  } else if (workflow.conditions) {
    try {
      const conditions = JSON.parse(workflow.conditions);
      conditionGroups = [{
        id: 1,
        logic: workflow.condition_logic || 'AND',
        conditions: conditions
      }];
    } catch (e) {
      conditionGroups = [];
    }
  }

  // 리스트 조건에서 리드 목록 가져오기
  const listIds = new Set();
  for (const group of conditionGroups) {
    for (const cond of (group.conditions || [])) {
      if (cond.type === 'list' && cond.list_id) {
        listIds.add(cond.list_id);
      }
    }
  }

  if (listIds.size === 0) {
    console.log(`워크플로우 ${workflowId}: 리스트 조건 없음`);
    return;
  }

  // 조건을 만족하는 리드 조회
  const placeholders = Array.from(listIds).map(() => '?').join(',');
  const leads = await new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT lead_email, first_name, phone_number, lead_data
       FROM list_members
       WHERE list_id IN (${placeholders})`,
      Array.from(listIds),
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  console.log(`워크플로우 ${workflowId}: ${leads.length}개의 리드 발견`);

  // onlyFirstTime이 true면 이미 처리된 리드 조회
  let processedLeads = new Set();
  if (conditionSettings.onlyFirstTime) {
    processedLeads = await new Promise((resolve, reject) => {
      db.all(
        'SELECT lead_email FROM workflow_processed_leads WHERE workflow_id = ?',
        [workflowId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(new Set((rows || []).map(r => r.lead_email)));
        }
      );
    });
  }

  // 액션 파싱
  let actions = [];
  try {
    actions = JSON.parse(workflow.actions || '[]');
  } catch (e) {
    actions = [];
  }

  if (actions.length === 0 && workflow.webhook_url) {
    actions = [{
      type: 'webhook',
      webhook_url: workflow.webhook_url,
      webhook_params: JSON.parse(workflow.webhook_params || '{}')
    }];
  }

  // 각 리드에 대해 순차적으로 액션 실행
  for (const lead of leads) {
    // onlyFirstTime=true면 이미 처리된 리드 건너뜀
    if (conditionSettings.onlyFirstTime && processedLeads.has(lead.lead_email)) {
      console.log(`워크플로우 ${workflowId}: ${lead.lead_email} 이미 처리됨, 건너뜀`);
      continue;
    }

    try {
      const leadData = {
        email: lead.lead_email,
        first_name: lead.first_name || '',
        phone_number: lead.phone_number || '',
        ...(lead.lead_data ? JSON.parse(lead.lead_data) : {})
      };

      // 액션 순차 실행
      for (const action of actions) {
        if (action.type === 'list') {
          await executeListAction(action, lead.lead_email, leadData);
        } else if (action.type === 'webhook') {
          await executeWebhookAction(action, leadData, workflow, null);
        }
      }

      // onlyFirstTime=true면 처리 완료 기록
      if (conditionSettings.onlyFirstTime) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO workflow_processed_leads (workflow_id, lead_email) VALUES (?, ?)',
            [workflowId, lead.lead_email],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }

      console.log(`워크플로우 ${workflowId}: ${lead.lead_email} 처리 완료`);
    } catch (error) {
      console.error(`워크플로우 ${workflowId}: ${lead.lead_email} 처리 오류:`, error);
    }
  }

  console.log(`워크플로우 ${workflowId}: 기존 리드 처리 완료`);
}

// 워크플로우 중지 (비활성화)
app.post('/api/workflows/:id/stop', (req, res) => {
  db.run(
    'UPDATE workflows SET is_launched = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        console.log(`워크플로우 ID ${req.params.id} 중지됨`);
        res.json({ success: true, message: '워크플로우가 중지되었습니다.' });
      }
    }
  );
});

// 워크플로우 삭제
app.delete('/api/workflows/:id', (req, res) => {
  db.run('DELETE FROM workflows WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// 워크플로우 복제 (모든 필드 포함)
app.post('/api/workflows/:id/duplicate', (req, res) => {
  db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id], (err, workflow) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const newName = `${workflow.name} (복사본)`;
    db.run(
      `INSERT INTO workflows (name, event_name, filter, frequency, frequency_period, webhook_url, webhook_params, is_launched,
        conditions, actions, condition_logic, action_logic, condition_groups, group_logic, folder_id,
        condition_settings, goal_groups, goal_group_logic)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newName, workflow.event_name, workflow.filter, workflow.frequency, workflow.frequency_period,
        workflow.webhook_url, workflow.webhook_params,
        workflow.conditions, workflow.actions, workflow.condition_logic, workflow.action_logic,
        workflow.condition_groups, workflow.group_logic, workflow.folder_id,
        workflow.condition_settings, workflow.goal_groups, workflow.goal_group_logic
      ],
      function(err) {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          console.log(`워크플로우 ID ${req.params.id} 복제됨 -> 새 ID ${this.lastID}`);
          res.status(201).json({ success: true, id: this.lastID, message: '워크플로우가 복제되었습니다.' });
        }
      }
    );
  });
});

// 워크플로우 조건을 만족하는 리드 수 조회
app.get('/api/workflows/:id/lead-count', async (req, res) => {
  try {
    const workflowId = req.params.id;

    db.get('SELECT * FROM workflows WHERE id = ?', [workflowId], async (err, workflow) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!workflow) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      // 조건 파싱
      let conditionGroups = [];
      if (workflow.condition_groups) {
        try {
          conditionGroups = JSON.parse(workflow.condition_groups);
        } catch (e) {
          conditionGroups = [];
        }
      } else if (workflow.conditions) {
        try {
          const conditions = JSON.parse(workflow.conditions);
          conditionGroups = [{
            id: 1,
            logic: workflow.condition_logic || 'AND',
            conditions: conditions
          }];
        } catch (e) {
          conditionGroups = [];
        }
      }

      // 리스트 조건에서 리드 수 계산
      let totalLeads = 0;
      const listIds = new Set();

      for (const group of conditionGroups) {
        for (const cond of (group.conditions || [])) {
          if (cond.type === 'list' && cond.list_id) {
            listIds.add(cond.list_id);
          }
        }
      }

      if (listIds.size > 0) {
        // 리스트 멤버 수 합산 (중복 제거)
        const placeholders = Array.from(listIds).map(() => '?').join(',');
        db.get(
          `SELECT COUNT(DISTINCT lead_email) as count FROM list_members WHERE list_id IN (${placeholders})`,
          Array.from(listIds),
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, error: err.message });
            } else {
              res.json({ success: true, count: result?.count || 0 });
            }
          }
        );
      } else {
        res.json({ success: true, count: 0 });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 액션에서 직접 웹훅 테스트
app.post('/api/webhook-test', async (req, res) => {
  try {
    const { webhook_url, webhook_params, testData } = req.body;

    // 디버깅: 수신된 원본 데이터 로깅
    console.log('=== 웹훅 테스트 수신 데이터 ===');
    console.log('webhook_url:', webhook_url);
    console.log('webhook_params:', JSON.stringify(webhook_params, null, 2));
    console.log('testData:', JSON.stringify(testData, null, 2));
    console.log('paramCount:', webhook_params?.paramCount, 'buttonCount:', webhook_params?.buttonCount);
    console.log('param1:', webhook_params?.param1);
    console.log('==============================');

    if (!webhook_url) {
      return res.status(400).json({ success: false, error: 'Webhook URL이 필요합니다.' });
    }

    // 알림봇 API인 경우 형식 변환, 아니면 기존 방식
    let processedParams;
    if (webhook_url.includes('alimbot.com')) {
      processedParams = transformToAlimbotFormat(webhook_params || {}, testData || {});
    } else {
      processedParams = processParameters(webhook_params || {}, testData || {});
    }

    console.log('웹훅 테스트 (변환 후):', JSON.stringify(processedParams, null, 2));

    const response = await axios.post(webhook_url, processedParams);

    res.json({
      success: true,
      response: {
        status: response.status,
        data: response.data
      }
    });
  } catch (error) {
    console.error('웹훅 테스트 오류:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// 웹훅 테스트 (워크플로우 기반)
app.post('/api/workflows/:id/test', async (req, res) => {
  try {
    const workflowId = req.params.id;

    db.get('SELECT * FROM workflows WHERE id = ?', [workflowId], async (err, workflow) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!workflow) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      try {
        const webhookParams = JSON.parse(workflow.webhook_params || '{}');
        const testData = req.body.testData || {};

        // 알림봇 API인 경우 형식 변환, 아니면 기존 방식
        let processedParams;
        if (workflow.webhook_url && workflow.webhook_url.includes('alimbot.com')) {
          processedParams = transformToAlimbotFormat(webhookParams, testData);
        } else {
          processedParams = processParameters(webhookParams, testData);
        }

        console.log('웹훅 테스트:', workflow.webhook_url, processedParams);

        const response = await axios.post(workflow.webhook_url, processedParams);

        // 테스트 성공 로그 저장 (요청 파라미터 포함)
        const logData = {
          test: true,
          request: { url: workflow.webhook_url, params: processedParams },
          response: { status: response.status, data: response.data }
        };
        db.run(
          'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
          [workflow.id, null, JSON.stringify(logData), 'test_success']
        );

        res.json({
          success: true,
          response: {
            status: response.status,
            data: response.data
          }
        });
      } catch (error) {
        // 테스트 실패 로그 저장 (요청 파라미터 포함)
        const webhookParams = JSON.parse(workflow.webhook_params || '{}');
        const testData = req.body.testData || {};
        let processedParams;
        if (workflow.webhook_url && workflow.webhook_url.includes('alimbot.com')) {
          processedParams = transformToAlimbotFormat(webhookParams, testData);
        } else {
          processedParams = processParameters(webhookParams, testData);
        }
        const logData = {
          test: true,
          request: { url: workflow.webhook_url, params: processedParams },
          error: error.message,
          details: error.response?.data
        };
        db.run(
          'INSERT INTO workflow_executions (workflow_id, event_id, webhook_response, status) VALUES (?, ?, ?, ?)',
          [workflow.id, null, JSON.stringify(logData), 'test_failed']
        );

        res.status(500).json({
          success: false,
          error: error.message,
          details: error.response?.data
        });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이벤트 목록 조회
app.get('/api/events', (req, res) => {
  db.all(
    'SELECT DISTINCT event_name FROM event_logs ORDER BY received_at DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows });
      }
    }
  );
});

// 이벤트 로그 조회
app.get('/api/event-logs', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    'SELECT * FROM event_logs ORDER BY received_at DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        const logs = rows.map(row => ({
          ...row,
          event_data: JSON.parse(row.event_data || '{}')
        }));
        res.json({ success: true, data: logs });
      }
    }
  );
});

// 워크플로우 실행 로그 조회
app.get('/api/execution-logs', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT we.*, w.name as workflow_name, el.event_name
     FROM workflow_executions we
     LEFT JOIN workflows w ON we.workflow_id = w.id
     LEFT JOIN event_logs el ON we.event_id = el.id
     ORDER BY we.executed_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows });
      }
    }
  );
});

// 테스트 리드 생성
app.post('/api/test-leads', (req, res) => {
  const { name, email, phone_number, custom_data } = req.body;

  db.run(
    'INSERT INTO test_leads (name, email, phone_number, custom_data) VALUES (?, ?, ?, ?)',
    [name, email, phone_number, JSON.stringify(custom_data || {})],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(201).json({ success: true, id: this.lastID });
      }
    }
  );
});

// 테스트 리드 목록 조회
app.get('/api/test-leads', (req, res) => {
  db.all('SELECT * FROM test_leads ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      const leads = rows.map(row => ({
        ...row,
        custom_data: JSON.parse(row.custom_data || '{}')
      }));
      res.json({ success: true, data: leads });
    }
  });
});

// 테스트 리드 삭제
app.delete('/api/test-leads/:id', (req, res) => {
  db.run('DELETE FROM test_leads WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// ============================================
// 리스트 관리 API
// ============================================

// 리스트 목록 조회
app.get('/api/lists', (req, res) => {
  db.all(`
    SELECT l.*,
           (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) as member_count
    FROM lists l
    ORDER BY l.created_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows });
    }
  });
});

// 리스트 생성
app.post('/api/lists', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: '리스트 이름은 필수입니다.' });
  }

  db.run(
    'INSERT INTO lists (name, description) VALUES (?, ?)',
    [name, description || ''],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          res.status(400).json({ success: false, error: '이미 존재하는 리스트 이름입니다.' });
        } else {
          res.status(500).json({ success: false, error: err.message });
        }
      } else {
        res.status(201).json({ success: true, id: this.lastID });
      }
    }
  );
});

// 리스트 상세 조회
app.get('/api/lists/:id', (req, res) => {
  db.get(`
    SELECT l.*,
           (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) as member_count
    FROM lists l
    WHERE l.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (!row) {
      res.status(404).json({ success: false, error: '리스트를 찾을 수 없습니다.' });
    } else {
      res.json({ success: true, data: row });
    }
  });
});

// 리스트 수정
app.put('/api/lists/:id', (req, res) => {
  const { name, description } = req.body;

  db.run(
    'UPDATE lists SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, req.params.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          res.status(400).json({ success: false, error: '이미 존재하는 리스트 이름입니다.' });
        } else {
          res.status(500).json({ success: false, error: err.message });
        }
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// 리스트 삭제
app.delete('/api/lists/:id', (req, res) => {
  db.run('DELETE FROM lists WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// 리스트 멤버 조회
app.get('/api/lists/:id/members', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    'SELECT * FROM list_members WHERE list_id = ? ORDER BY added_at DESC LIMIT ? OFFSET ?',
    [req.params.id, limit, offset],
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        const members = rows.map(row => ({
          ...row,
          lead_data: JSON.parse(row.lead_data || '{}')
        }));
        res.json({ success: true, data: members });
      }
    }
  );
});

// 리스트에 멤버 추가
app.post('/api/lists/:id/members', (req, res) => {
  const { lead_email, first_name, phone_number, lead_data } = req.body;

  if (!lead_email) {
    return res.status(400).json({ success: false, error: '이메일은 필수입니다.' });
  }

  db.run(
    'INSERT OR REPLACE INTO list_members (list_id, lead_email, first_name, phone_number, lead_data) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, lead_email, first_name || '', phone_number || '', JSON.stringify(lead_data || {})],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(201).json({ success: true, id: this.lastID });
      }
    }
  );
});

// 리스트 멤버 벌크 삭제
app.delete('/api/lists/:id/members', (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ success: false, error: '삭제할 이메일 목록이 필요합니다.' });
  }

  const placeholders = emails.map(() => '?').join(',');
  db.run(
    `DELETE FROM list_members WHERE list_id = ? AND lead_email IN (${placeholders})`,
    [req.params.id, ...emails],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, deleted: this.changes });
      }
    }
  );
});

// 리스트에서 멤버 제거
app.delete('/api/lists/:id/members/:email', (req, res) => {
  db.run(
    'DELETE FROM list_members WHERE list_id = ? AND lead_email = ?',
    [req.params.id, decodeURIComponent(req.params.email)],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// 특정 리드가 속한 리스트 조회
app.get('/api/leads/:email/lists', (req, res) => {
  db.all(`
    SELECT l.* FROM lists l
    INNER JOIN list_members lm ON l.id = lm.list_id
    WHERE lm.lead_email = ?
    ORDER BY l.name
  `, [decodeURIComponent(req.params.email)], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows });
    }
  });
});

// ============================================
// CSV 내보내기/불러오기 API
// ============================================

// CSV 내보내기
app.get('/api/lists/:id/export', (req, res) => {
  db.all(
    'SELECT lead_email, first_name, phone_number, added_at FROM list_members WHERE list_id = ? ORDER BY added_at DESC',
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      // BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF';
      const headers = ['이메일', '이름', '휴대폰', '추가일'];
      const csvRows = [headers.join(',')];

      rows.forEach(row => {
        const values = [
          `"${row.lead_email || ''}"`,
          `"${row.first_name || ''}"`,
          `"${row.phone_number || ''}"`,
          `"${row.added_at || ''}"`
        ];
        csvRows.push(values.join(','));
      });

      const csv = BOM + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="list-${req.params.id}-${Date.now()}.csv"`);
      res.send(csv);
    }
  );
});

// CSV 불러오기
app.post('/api/lists/:id/import', (req, res) => {
  const { data } = req.body; // Array of {email, first_name, phone_number}

  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, error: '가져올 데이터가 없습니다.' });
  }

  let imported = 0;
  let errors = 0;

  const stmt = db.prepare(
    'INSERT OR REPLACE INTO list_members (list_id, lead_email, first_name, phone_number, lead_data) VALUES (?, ?, ?, ?, ?)'
  );

  data.forEach(row => {
    if (row.email) {
      stmt.run(
        [req.params.id, row.email, row.first_name || '', row.phone_number || '', JSON.stringify({})],
        (err) => {
          if (err) errors++;
          else imported++;
        }
      );
    }
  });

  stmt.finalize((err) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, imported, errors });
    }
  });
});

// ============================================
// 폴더 API
// ============================================

// 폴더 목록 조회
app.get('/api/folders', (req, res) => {
  db.all(
    `SELECT f.*,
            (SELECT COUNT(*) FROM workflows WHERE folder_id = f.id) as workflow_count
     FROM workflow_folders f
     ORDER BY f.name`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows });
      }
    }
  );
});

// 폴더 생성
app.post('/api/folders', (req, res) => {
  const { name, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: '폴더 이름은 필수입니다.' });
  }

  db.run(
    'INSERT INTO workflow_folders (name, parent_id) VALUES (?, ?)',
    [name, parent_id || null],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.status(201).json({ success: true, id: this.lastID });
      }
    }
  );
});

// 폴더 수정
app.put('/api/folders/:id', (req, res) => {
  const { name } = req.body;

  db.run(
    'UPDATE workflow_folders SET name = ? WHERE id = ?',
    [name, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// 폴더 삭제
app.delete('/api/folders/:id', (req, res) => {
  // 폴더 내 워크플로우는 폴더 없음으로 변경
  db.run('UPDATE workflows SET folder_id = NULL WHERE folder_id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    db.run('DELETE FROM workflow_folders WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    });
  });
});

// ============================================
// 리스트 목표 API
// ============================================

// 리스트 목표 설정
app.put('/api/lists/:id/goal', (req, res) => {
  const { goal_count, goal_description } = req.body;

  db.run(
    'UPDATE lists SET goal_count = ?, goal_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [goal_count || 0, goal_description || '', req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// ============================================
// 워크플로우 목표/통계 API
// ============================================

// 워크플로우 통계 조회
app.get('/api/workflows/:id/stats', (req, res) => {
  const workflowId = req.params.id;

  db.get('SELECT * FROM workflows WHERE id = ?', [workflowId], (err, workflow) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!workflow) {
      return res.status(404).json({ success: false, error: '워크플로우를 찾을 수 없습니다.' });
    }

    // 실행 횟수 조회
    db.get(
      'SELECT COUNT(*) as execution_count FROM workflow_executions WHERE workflow_id = ?',
      [workflowId],
      (err, execResult) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        const stats = {
          workflow_id: workflowId,
          name: workflow.name,
          execution_count: execResult?.execution_count || 0,
          goal_type: workflow.goal_type,
          goal_target: workflow.goal_target,
          goal_current: workflow.goal_current,
          goal_percentage: workflow.goal_target ? Math.round((workflow.goal_current / workflow.goal_target) * 100) : 0
        };

        res.json({ success: true, data: stats });
      }
    );
  });
});

// 워크플로우 목표 설정
app.put('/api/workflows/:id/goal', (req, res) => {
  const { goal_type, goal_target } = req.body;

  db.run(
    'UPDATE workflows SET goal_type = ?, goal_target = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [goal_type, goal_target, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// 워크플로우 폴더 이동
app.put('/api/workflows/:id/folder', (req, res) => {
  const { folder_id } = req.body;

  db.run(
    'UPDATE workflows SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [folder_id, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    }
  );
});

// ============================================
// AI 알림봇 API
// ============================================

// AI 알림봇 설정 조회
app.get('/api/ai-bot/settings', (req, res) => {
  db.get(
    "SELECT * FROM ai_bot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
    (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        const settings = row ? {
          payment: JSON.parse(row.payment_config || '{}'),
          integration: JSON.parse(row.integration_config || '{"smartstore":{"enabled":false,"apiKey":"","apiSecret":"","storeId":""}}')
        } : {
          payment: {},
          integration: {
            smartstore: {
              enabled: false,
              apiKey: '',
              apiSecret: '',
              storeId: ''
            }
          }
        };
        res.json({ success: true, data: settings });
      }
    }
  );
});

// AI 알림봇 설정 저장
app.post('/api/ai-bot/settings', (req, res) => {
  const { payment, integration } = req.body;

  db.run(
    `INSERT OR REPLACE INTO ai_bot_settings (industry, payment_config, integration_config, updated_at)
     VALUES ('shopping', ?, ?, CURRENT_TIMESTAMP)`,
    [JSON.stringify(payment || {}), JSON.stringify(integration || {})],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// AI 알림봇 연동 설정 저장
app.post('/api/ai-bot/integration', (req, res) => {
  const integration = req.body;

  db.get(
    "SELECT * FROM ai_bot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      const currentSettings = row ? JSON.parse(row.payment_config || '{}') : {};
      const newIntegration = JSON.stringify(integration || {});

      db.run(
        `INSERT OR REPLACE INTO ai_bot_settings (industry, payment_config, integration_config, updated_at)
         VALUES ('shopping', ?, ?, CURRENT_TIMESTAMP)`,
        [JSON.stringify(currentSettings), newIntegration],
        function(err) {
          if (err) {
            res.status(500).json({ success: false, error: err.message });
          } else {
            res.json({ success: true, id: this.lastID });
          }
        }
      );
    }
  );
});

// AI 알림봇 템플릿 조회
app.get('/api/ai-bot/templates', (req, res) => {
  db.all(
    "SELECT template_id FROM ai_bot_templates WHERE industry = 'shopping' AND is_selected = 1",
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        const templateIds = rows ? rows.map(r => r.template_id) : [];
        res.json({ success: true, data: templateIds });
      }
    }
  );
});

// AI 알림봇 템플릿 저장
app.post('/api/ai-bot/templates', (req, res) => {
  const { templateIds } = req.body;

  if (!Array.isArray(templateIds)) {
    return res.status(400).json({ success: false, error: 'templateIds must be an array' });
  }

  // 기존 선택 해제
  db.run(
    "UPDATE ai_bot_templates SET is_selected = 0 WHERE industry = 'shopping'",
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      // 새 템플릿 선택
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO ai_bot_templates (industry, template_id, template_name, is_selected, updated_at)
         VALUES ('shopping', ?, ?, 1, CURRENT_TIMESTAMP)`
      );

      const templateNames = {
        1: '주문접수',
        2: '결제완료',
        3: '상품준비중',
        4: '배송시작',
        5: '배송완료',
        6: '구매확정',
        7: '리뷰요청',
        8: '재고부족',
        9: '주문취소',
        10: '환불완료'
      };

      templateIds.forEach(templateId => {
        stmt.run([templateId, templateNames[templateId] || `템플릿${templateId}`]);
      });

      stmt.finalize((err) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true, message: '템플릿이 저장되었습니다.' });
        }
      });
    }
  );
});

// 게이트웨이 폴링 제어 API
app.post('/api/gateway/start', (req, res) => {
  gateway.startPolling();
  res.json({ success: true, message: '게이트웨이 폴링이 시작되었습니다.' });
});

app.post('/api/gateway/stop', (req, res) => {
  gateway.stopPolling();
  res.json({ success: true, message: '게이트웨이 폴링이 중지되었습니다.' });
});

app.get('/api/gateway/status', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      isRunning: gateway.isRunning,
      pollingInterval: gateway.pollingInterval 
    } 
  });
});

// AI 알림봇 템플릿에 맞는 워크플로우 자동 생성/업데이트
app.post('/api/ai-bot/sync-workflows', async (req, res) => {
  try {
    // 선택된 템플릿 조회
    const templatesRes = await new Promise((resolve, reject) => {
      db.all(
        "SELECT template_id, template_name FROM ai_bot_templates WHERE industry = 'shopping' AND is_selected = 1",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // 연동 설정 조회
    const settingsRes = await new Promise((resolve, reject) => {
      db.get(
        "SELECT integration_config FROM ai_bot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!settingsRes || !settingsRes.integration_config) {
      return res.status(400).json({ success: false, error: '연동 설정이 없습니다.' });
    }

    const integration = JSON.parse(settingsRes.integration_config);
    const webhookUrl = 'https://tools.alimbot.com/api/v1/msg/process'; // 알림봇 웹훅 URL

    const templateConfigs = {
      1: { event: '주문접수', templateCode: 'order_received' },
      2: { event: '결제완료', templateCode: 'payment_completed' },
      3: { event: '상품준비중', templateCode: 'preparing_product' },
      4: { event: '배송시작', templateCode: 'shipping_started' },
      5: { event: '배송완료', templateCode: 'shipping_completed' },
      6: { event: '구매확정', templateCode: 'purchase_confirmed' },
      7: { event: '리뷰요청', templateCode: 'review_request' },
      8: { event: '재고부족', templateCode: 'out_of_stock' },
      9: { event: '주문취소', templateCode: 'order_cancelled' },
      10: { event: '환불완료', templateCode: 'refund_completed' }
    };

    const createdWorkflows = [];

    for (const template of templatesRes) {
      const config = templateConfigs[template.template_id];
      if (!config) continue;

      const workflowName = `[AI알림봇] ${template.template_name}`;
      
      // 기존 워크플로우 확인
      const existing = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM workflows WHERE name = ?",
          [workflowName],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const webhookParams = {
        bizmId: integration.bizmId || '',
        key: integration.key || '',
        type: '03',
        profile: integration.profile || '',
        tempCode: config.templateCode,
        message: `${template.template_name} 알림입니다.`,
        email: '{{email}}',
        first_name: '{{customerName}}',
        phone_number: '{{customerPhone}}',
        paramCount: 0,
        buttonCount: 0
      };

      if (existing) {
        // 기존 워크플로우 업데이트
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE workflows 
             SET event_name = ?, webhook_url = ?, webhook_params = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [config.event, webhookUrl, JSON.stringify(webhookParams), existing.id],
            function(err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });
        createdWorkflows.push({ id: existing.id, name: workflowName, action: 'updated' });
      } else {
        // 새 워크플로우 생성
        const newId = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO workflows (name, event_name, filter, frequency, frequency_period, webhook_url, webhook_params, is_launched)
             VALUES (?, ?, '존재하는', 1, '기간과 상관없이', ?, ?, 0)`,
            [workflowName, config.event, webhookUrl, JSON.stringify(webhookParams)],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        createdWorkflows.push({ id: newId, name: workflowName, action: 'created' });
      }
    }

    res.json({ 
      success: true, 
      message: `${createdWorkflows.length}개의 워크플로우가 동기화되었습니다.`,
      data: createdWorkflows 
    });
  } catch (error) {
    console.error('워크플로우 동기화 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 프렌츠 결제 API
// ============================================

// 잔액 조회
app.get('/api/payment/balance', (req, res) => {
  db.get(
    'SELECT balance FROM payment_balance ORDER BY updated_at DESC LIMIT 1',
    (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        const balance = row ? row.balance : 0;
        res.json({ success: true, data: { balance } });
      }
    }
  );
});

// 충전 내역 조회
app.get('/api/payment/history', (req, res) => {
  const limit = req.query.limit || 50;
  db.all(
    'SELECT * FROM payment_history ORDER BY created_at DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows || [] });
      }
    }
  );
});

// 충전 요청
app.post('/api/payment/charge', async (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || amount < 1000) {
    return res.status(400).json({ success: false, error: '최소 충전 금액은 1,000원입니다.' });
  }

  try {
    // 충전 내역 생성
    const merchantUid = `frients_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chargeId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO payment_history (amount, payment_method, status, merchant_uid) VALUES (?, ?, ?, ?)',
        [amount, paymentMethod, 'pending', merchantUid],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // 포트원(아임포트) 결제 모듈 연동
    // 실제 PG사는 포트원 대시보드에서 설정한 값 사용
    let pg = 'html5_inicis'; // 기본값: 이니시스
    let payMethod = 'card';
    
    if (paymentMethod === 'card') {
      pg = 'html5_inicis'; // 또는 'kcp', 'nice' 등
      payMethod = 'card';
    } else if (paymentMethod === 'bank') {
      pg = 'html5_inicis';
      payMethod = 'trans';
    } else if (paymentMethod === 'virtual') {
      pg = 'html5_inicis';
      payMethod = 'vbank';
    }

    const paymentData = {
      pg: pg,
      pay_method: payMethod,
      merchant_uid: merchantUid,
      name: `프렌츠 알림톡 충전`,
      amount: amount,
      buyer_email: req.body.buyer_email || 'user@frients.com',
      buyer_name: req.body.buyer_name || '프렌츠 사용자',
      buyer_tel: req.body.buyer_tel || '010-0000-0000',
      m_redirect_url: `${req.protocol}://${req.get('host')}/payment/complete`
    };

    // 결제 데이터 저장
    db.run(
      'UPDATE payment_history SET payment_data = ? WHERE id = ?',
      [JSON.stringify(paymentData), chargeId]
    );

    res.json({
      success: true,
      data: {
        chargeId,
        merchantUid,
        paymentData,
        // 실제 결제 모듈 연동 시 paymentUrl 또는 결제 위젯 호출 정보 반환
        message: '결제를 진행해주세요.'
      }
    });
  } catch (error) {
    console.error('충전 요청 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 결제 검증 (결제 완료 후 호출)
app.post('/api/payment/verify', async (req, res) => {
  const { imp_uid, merchant_uid, amount } = req.body;

  try {
    // 실제로는 포트원 서버 API를 호출하여 결제 검증해야 합니다
    // 포트원 REST API: https://api.iamport.kr/payments/{imp_uid}
    // 여기서는 클라이언트에서 전달받은 정보로 검증 (실제 운영 시 서버 사이드 검증 필수)
    
    // 충전 내역 업데이트
    db.get(
      'SELECT * FROM payment_history WHERE merchant_uid = ?',
      [merchant_uid],
      (err, charge) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        if (!charge) {
          return res.status(404).json({ success: false, error: '충전 내역을 찾을 수 없습니다.' });
        }

        // 잔액 업데이트
        db.get(
          'SELECT balance FROM payment_balance ORDER BY updated_at DESC LIMIT 1',
          (err, balanceRow) => {
            const currentBalance = balanceRow ? balanceRow.balance : 0;
            const newBalance = currentBalance + charge.amount;

            db.run(
              'INSERT INTO payment_balance (balance, updated_at) VALUES (?, CURRENT_TIMESTAMP)',
              [newBalance],
              (err) => {
                if (err) {
                  return res.status(500).json({ success: false, error: err.message });
                }

                // 충전 내역 상태 업데이트
                db.run(
                  'UPDATE payment_history SET status = ?, imp_uid = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                  ['completed', imp_uid, charge.id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ success: false, error: err.message });
                    }

                    res.json({
                      success: true,
                      data: {
                        balance: newBalance,
                        chargedAmount: charge.amount
                      },
                      message: '충전이 완료되었습니다.'
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('결제 검증 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 결제 실패 처리
app.post('/api/payment/fail', (req, res) => {
  const { merchant_uid, error_code, error_msg } = req.body;

  db.run(
    'UPDATE payment_history SET status = ? WHERE merchant_uid = ?',
    ['failed', merchant_uid],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: '실패 내역이 저장되었습니다.' });
    }
  );
});

// ============================================
// GW/WF 디버그 로그 API
// ============================================

// 디버그 로그 조회
app.get('/api/debug-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const component = req.query.component; // 'GW' or 'WF' or null (all)
  const direction = req.query.direction; // 'IN' or 'OUT' or null (all)

  let query = 'SELECT * FROM debug_logs WHERE 1=1';
  const params = [];

  if (component) {
    query += ' AND component = ?';
    params.push(component);
  }

  if (direction) {
    query += ' AND direction = ?';
    params.push(direction);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      // JSON 파싱
      const logs = rows.map(row => ({
        ...row,
        request_data: row.request_data ? JSON.parse(row.request_data) : null,
        response_data: row.response_data ? JSON.parse(row.response_data) : null
      }));
      res.json({ success: true, data: logs });
    }
  });
});

// 디버그 로그 통계
app.get('/api/debug-logs/stats', (req, res) => {
  db.all(
    `SELECT 
      component,
      direction,
      status,
      COUNT(*) as count
     FROM debug_logs
     WHERE created_at >= datetime('now', '-24 hours')
     GROUP BY component, direction, status
     ORDER BY component, direction, status`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: rows });
      }
    }
  );
});

// ============================================
// GW/WF 테스트 API
// ============================================

// GW 테스트: 스마트스토어 API 폴링 시뮬레이션
app.post('/api/test/gw-smartstore-poll', async (req, res) => {
  try {
    // 스마트스토어 주문 데이터 시뮬레이션
    const mockOrderData = {
      orderId: `TEST-ORDER-${Date.now()}`,
      orderDate: new Date().toISOString(),
      customerName: '테스트 고객',
      customerPhone: '010-1234-5678',
      customerEmail: 'test@example.com',
      products: [
        { name: '테스트 상품 1', quantity: 1, price: 10000 },
        { name: '테스트 상품 2', quantity: 2, price: 20000 }
      ],
      totalAmount: 50000,
      paymentMethod: '신용카드',
      shippingAddress: '서울시 강남구 테스트로 123'
    };

    // GW 디버그 로그 저장 (스마트스토어 API 폴링 시뮬레이션)
    const apiUrl = 'https://api.commerce.naver.com/smartstore/v1/orders';
    saveDebugLog(
      'GW',
      'OUT',
      '스마트스토어 API 폴링',
      apiUrl,
      {
        headers: { 'X-Naver-Client-Id': 'test-key', 'X-Naver-Client-Secret': 'test-secret' },
        params: {
          startDate: new Date(Date.now() - 60000).toISOString(),
          endDate: new Date().toISOString()
        }
      },
      { status: 200, orderCount: 1, orders: [mockOrderData] },
      'success',
      null
    );

    console.log('[GW 테스트] 스마트스토어 API 폴링 시뮬레이션 완료');

    // GTM 트리거 발생 (실제 트리거 함수 호출)
    const gateway = require('./gateway');
    await gateway.triggerGTM(mockOrderData);

    res.json({
      success: true,
      message: 'GW 테스트 완료: 스마트스토어 API 폴링 및 GTM 트리거 발생',
      data: {
        orderData: mockOrderData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[GW 테스트] 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WF 테스트: GTM 이벤트 수신 시뮬레이션
app.post('/api/test/wf-gtm-event', async (req, res) => {
  try {
    // GTM 이벤트 데이터 시뮬레이션
    const eventData = {
      event: req.body.event || '결제완료',
      email: req.body.email || 'test@example.com',
      customerName: req.body.customerName || '테스트 고객',
      customerPhone: req.body.customerPhone || '010-1234-5678',
      orderId: req.body.orderId || `ORDER-${Date.now()}`,
      orderAmount: req.body.orderAmount || 50000,
      productName: req.body.productName || '테스트 상품',
      timestamp: new Date().toISOString()
    };

    // WF 디버그 로그 저장 (GTM 이벤트 수신 시뮬레이션)
    saveDebugLog(
      'WF',
      'IN',
      'GTM 이벤트 수신',
      '/api/events',
      eventData,
      null,
      'received',
      null
    );

    console.log('[WF 테스트] GTM 이벤트 수신 시뮬레이션:', eventData.event);

    // 실제 이벤트 처리 로직 호출 (워크플로우 실행)
    const eventId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO event_logs (event_name, event_data) VALUES (?, ?)',
        [eventData.event, JSON.stringify(eventData)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // 해당 이벤트에 매칭되고 런칭된 워크플로우 찾기
    db.all(
      'SELECT * FROM workflows WHERE is_launched = 1 AND event_name = ?',
      [eventData.event],
      async (err, workflows) => {
        if (err) {
          console.error('워크플로우 조회 오류:', err);
        } else {
          const leadEmail = eventData.email || eventData.lead_email;

          // 각 워크플로우 실행
          for (const workflow of workflows) {
            try {
              const normalized = normalizeWorkflow(workflow);
              const conditionsMet = await evaluateConditions(
                normalized.conditions,
                normalized.condition_logic,
                leadEmail,
                eventData
              );

              if (conditionsMet) {
                console.log(`[WF 테스트] 워크플로우 "${workflow.name}" 조건 충족, 액션 실행`);
                await executeActions(
                  normalized.actions,
                  normalized.action_logic,
                  leadEmail,
                  eventData,
                  workflow,
                  eventId
                );
              }
            } catch (error) {
              console.error('[WF 테스트] 워크플로우 실행 오류:', error);
            }
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'WF 테스트 완료: GTM 이벤트 수신 및 워크플로우 처리',
      data: {
        eventId,
        eventData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[WF 테스트] 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AI 알림봇 라우터 등록 (새 용어: ai-alimbot)
// ============================================
app.use('/api/ai-alimbot', aiAlimbotRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`이벤트 수신 URL: http://localhost:${PORT}/api/events`);
  
  // 환경 변수로 자동 시작 여부 제어
  if (process.env.AUTO_START_GATEWAY === 'true') {
    gateway.startPolling();
  }
});
