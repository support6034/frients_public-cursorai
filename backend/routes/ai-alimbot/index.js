const express = require('express');
const router = express.Router();
const db = require('../../database');

// 템플릿 ID와 이벤트/템플릿 코드 매핑
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

// 템플릿 ID와 이름 매핑
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

// AI 알림봇 설정 조회
router.get('/settings', (req, res) => {
  db.get(
    "SELECT * FROM ai_alimbot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
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
router.post('/settings', (req, res) => {
  const { payment, integration } = req.body;

  db.run(
    `INSERT OR REPLACE INTO ai_alimbot_settings (industry, payment_config, integration_config, updated_at)
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
router.post('/integration', (req, res) => {
  const integration = req.body;

  db.get(
    "SELECT * FROM ai_alimbot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      const currentSettings = row ? JSON.parse(row.payment_config || '{}') : {};
      const newIntegration = JSON.stringify(integration || {});

      db.run(
        `INSERT OR REPLACE INTO ai_alimbot_settings (industry, payment_config, integration_config, updated_at)
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
router.get('/templates', (req, res) => {
  db.all(
    "SELECT template_id FROM ai_alimbot_templates WHERE industry = 'shopping' AND is_selected = 1",
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
router.post('/templates', (req, res) => {
  const { templateIds } = req.body;

  if (!Array.isArray(templateIds)) {
    return res.status(400).json({ success: false, error: 'templateIds must be an array' });
  }

  // 모든 템플릿 선택 해제
  db.run(
    "UPDATE ai_alimbot_templates SET is_selected = 0 WHERE industry = 'shopping'",
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      // 선택된 템플릿 저장
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO ai_alimbot_templates (industry, template_id, template_name, is_selected, updated_at)
         VALUES ('shopping', ?, ?, 1, CURRENT_TIMESTAMP)`
      );

      templateIds.forEach((templateId) => {
        const templateName = templateNames[templateId] || `템플릿${templateId}`;
        stmt.run([templateId, templateName]);
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

// AI 알림봇 템플릿에 맞는 워크플로우 자동 생성/업데이트
router.post('/sync-workflows', async (req, res) => {
  try {
    // 선택된 템플릿 조회
    const templatesRes = await new Promise((resolve, reject) => {
      db.all(
        "SELECT template_id, template_name FROM ai_alimbot_templates WHERE industry = 'shopping' AND is_selected = 1",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // 연동 설정 조회
    const settingsRes = await new Promise((resolve, reject) => {
      db.get(
        "SELECT integration_config FROM ai_alimbot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
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

module.exports = router;

