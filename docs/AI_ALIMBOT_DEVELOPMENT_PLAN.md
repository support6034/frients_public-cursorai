# AI 알림봇 개발 계획서

> 다음 AI가 이어서 개발할 수 있도록 작성된 문서

---

## 1. 프로젝트 현황

### 1.1 배포 완료 상태

| 프로젝트 | Frontend | Backend | 상태 |
|---------|----------|---------|------|
| **ClaudeAI** | https://claudeai.changups.kr | https://api-production-73f2.up.railway.app | ✅ 정상 |
| **CursorAI** | https://cursorai.changups.kr | https://api-production-089a.up.railway.app | ✅ 정상 |

### 1.2 Railway 프로젝트

| 프로젝트명 | 서비스 | 데이터베이스 |
|-----------|--------|-------------|
| claudeai-bakend | api | PostgreSQL |
| cursorai-backend | api | PostgreSQL |

---

## 2. AI 알림봇 시스템 아키텍처

### 2.1 현재 구현 (단방향) ✅

```
쇼핑몰 → 폴링(smartstore_poling) → 메시지발송(Alimbot)
```
- 워크플로우를 거치지 않고 직접 메시지 발송
- 별도 리포지토리: https://gitlab.com/frients/smartstore_poling.git

### 2.2 목표 구조 (게이트웨이 ↔ 워크플로우) 🔧 구현 필요

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   쇼핑몰    │ ←──→ │   게이트웨이    │ ←──→ │   워크플로우    │ ←──→ │  메시지발송     │
│             │      │  (API 폴링)     │      │  (조건/액션)    │      │  (Alimbot)     │
└─────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
                            │                        │
                            │   POST /api/events     │
                            └────────────────────────┘
```

---

## 3. 우측 상단 메뉴 구성 (기획)

| 메뉴 | 기능 | 구현 상태 |
|------|------|----------|
| **1. 결제** | PG사 연동, 잔액조회, 충전, 내역 | ⚠️ 부분 구현 |
| **2. 연동** | 쇼핑몰/웹페이지에서 주문·예약·신청·방문 정보 수신 → 워크플로우 전달 | ❌ 미구현 |
| **3. 메시지자동발송** | GTM 메시지 수신 → 웹훅 발동 → API 호출 → 카카오 알림톡 발송 | ⚠️ 부분 구현 |

---

## 4. 구현 필요 항목

### 4.1 게이트웨이 → 워크플로우 연동 (최우선)

**현재 문제**: smartstore_poling이 워크플로우를 거치지 않고 직접 메시지 발송

**필요 작업**:
1. `smartstore_poling`에서 CursorAI Backend의 `/api/events` 호출 추가
2. 이벤트 데이터 형식 정의 (GTM Data_Layer 형식)
3. 워크플로우에서 조건 평가 후 알림톡 발송

**수정 대상 리포지토리**: https://gitlab.com/frients/smartstore_poling.git

**호출할 API**:
```
POST https://api-production-089a.up.railway.app/api/events
Content-Type: application/json

{
  "event": "order_received",
  "email": "customer@example.com",
  "first_name": "홍길동",
  "phone_number": "01012345678",
  "orderId": "ORDER-123456",
  "orderAmount": 50000
}
```

### 4.2 멤버 추가 기능 버그 수정

**현재 문제**: 리스트 멤버 추가 시 400 Bad Request 발생

**테스트 명령**:
```bash
curl -X POST https://api-production-089a.up.railway.app/api/lists/1/members \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"테스트","phone_number":"01012345678"}'
```

**관련 파일**:
- `backend/src/main/java/com/grouptest/controller/ListController.java` (라인 133-195)
- `backend/src/main/java/com/grouptest/service/ListService.java`

**디버깅 필요**: Railway 로그 확인하여 실제 에러 원인 파악

### 4.3 GW/WF 테스트 API 구현

**현재 문제**: Frontend의 GW/WF 테스트 버튼이 호출하는 API 미구현

**필요 API**:
```
POST /api/test/gw-smartstore-poll  - 스마트스토어 폴링 시뮬레이션
POST /api/test/wf-gtm-event        - GTM 이벤트 수신 시뮬레이션
```

**관련 파일**:
- `frontend/src/components/notification/DebugLogViewer.vue` (라인 214-243)
- `backend/src/main/java/com/grouptest/controller/TestController.java` (현재 빈 파일)

---

## 5. 소스 코드 구조

### 5.1 Backend (Spring Boot)

```
backend/src/main/java/com/grouptest/
├── controller/
│   ├── AiBotController.java      # AI 알림봇 설정/템플릿 API
│   ├── EventController.java      # 이벤트 수신 API (/api/events)
│   ├── WorkflowController.java   # 워크플로우 CRUD
│   ├── ListController.java       # 리스트/멤버 관리
│   ├── WebhookTestController.java # 웹훅 테스트
│   ├── DebugLogController.java   # 디버그 로그 조회
│   └── TestController.java       # 테스트 API (구현 필요)
├── service/
│   ├── AiBotService.java         # AI 알림봇 비즈니스 로직
│   ├── EventService.java         # 이벤트 처리 + 워크플로우 트리거
│   ├── WorkflowExecutionService.java # 워크플로우 실행 엔진
│   ├── WorkflowService.java      # 워크플로우 CRUD
│   └── ListService.java          # 리스트 관리
├── entity/
│   ├── AiBotSetting.java
│   ├── AiBotTemplate.java
│   ├── Workflow.java
│   ├── EventLog.java
│   ├── WorkflowExecution.java
│   ├── ListEntity.java
│   ├── ListMember.java
│   └── DebugLog.java
└── repository/
    └── (각 Entity별 Repository)
```

### 5.2 Frontend (Vue.js)

```
frontend/src/
├── views/
│   ├── AIAlimbotView.vue         # AI 알림봇 메인 뷰
│   ├── MarketingAutomation.vue   # 마케팅자동화
│   ├── ListManager.vue           # 리스트 관리
│   └── ListDashboard.vue         # 리스트 상세
├── components/
│   └── notification/
│       ├── DashboardSection.vue  # 대시보드 (템플릿 선택)
│       ├── SettingsSection.vue   # 설정 (연동)
│       ├── PaymentSettings.vue   # 결제 설정
│       └── DebugLogViewer.vue    # GW/WF 디버그 로그
├── stores/
│   ├── notification.js           # AI 알림봇 상태관리
│   └── list.js                   # 리스트 상태관리
└── api.js                        # API 클라이언트 설정
```

---

## 6. 주요 API 엔드포인트

### 6.1 AI 알림봇 API

| HTTP | Endpoint | 설명 |
|------|----------|------|
| GET | `/api/ai-bot/settings` | 설정 조회 |
| POST | `/api/ai-bot/settings` | 설정 저장 |
| GET | `/api/ai-bot/templates` | 템플릿 목록 |
| POST | `/api/ai-bot/templates/ids` | 템플릿 선택 저장 |
| POST | `/api/ai-bot/sync-workflows` | 워크플로우 자동 생성 |

### 6.2 이벤트/워크플로우 API

| HTTP | Endpoint | 설명 |
|------|----------|------|
| POST | `/api/events` | GTM 이벤트 수신 → 워크플로우 트리거 |
| GET | `/api/workflows` | 워크플로우 목록 |
| POST | `/api/webhook-test` | 웹훅 테스트 |
| GET | `/api/debug-logs` | 디버그 로그 조회 |

### 6.3 리스트 API

| HTTP | Endpoint | 설명 |
|------|----------|------|
| GET | `/api/lists` | 리스트 목록 |
| POST | `/api/lists` | 리스트 생성 |
| GET | `/api/lists/{id}/members` | 멤버 조회 |
| POST | `/api/lists/{id}/members` | 멤버 추가 (⚠️ 버그) |

---

## 7. 외부 연동

### 7.1 Alimbot API (카카오 알림톡)

**엔드포인트**: `https://tools.alimbot.com/api/v1/msg/process`

**필요 파라미터**:
- `bizmId`: 비즈엠 ID
- `key`: API 키
- `type`: "03" (알림톡)
- `profile`: 프로필명
- `tempCode`: 템플릿 코드

### 7.2 스마트스토어 API

**리포지토리**: https://gitlab.com/frients/smartstore_poling.git

---

## 8. 개발 우선순위

### Phase 1: 버그 수정 (즉시)
1. [ ] 멤버 추가 400 에러 수정
2. [ ] Railway 로그 확인하여 원인 파악

### Phase 2: 게이트웨이 연동 (핵심)
1. [ ] smartstore_poling에서 `/api/events` 호출 추가
2. [ ] 이벤트 데이터 형식 정의
3. [ ] 워크플로우 조건 평가 테스트

### Phase 3: 테스트 API 구현
1. [ ] `POST /api/test/gw-smartstore-poll` 구현
2. [ ] `POST /api/test/wf-gtm-event` 구현
3. [ ] DebugLogViewer 테스트 버튼 동작 확인

### Phase 4: UI 개선
1. [ ] 우측 상단 메뉴 (결제, 연동, 메시지자동발송) 구현
2. [ ] 연동 설정 화면 개선

---

## 9. 배포 방법

### Backend 재배포 (Railway CLI)

```bash
cd backend
railway link --project cursorai-backend
railway up --service api --detach
```

### Frontend 재배포 (Vercel CLI)

```bash
cd frontend
vercel --prod
```

### 상세 배포 절차서

- `docs/DEPLOYMENT_STEP_BY_STEP.md`
- `docs/DEPLOYMENT_GUIDE.md`

---

## 10. 참고 문서

| 문서 | 위치 |
|------|------|
| 배포 절차서 | `docs/DEPLOYMENT_STEP_BY_STEP.md` |
| 시스템 아키텍처 | `docs/AI_ALIMBOT_SYSTEM_ARCHITECTURE.md` |
| 이 문서 | `docs/AI_ALIMBOT_DEVELOPMENT_PLAN.md` |

---

## 11. 알려진 이슈

### 11.1 멤버 추가 400 에러
- **현상**: `POST /api/lists/{id}/members` 호출 시 400 Bad Request
- **원인**: 미확인 (Railway 로그 확인 필요)
- **우회**: 현재 없음

### 11.2 GW/WF 테스트 버튼 미동작
- **현상**: DebugLogViewer의 GW 테스트, WF 테스트 버튼 클릭 시 에러
- **원인**: `/api/test/gw-smartstore-poll`, `/api/test/wf-gtm-event` API 미구현
- **우회**: curl로 직접 `/api/events` 호출하여 테스트

---

## 12. 다음 AI에게 전달 사항

1. **Railway 로그인 필요**: `railway login` 실행 후 작업
2. **두 프로젝트 독립적**: ClaudeAI와 CursorAI는 완전 분리
3. **게이트웨이는 별도 리포**: smartstore_poling 리포지토리 참조
4. **핵심 과제**: 게이트웨이 → 워크플로우 연동 구현

---

*작성일: 2025-12-28*
*작성자: Claude Code*
