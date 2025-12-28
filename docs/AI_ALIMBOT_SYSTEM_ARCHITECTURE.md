# AI 알림봇 시스템 아키텍처

> 쇼핑몰 ↔ 데이터수신 ↔ 메시지발송 통합 시스템

---

## 1. 현재 상태 vs 목표 구조

### 1.1 현재 구현 (단방향) ✅

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│             │      │     폴링        │      │    메시지발송    │
│   쇼핑몰    │ ───→ │ (smartstore_    │ ───→ │   (Alimbot)     │
│             │      │  poling)        │      │                 │
└─────────────┘      └─────────────────┘      └─────────────────┘

* 워크플로우를 거치지 않고 직접 메시지 발송
* 테스트 모듈로 동작 확인 완료
```

### 1.2 목표 구조 (게이트웨이 ↔ 워크플로우) 🔧 구현 필요

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│             │      │    게이트웨이    │      │    워크플로우    │      │    메시지발송    │
│   쇼핑몰    │ ←──→ │   (API 폴링)    │ ←──→ │  (조건/액션)    │ ←──→ │   (Alimbot)     │
│             │      │ GTM Data_Layer  │      │                 │      │                 │
└─────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
                            │                        │
                            │   POST /api/events     │
                            └────────────────────────┘

* 게이트웨이가 워크플로우 API 호출
* 워크플로우에서 조건 평가 후 액션 실행
* 조건 기반 메시지 발송 제어 가능
```

---

## 2. 구현 필요 항목

| 항목 | 현재 상태 | 필요 작업 |
|------|----------|----------|
| 쇼핑몰 → 폴링 | ✅ 구현됨 | - |
| 폴링 → 메시지발송 (직접) | ✅ 구현됨 | - |
| 게이트웨이 → 워크플로우 | ❌ 미구현 | `POST /api/events` 호출 추가 |
| 워크플로우 → 메시지발송 | ✅ 구현됨 | - |
| 워크플로우 ← 게이트웨이 (응답) | ❌ 미구현 | 결과 응답 처리 |

---

## 3. 시스템 개요

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI 알림봇 시스템 전체 흐름                                    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   │
│  │             │    │    게이트웨이    │    │    워크플로우    │    │   메시지발송     │   │
│  │   쇼핑몰    │ ←→ │  (API 폴링)     │ ←→ │  (이벤트 처리)  │ ←→ │  (알림톡 API)   │   │
│  │             │    │  GTM Data_Layer │    │  조건/액션 실행  │    │                 │   │
│  └─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘   │
│                                                                                          │
│       외부              smartstore_poling         CursorAI Backend        Alimbot API    │
│                         (별도 리포지토리)          (Spring Boot)                          │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 리포지토리 구성

| 리포지토리 | 역할 | 기술 스택 |
|-----------|------|----------|
| **CursorAI** | 워크플로우 엔진 + 프론트엔드 | Vue.js + Spring Boot |
| **smartstore_poling** | 게이트웨이 (API 폴링) | Node.js |
| **Alimbot API** | 메시지 발송 서비스 | 외부 API (tools.alimbot.com) |

---

## 3. 컴포넌트 상세

### 3.1 게이트웨이 (smartstore_poling)

**리포지토리**: https://gitlab.com/frients/smartstore_poling.git

**주요 기능**:
- 스마트스토어 API 주기적 폴링
- 주문/예약/신청/방문 데이터 수집
- GTM Data_Layer 형식으로 변환
- CursorAI 워크플로우 API 호출

**데이터 흐름**:
```
스마트스토어 API  →  폴링 (주기적)  →  데이터 변환  →  POST /api/events
```

---

### 3.2 워크플로우 엔진 (CursorAI Backend)

**리포지토리**: CursorAI (현재 프로젝트)

#### 3.2.1 이벤트 수신 API

**파일**: `EventController.java`

| HTTP | Endpoint | 설명 |
|------|----------|------|
| POST | `/api/events` | GTM 이벤트 수신 및 워크플로우 트리거 |
| GET | `/api/events` | 전체 이벤트 로그 조회 |
| GET | `/api/events/distinct` | 고유 이벤트명 목록 조회 |

**이벤트 수신 요청 예시**:
```json
{
  "event": "order_received",
  "email": "customer@example.com",
  "first_name": "홍길동",
  "phone_number": "01012345678",
  "orderId": "ORDER-123456",
  "orderAmount": 50000
}
```

#### 3.2.2 이벤트 처리 서비스

**파일**: `EventService.java`

**처리 흐름**:
```
1. saveEvent()
   - EventLog 테이블에 이벤트 저장
   - 디버그 로그 기록 (WF-IN)

2. processEvent()
   - 런칭된(isLaunched=true) 워크플로우 조회
   - 각 워크플로우에 대해:
     a. normalizeWorkflow() - 형식 정규화
     b. evaluateConditions() - 조건 평가
     c. evaluateGoalConditions() - 목표 조건 확인
     d. executeActions() - 액션 실행
```

#### 3.2.3 워크플로우 실행 서비스

**파일**: `WorkflowExecutionService.java`

**조건 평가 (evaluateConditions)**:
```
조건 그룹 1 (AND/OR) 조건 그룹 2
    ├─ 조건 A              ├─ 조건 C
    └─ 조건 B              └─ 조건 D
```

**지원 조건 타입**:
| 타입 | 설명 | 예시 |
|------|------|------|
| `custom_event` | 이벤트명 매칭 | `event == "order_received"` |
| `list` | 리스트 멤버십 확인 | `email in list_123` |

**지원 액션 타입**:
| 타입 | 설명 | 실행 함수 |
|------|------|----------|
| `webhook` | 외부 API 호출 | `executeWebhookAction()` |
| `list` | 리스트 추가/제거 | `executeListAction()` |

#### 3.2.4 웹훅 테스트 API

**파일**: `WebhookTestController.java`

| HTTP | Endpoint | 설명 |
|------|----------|------|
| POST | `/api/webhook-test` | 웹훅 테스트 실행 |

**요청 예시**:
```json
{
  "webhook_url": "https://tools.alimbot.com/api/v1/msg/process",
  "webhook_params": {
    "bizmId": "123456",
    "key": "abcd1234",
    "type": "03",
    "profile": "default",
    "tempCode": "order_complete"
  },
  "testData": {
    "email": "test@example.com",
    "first_name": "테스트",
    "phone_number": "01012345678"
  }
}
```

#### 3.2.5 디버그 로그 API

**파일**: `DebugLogController.java`

| HTTP | Endpoint | 설명 |
|------|----------|------|
| GET | `/api/debug-logs` | 디버그 로그 조회 |
| GET | `/api/debug-logs/stats` | 24시간 통계 조회 |

**필터 파라미터**:
| 파라미터 | 값 | 설명 |
|---------|-----|------|
| `component` | `GW`, `WF` | 게이트웨이/워크플로우 |
| `direction` | `IN`, `OUT` | 수신/발신 |
| `limit` | 숫자 | 최대 조회 개수 |

---

### 3.3 메시지 발송 (Alimbot API)

**엔드포인트**: `https://tools.alimbot.com/api/v1/msg/process`

**요청 형식** (transformToAlimbotFormat 변환 후):
```json
{
  "subscribed": true,
  "cid": "unique_message_id",
  "email": "customer@example.com",
  "dynamic_attributes": {
    "first_name": "홍길동",
    "phone_number": "01012345678",
    "geoip_country": "Republic of Korea"
  },
  "extra_parameters": {
    "bizmId": "123456789",
    "key": "api_key",
    "type": "03",
    "profile": "profile_name",
    "tempCode": "template_code",
    "message": "알림톡 메시지 내용",
    "messageType": "AI",
    "paramCount": 3,
    "params": {
      "param1": "주문번호",
      "param2": "배송예정일",
      "param3": "상품명"
    },
    "buttonCount": 1,
    "buttonTypes": {"button1_type": "WL"},
    "buttonNames": {"button1_name": "주문확인"},
    "buttonPcUrls": {"button1_pc": "https://..."},
    "buttonMobileUrls": {"button1_mobile": "https://..."}
  }
}
```

---

## 4. 데이터베이스 스키마

### 4.1 이벤트 관련

**event_logs** - 수신된 이벤트 기록
```sql
CREATE TABLE event_logs (
  id BIGINT PRIMARY KEY,
  event_name VARCHAR(255),
  event_data TEXT,         -- JSON
  received_at TIMESTAMP
);
```

### 4.2 워크플로우 관련

**workflows** - 워크플로우 정의
```sql
CREATE TABLE workflows (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  event_name VARCHAR(255),        -- 레거시
  condition_groups TEXT,          -- JSON: 조건 그룹
  group_logic VARCHAR(10),        -- AND/OR
  actions TEXT,                   -- JSON: 액션 목록
  action_logic VARCHAR(10),       -- AND/OR
  goal_groups TEXT,               -- JSON: 목표 조건
  goal_target INTEGER,
  goal_current INTEGER,
  is_launched BOOLEAN,
  webhook_url VARCHAR(500),
  webhook_params TEXT
);
```

**workflow_executions** - 워크플로우 실행 기록
```sql
CREATE TABLE workflow_executions (
  id BIGINT PRIMARY KEY,
  workflow_id BIGINT,
  event_id BIGINT,
  webhook_response TEXT,
  status VARCHAR(50),
  executed_at TIMESTAMP
);
```

### 4.3 AI 알림봇 설정

**ai_bot_settings** - 업종별 설정
```sql
CREATE TABLE ai_bot_settings (
  id BIGINT PRIMARY KEY,
  industry VARCHAR(50),           -- shopping, reservation 등
  payment_config TEXT,            -- JSON
  integration_config TEXT,        -- JSON: 연동 설정
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**ai_bot_templates** - 템플릿 선택
```sql
CREATE TABLE ai_bot_templates (
  id BIGINT PRIMARY KEY,
  industry VARCHAR(50),
  template_id INTEGER,
  template_name VARCHAR(255),
  is_selected BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4.4 디버그 로그

**debug_logs** - GW/WF 디버그 로그
```sql
CREATE TABLE debug_logs (
  id BIGINT PRIMARY KEY,
  component VARCHAR(10),          -- GW, WF
  direction VARCHAR(10),          -- IN, OUT
  action VARCHAR(255),
  url VARCHAR(500),
  request_data TEXT,              -- JSON
  response_data TEXT,             -- JSON
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP
);
```

---

## 5. 프론트엔드 컴포넌트

### 5.1 디버그 로그 뷰어

**파일**: `frontend/src/components/notification/DebugLogViewer.vue`

**기능**:
- GW/WF 디버그 로그 실시간 조회
- 컴포넌트/방향별 필터링
- 자동 새로고침 (3초)
- GW 테스트 / WF 테스트 버튼

**테스트 API 호출**:
| 버튼 | API | 설명 |
|------|-----|------|
| GW 테스트 | `POST /api/test/gw-smartstore-poll` | 스마트스토어 폴링 시뮬레이션 |
| WF 테스트 | `POST /api/test/wf-gtm-event` | GTM 이벤트 수신 시뮬레이션 |

---

## 6. 통합 테스트 시나리오

### 6.1 수동 테스트 (curl)

**Step 1: 이벤트 수신 테스트**
```bash
curl -X POST https://api-production-089a.up.railway.app/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order_received",
    "email": "test@example.com",
    "first_name": "홍길동",
    "phone_number": "01012345678"
  }'
```

**Step 2: 워크플로우 확인**
```bash
curl https://api-production-089a.up.railway.app/api/workflows
```

**Step 3: 디버그 로그 확인**
```bash
curl "https://api-production-089a.up.railway.app/api/debug-logs?limit=10"
```

### 6.2 웹훅 테스트

```bash
curl -X POST https://api-production-089a.up.railway.app/api/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://tools.alimbot.com/api/v1/msg/process",
    "webhook_params": {
      "bizmId": "test",
      "key": "test",
      "type": "03"
    },
    "testData": {
      "email": "test@example.com",
      "first_name": "테스트"
    }
  }'
```

---

## 7. 우측 상단 메뉴 구성

| 메뉴 | 기능 | 관련 파일 |
|------|------|----------|
| **결제** | PG사 연동, 잔액 조회, 충전, 내역 | `PaymentSettings.vue`, `PaymentController.java` |
| **연동** | 쇼핑몰/웹페이지 연동 설정 | `SettingsSection.vue`, `AiBotService.java` |
| **메시지자동발송** | GTM→워크플로우→알림톡 | `WorkflowExecutionService.java` |

---

## 8. 디버그 로그 상태값

| 컴포넌트 | 방향 | 액션 | 상태 |
|---------|------|------|------|
| GW | IN | 스마트스토어 API 폴링 | received, error |
| GW | OUT | GTM 트리거 발생 | success, failed |
| WF | IN | GTM 이벤트 수신 | received |
| WF | OUT | 웹훅 발동 | success, failed |

---

## 9. 배포 URL

| 서비스 | URL |
|--------|-----|
| Frontend | https://cursorai.changups.kr |
| Backend (API) | https://api-production-089a.up.railway.app |
| 게이트웨이 | (별도 배포 필요: smartstore_poling) |
| Alimbot API | https://tools.alimbot.com/api/v1/msg/process |

---

*작성일: 2025-12-28*
