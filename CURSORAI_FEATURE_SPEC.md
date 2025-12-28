# cursorAI 프로젝트 기능명세서

**버전**: 1.0  
**작성일**: 2025-12-27  
**프로젝트**: cursorAI (AI 알림봇)  
**기술 스택**: Vue.js 3 + Node.js/Express + SQLite  
**원본 프로젝트**: workflow-automation (React)  
**원본 배포 URL**: https://grouptest.changups.kr

---

## 프로젝트 개요

cursorAI는 기존 React 기반 AI 알림봇 기능을 Vue.js 3로 마이그레이션한 프로젝트입니다.

### 프로젝트 구조

```
cursorAI/
├── frontend/              # Vue.js 3 프론트엔드
│   ├── src/
│   │   ├── views/
│   │   │   └── AIAlimbotView.vue      # 메인 뷰 (탭 관리)
│   │   ├── components/
│   │   │   └── ai-alimbot/
│   │   │       ├── AIAlimbotDashboard.vue    # 대시보드 컴포넌트
│   │   │       └── AIAlimbotSettings.vue     # 설정 컴포넌트
│   │   ├── components/
│   │   │   ├── PaymentSettings.vue          # 결제 설정 컴포넌트
│   │   │   └── DebugLogViewer.vue           # 디버그 로그 뷰어
│   │   ├── stores/
│   │   │   └── aiAlimbot.js                  # Pinia Store
│   │   └── router/
│   │       └── index.js                      # 라우터 설정
│   └── vercel.json                           # Vercel 배포 설정
└── backend/               # Node.js/Express 백엔드
    ├── routes/
    │   └── ai-alimbot/
    │       └── index.js                      # API 라우터
    ├── database.js                           # 데이터베이스 스키마
    └── server.js                             # Express 서버
```

---

## 기능 목록

### 1. AI 알림봇 대시보드

| 기능 ID | 기능명 | 세부기능 | 설명 | API 엔드포인트 |
|---------|--------|---------|------|----------------|
| A.1 | 대시보드 표시 | 페이지 접속 | `/ai-bot` 경로 접속 시 대시보드 표시 | - |
| A.2 | 업종 선택 | 업종 카드 표시 | 쇼핑몰, 예약, 프랜차이즈, 매장 카드 표시 | - |
| A.3 | 업종 선택 | 쇼핑몰 활성화 | 쇼핑몰 업종만 활성화, 나머지는 "준비중" | - |
| A.4 | 템플릿 표시 | 템플릿 그리드 | 10개 템플릿을 그리드 형태로 표시 | GET /api/ai-alimbot/templates |
| A.5 | 템플릿 선택 | 템플릿 클릭 | 템플릿 카드 클릭 시 선택/해제 | - |
| A.6 | 템플릿 선택 | 기본 템플릿 | ID 1,2,3,4,5가 기본 선택됨 | - |
| A.7 | 템플릿 저장 | 저장 버튼 | 선택한 템플릿 저장 | POST /api/ai-alimbot/templates |
| A.8 | 디버그 로그 | 로그 뷰어 | 디버그 로그 표시 | - |

### 2. AI 알림봇 설정

| 기능 ID | 기능명 | 세부기능 | 설명 | API 엔드포인트 |
|---------|--------|---------|------|----------------|
| B.1 | 결제 설정 | 결제 섹션 | 포트원 연동 결제 설정 UI | GET /api/ai-alimbot/settings |
| B.2 | 결제 설정 | 잔액 표시 | 현재 잔액 표시 | - |
| B.3 | 결제 설정 | 충전 금액 선택 | 충전 금액 선택 드롭다운 | - |
| B.4 | 결제 설정 | 결제 방법 | 결제 방법 선택 | - |
| B.5 | 결제 설정 | 충전 내역 | 충전 내역 테이블 | - |
| B.6 | 연동 설정 | 스마트스토어 | 스마트스토어 연동 활성화 체크박스 | POST /api/ai-alimbot/integration |
| B.7 | 연동 설정 | API Key | 스마트스토어 API Key 입력 | POST /api/ai-alimbot/integration |
| B.8 | 연동 설정 | API Secret | 스마트스토어 API Secret 입력 | POST /api/ai-alimbot/integration |
| B.9 | 연동 설정 | Store ID | 스마트스토어 Store ID 입력 | POST /api/ai-alimbot/integration |
| B.10 | 연동 설정 | 저장 버튼 | 연동 설정 저장 | POST /api/ai-alimbot/integration |
| B.11 | 템플릿 선택 | 템플릿 리스트 | 10개 템플릿 체크박스 리스트 | GET /api/ai-alimbot/templates |
| B.12 | 템플릿 선택 | 템플릿 선택/해제 | 체크박스로 템플릿 선택 | - |
| B.13 | 템플릿 선택 | 저장 버튼 | 선택한 템플릿 저장 | POST /api/ai-alimbot/templates |

### 3. 템플릿 관리

| 템플릿 ID | 템플릿명 | 설명 | 기본 선택 |
|-----------|---------|------|-----------|
| 1 | 주문접수 | 주문이 접수되었습니다 | ✅ |
| 2 | 결제완료 | 결제가 완료되었습니다 | ✅ |
| 3 | 상품준비중 | 상품을 준비하고 있습니다 | ✅ |
| 4 | 배송시작 | 배송이 시작되었습니다 | ✅ |
| 5 | 배송완료 | 배송이 완료되었습니다 | ✅ |
| 6 | 구매확정 | 구매가 확정되었습니다 | ❌ |
| 7 | 리뷰요청 | 리뷰를 작성해주세요 | ❌ |
| 8 | 재고부족 | 재고가 부족합니다 | ❌ |
| 9 | 주문취소 | 주문이 취소되었습니다 | ❌ |
| 10 | 환불완료 | 환불이 완료되었습니다 | ❌ |

### 4. 워크플로우 동기화

| 기능 ID | 기능명 | 설명 | API 엔드포인트 |
|---------|--------|------|----------------|
| C.1 | 워크플로우 생성 | 선택한 템플릿에 맞는 워크플로우 자동 생성 | POST /api/ai-alimbot/sync-workflows |
| C.2 | 워크플로우 업데이트 | 기존 워크플로우가 있으면 업데이트 | POST /api/ai-alimbot/sync-workflows |
| C.3 | 워크플로우 이름 | `[AI알림봇] {템플릿명}` 형식 | - |
| C.4 | 웹훅 URL | `https://tools.alimbot.com/api/v1/msg/process` | - |

---

## API 엔드포인트 상세

### 1. 설정 조회
- **Method**: GET
- **URL**: `/api/ai-alimbot/settings`
- **Response**:
```json
{
  "success": true,
  "data": {
    "payment": {},
    "integration": {
      "smartstore": {
        "enabled": false,
        "apiKey": "",
        "apiSecret": "",
        "storeId": ""
      }
    }
  }
}
```

### 2. 설정 저장
- **Method**: POST
- **URL**: `/api/ai-alimbot/settings`
- **Request Body**:
```json
{
  "payment": {},
  "integration": {
    "smartstore": {
      "enabled": true,
      "apiKey": "...",
      "apiSecret": "...",
      "storeId": "..."
    }
  }
}
```

### 3. 연동 설정 저장
- **Method**: POST
- **URL**: `/api/ai-alimbot/integration`
- **Request Body**:
```json
{
  "smartstore": {
    "enabled": true,
    "apiKey": "...",
    "apiSecret": "...",
    "storeId": "..."
  }
}
```

### 4. 템플릿 조회
- **Method**: GET
- **URL**: `/api/ai-alimbot/templates`
- **Response**:
```json
{
  "success": true,
  "data": [1, 2, 3, 4, 5]
}
```

### 5. 템플릿 저장
- **Method**: POST
- **URL**: `/api/ai-alimbot/templates`
- **Request Body**:
```json
{
  "templateIds": [1, 2, 3, 4, 5]
}
```

### 6. 워크플로우 동기화
- **Method**: POST
- **URL**: `/api/ai-alimbot/sync-workflows`
- **Response**:
```json
{
  "success": true,
  "message": "5개의 워크플로우가 동기화되었습니다.",
  "data": [
    { "id": 1, "name": "[AI알림봇] 주문접수", "action": "created" }
  ]
}
```

---

## 데이터베이스 스키마

### ai_alimbot_settings 테이블
```sql
CREATE TABLE IF NOT EXISTS ai_alimbot_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry TEXT NOT NULL DEFAULT 'shopping',
  payment_config TEXT,
  integration_config TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ai_alimbot_templates 테이블
```sql
CREATE TABLE IF NOT EXISTS ai_alimbot_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry TEXT NOT NULL DEFAULT 'shopping',
  template_id INTEGER NOT NULL,
  template_name TEXT NOT NULL,
  is_selected INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(industry, template_id)
);
```

---

## UI/UX 규칙

### 1. 탭 네비게이션
- 대시보드 / 설정 탭 전환
- 활성 탭 하단 보더 표시

### 2. 업종 선택 카드
- 4개 업종 카드 (쇼핑몰, 예약, 프랜차이즈, 매장)
- 쇼핑몰만 활성화, 나머지는 "준비중" 표시
- 활성 카드 보더 색상 변경

### 3. 템플릿 그리드
- 10개 템플릿을 그리드 형태로 표시
- 선택된 템플릿 배경색 변경
- 체크박스 아이콘 표시

### 4. 설정 섹션
- 결제 / 연동 / 템플릿 선택 섹션 구분
- 각 섹션별 저장 버튼

---

**작성 완료 - 시험절차서 작성 진행 중**

