# AI 알림봇 기능 분석 및 마이그레이션 가이드

**작성일**: 2025-01-XX  
**원본 배포 URL**: https://workflow.changups.kr  
**원본 백엔드 URL**: https://workflow-backend-production-cdd6.up.railway.app  
**원본 소스**: `C:\Users\hckim\frients\grouptest\workflow-automation`

**용어 통일**: 
- AIBot → **AIAlimbot**
- ai-bot → **ai-alimbot**
- 알림봇 → **알림봇** (유지)

---

## 1. 원본 소스 분석

### 1.1 Frontend 구조 (React)

#### 컴포넌트 파일
- `frontend/src/components/AIBot.js` - 메인 컴포넌트 (346줄)
- `frontend/src/components/AIBot.css` - 스타일
- `frontend/src/components/PaymentSettings.js` - 결제 설정 컴포넌트
- `frontend/src/components/DebugLogViewer.js` - 디버그 로그 뷰어

#### 주요 기능

**AIBot.js 주요 기능**:
1. **탭 관리**: 대시보드 / 설정 탭 전환
2. **업종 선택**: 쇼핑몰 / 예약 / 프랜차이즈 / 매장 (현재 쇼핑몰만 활성화)
3. **템플릿 선택**: 10개 템플릿 (주문접수, 결제완료 등)
4. **설정 저장**: 결제 설정, 연동 설정, 템플릿 선택 저장
5. **워크플로우 동기화**: 선택한 템플릿에 맞는 워크플로우 자동 생성

**템플릿 목록**:
```javascript
const shoppingTemplates = [
  { id: 1, name: '주문접수', description: '주문이 접수되었습니다', default: true },
  { id: 2, name: '결제완료', description: '결제가 완료되었습니다', default: true },
  { id: 3, name: '상품준비중', description: '상품을 준비하고 있습니다', default: true },
  { id: 4, name: '배송시작', description: '배송이 시작되었습니다', default: true },
  { id: 5, name: '배송완료', description: '배송이 완료되었습니다', default: true },
  { id: 6, name: '구매확정', description: '구매가 확정되었습니다', default: false },
  { id: 7, name: '리뷰요청', description: '리뷰를 작성해주세요', default: false },
  { id: 8, name: '재고부족', description: '재고가 부족합니다', default: false },
  { id: 9, name: '주문취소', description: '주문이 취소되었습니다', default: false },
  { id: 10, name: '환불완료', description: '환불이 완료되었습니다', default: false }
];
```

**기본 선택 템플릿**: ID 1, 2, 3, 4, 5 (주문접수, 결제완료, 상품준비중, 배송시작, 배송완료)

### 1.2 Backend API 구조 (Node.js/Express)

#### API 엔드포인트

| 메서드 | 엔드포인트 | 설명 | 요청/응답 |
|-------|-----------|------|----------|
| GET | `/api/ai-bot/settings` | 설정 조회 | 응답: `{ success: true, data: { payment: {}, integration: {} } }` |
| POST | `/api/ai-bot/settings` | 설정 저장 | 요청: `{ payment: {}, integration: {} }` |
| POST | `/api/ai-bot/integration` | 연동 설정 저장 | 요청: `{ smartstore: { enabled, apiKey, apiSecret, storeId } }` |
| GET | `/api/ai-bot/templates` | 템플릿 조회 | 응답: `{ success: true, data: [1, 2, 3, 4, 5] }` (선택된 템플릿 ID 배열) |
| POST | `/api/ai-bot/templates` | 템플릿 저장 | 요청: `{ templateIds: [1, 2, 3] }` |
| POST | `/api/ai-bot/sync-workflows` | 워크플로우 동기화 | 응답: `{ success: true, message: "N개의 워크플로우가 동기화되었습니다.", data: [...] }` |

#### 데이터베이스 테이블

**ai_bot_settings**:
```sql
CREATE TABLE ai_bot_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry TEXT NOT NULL DEFAULT 'shopping',
  payment_config TEXT,
  integration_config TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**ai_bot_templates**:
```sql
CREATE TABLE ai_bot_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry TEXT NOT NULL DEFAULT 'shopping',
  template_id INTEGER NOT NULL,
  template_name TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(industry, template_id)
)
```

### 1.3 워크플로우 동기화 로직

**템플릿 ID → 이벤트/템플릿 코드 매핑**:
```javascript
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
```

**워크플로우 생성 규칙**:
- 워크플로우 이름: `[AI알림봇] {템플릿명}`
- 웹훅 URL: `https://tools.alimbot.com/api/v1/msg/process`
- 이벤트: 템플릿에 매핑된 이벤트명
- 웹훅 파라미터: bizmId, key, type, profile, tempCode 등

---

## 2. 배포 서비스 UI 분석

### 2.1 대시보드 탭

**구조**:
1. 헤더: "AI 알림봇" 제목 + 설명
2. 업종 선택 카드: 쇼핑몰(활성) / 예약(준비중) / 프랜차이즈(준비중) / 매장(준비중)
3. 템플릿 그리드: 10개 템플릿 카드
   - 선택된 템플릿: 체크 표시 + 배경색 변경
   - 기본 템플릿: "기본" 배지 표시
4. 저장 버튼: "선택한 템플릿 저장"
5. 디버그 로그 뷰어: GW/WF 디버그 로그 표시

**템플릿 카드 UI**:
- 체크박스 (우측 상단)
- 템플릿 이름
- 템플릿 설명
- "기본" 배지 (기본 템플릿인 경우)

### 2.2 설정 탭

**구조**:
1. **1. 결제** 섹션
   - 현재 잔액 표시
   - 충전 금액 선택 (1만원, 3만원, 5만원, 10만원, 30만원, 50만원)
   - 직접 입력 필드
   - 결제 수단 선택 (신용카드, 계좌이체, 가상계좌)
   - 충전하기 버튼
   - 충전 내역 테이블

2. **2. 연동** 섹션
   - 스마트스토어 연동 활성화 체크박스
   - API Key 입력 필드
   - API Secret 입력 필드
   - 스토어 ID 입력 필드
   - 연동 설정 저장 버튼

3. **3. 템플릿 선택** 섹션
   - 템플릿 목록 (체크박스 형식)
   - 템플릿 선택 저장 버튼

---

## 3. UI 테스트 가이드

### 3.1 대시보드 탭 테스트

| 번호 | 테스트 항목 | 테스트 절차 | 예상 결과 |
|------|------------|------------|----------|
| 1.1 | 페이지 접속 | AI 알림봇 메뉴 클릭 | 대시보드 탭 표시 |
| 1.2 | 업종 선택 | 쇼핑몰 카드 클릭 | 쇼핑몰 활성화 (배경색 변경) |
| 1.3 | 템플릿 선택 | 템플릿 카드 클릭 | 체크 표시 + 배경색 변경 |
| 1.4 | 템플릿 해제 | 선택된 템플릿 재클릭 | 체크 해제 + 배경색 원복 |
| 1.5 | 템플릿 저장 | "선택한 템플릿 저장" 클릭 | 저장 성공 알림 + 워크플로우 동기화 |
| 1.6 | 기본 템플릿 확인 | 페이지 로드 시 | ID 1,2,3,4,5 템플릿 자동 선택 |

### 3.2 설정 탭 테스트

| 번호 | 테스트 항목 | 테스트 절차 | 예상 결과 |
|------|------------|------------|----------|
| 2.1 | 설정 탭 접속 | "설정" 탭 클릭 | 설정 화면 표시 |
| 2.2 | 잔액 조회 | 페이지 로드 | 현재 잔액 표시 |
| 2.3 | 충전 금액 선택 | 금액 버튼 클릭 | 선택된 금액 표시 |
| 2.4 | 직접 입력 | 금액 직접 입력 | 입력한 금액 표시 |
| 2.5 | 결제 수단 선택 | 라디오 버튼 클릭 | 선택된 결제 수단 표시 |
| 2.6 | 충전하기 | "충전하기" 버튼 클릭 | 결제 모듈 팝업 (포트원) |
| 2.7 | 충전 내역 조회 | 페이지 로드 | 충전 내역 테이블 표시 |
| 2.8 | 연동 활성화 | 체크박스 클릭 | API Key/Secret/Store ID 입력 필드 표시 |
| 2.9 | 연동 설정 저장 | "연동 설정 저장" 클릭 | 저장 성공 알림 |
| 2.10 | 템플릿 선택 (설정) | 체크박스 클릭 | 템플릿 선택/해제 |
| 2.11 | 템플릿 저장 (설정) | "템플릿 선택 저장" 클릭 | 저장 성공 알림 |

### 3.3 워크플로우 동기화 테스트

| 번호 | 테스트 항목 | 테스트 절차 | 예상 결과 |
|------|------------|------------|----------|
| 3.1 | 템플릿 저장 후 동기화 | 템플릿 저장 클릭 | 워크플로우 자동 생성/업데이트 |
| 3.2 | 워크플로우 확인 | 마케팅자동화 → 워크플로우 | `[AI알림봇] 주문접수` 등 생성 확인 |
| 3.3 | 워크플로우 이름 형식 | 생성된 워크플로우 확인 | `[AI알림봇] {템플릿명}` 형식 |
| 3.4 | 워크플로우 이벤트 | 워크플로우 편집 | 이벤트명이 템플릿에 매핑된 이벤트 |

---

## 4. 마이그레이션 개발 계획

### 4.1 데이터베이스 스키마

**파일**: `backend/database.js` 또는 마이그레이션 파일

```javascript
// ai_alimbot_settings 테이블
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

// ai_alimbot_templates 테이블
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
```

### 4.2 Backend API 구현

**파일**: `backend/routes/ai-alimbot/index.js` (새로 생성)

**구현할 API**:
1. `GET /api/ai-alimbot/settings` - 설정 조회
2. `POST /api/ai-alimbot/settings` - 설정 저장
3. `POST /api/ai-alimbot/integration` - 연동 설정 저장
4. `GET /api/ai-alimbot/templates` - 템플릿 조회
5. `POST /api/ai-alimbot/templates` - 템플릿 저장
6. `POST /api/ai-alimbot/sync-workflows` - 워크플로우 동기화

### 4.3 Frontend 컴포넌트 구현

**파일 구조**:
```
frontend/src/
├── views/
│   └── ai-alimbot/
│       └── AIAlimbotView.vue          # 메인 뷰 (탭 관리)
├── components/
│   └── ai-alimbot/
│       ├── AIAlimbotDashboard.vue     # 대시보드 탭
│       ├── AIAlimbotSettings.vue      # 설정 탭
│       ├── TemplateSelector.vue       # 템플릿 선택 컴포넌트
│       ├── PaymentSettings.vue       # 결제 설정 컴포넌트
│       └── DebugLogViewer.vue         # 디버그 로그 뷰어
```

### 4.4 개발 순서

**Phase 1: 데이터베이스 및 백엔드 API (우선순위: 높음)**
1. DB 스키마 생성
2. 백엔드 API 구현 (6개 엔드포인트)
3. API 테스트 (Postman/curl)

**Phase 2: 프론트엔드 기본 구조 (우선순위: 높음)**
1. AIAlimbotView.vue 생성 (탭 전환)
2. AIAlimbotDashboard.vue 생성 (템플릿 선택)
3. 기본 UI 구현

**Phase 3: 설정 기능 (우선순위: 중간)**
1. AIAlimbotSettings.vue 생성
2. PaymentSettings.vue 구현
3. 연동 설정 구현

**Phase 4: 워크플로우 동기화 (우선순위: 높음)**
1. sync-workflows API 구현
2. 프론트엔드 연동
3. 테스트

**Phase 5: 디버그 로그 (우선순위: 낮음)**
1. DebugLogViewer.vue 구현
2. 필터 기능
3. 자동 새로고침

---

## 5. 원본 vs 마이그레이션 비교 체크리스트

### 5.1 기능 비교

| 기능 | 원본 (React) | 마이그레이션 (Vue.js) | 상태 |
|------|-------------|---------------------|------|
| 대시보드 탭 | ✅ | ❌ | 개발 필요 |
| 설정 탭 | ✅ | ❌ | 개발 필요 |
| 템플릿 선택 | ✅ | ❌ | 개발 필요 |
| 템플릿 저장 | ✅ | ❌ | 개발 필요 |
| 워크플로우 동기화 | ✅ | ❌ | 개발 필요 |
| 결제 설정 | ✅ | ❌ | 개발 필요 |
| 연동 설정 | ✅ | ❌ | 개발 필요 |
| 디버그 로그 | ✅ | ❌ | 개발 필요 |

### 5.2 API 비교

| API | 원본 엔드포인트 | 마이그레이션 엔드포인트 | 상태 |
|-----|---------------|---------------------|------|
| 설정 조회 | `/api/ai-bot/settings` | `/api/ai-alimbot/settings` | 개발 필요 |
| 설정 저장 | `/api/ai-bot/settings` | `/api/ai-alimbot/settings` | 개발 필요 |
| 연동 설정 | `/api/ai-bot/integration` | `/api/ai-alimbot/integration` | 개발 필요 |
| 템플릿 조회 | `/api/ai-bot/templates` | `/api/ai-alimbot/templates` | 개발 필요 |
| 템플릿 저장 | `/api/ai-bot/templates` | `/api/ai-alimbot/templates` | 개발 필요 |
| 워크플로우 동기화 | `/api/ai-bot/sync-workflows` | `/api/ai-alimbot/sync-workflows` | 개발 필요 |

**용어 변경**: `ai-bot` → `ai-alimbot`

---

## 6. 즉시 개발 시작 계획

### Step 1: 데이터베이스 스키마 생성 (지금)
- `ai_alimbot_settings` 테이블 생성
- `ai_alimbot_templates` 테이블 생성

### Step 2: 백엔드 API 구현 (다음)
- 6개 API 엔드포인트 구현
- 원본과 동일한 로직 구현

### Step 3: 프론트엔드 구현 (그 다음)
- Vue.js 3 컴포넌트 구현
- 원본과 동일한 UI/UX

---

**다음 단계**: 데이터베이스 스키마부터 생성하고, 백엔드 API를 구현한 후, 프론트엔드를 구현하겠습니다.

**질문**: 지금 바로 개발을 시작할까요? 아니면 추가로 확인할 사항이 있나요?

