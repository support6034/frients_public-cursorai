# AI 알림봇 현재 상태 및 데모 가이드

**작성일**: 2025-01-XX  
**원본 배포**: https://workflow.changups.kr  
**로컬 개발**: http://localhost:5173/ai-bot

---

## 📊 현재 구현 상태 요약

### ✅ 완료된 작업 (코드 레벨)

#### 백엔드 (100% 완료)
- ✅ **6개 API 엔드포인트** 구현 완료
  - `GET /api/ai-alimbot/settings` - 설정 조회
  - `POST /api/ai-alimbot/settings` - 설정 저장
  - `POST /api/ai-alimbot/integration` - 연동 설정 저장
  - `GET /api/ai-alimbot/templates` - 템플릿 조회
  - `POST /api/ai-alimbot/templates` - 템플릿 저장
  - `POST /api/ai-alimbot/sync-workflows` - 워크플로우 동기화

- ✅ **데이터베이스 스키마** 생성 완료
  - `ai_alimbot_settings` 테이블
  - `ai_alimbot_templates` 테이블

- ✅ **라우터 등록** 완료
  - `server.js`에 `/api/ai-alimbot` 라우터 등록

#### 프론트엔드 (100% 완료)
- ✅ **메인 뷰** (`AIAlimbotView.vue`)
  - 탭 네비게이션 (대시보드/설정)
  - 상태 관리 (템플릿 선택, 설정)

- ✅ **대시보드 컴포넌트** (`AIAlimbotDashboard.vue`)
  - 업종 선택 카드 (4개)
  - 템플릿 그리드 (10개)
  - 템플릿 선택/해제 기능
  - 디버그 로그 뷰어

- ✅ **설정 컴포넌트** (`AIAlimbotSettings.vue`)
  - 결제 설정 섹션
  - 연동 설정 섹션
  - 템플릿 선택 섹션

- ✅ **보조 컴포넌트**
  - `PaymentSettings.vue` - 결제 설정
  - `DebugLogViewer.vue` - 디버그 로그

- ✅ **상태 관리** (`stores/aiAlimbot.js`)
  - Pinia Store로 상태 관리

- ✅ **라우터 설정**
  - `/ai-bot` → `AIAlimbotView`

### ⚠️ 테스트 및 검증 필요 (동작 확인)

- [ ] **서버 실행 확인**
  - 백엔드 서버가 포트 5000에서 실행되는지
  - 프론트엔드 서버가 포트 5173에서 실행되는지

- [ ] **기능 동작 확인**
  - 템플릿 선택/해제가 정상 동작하는지
  - 템플릿 저장이 정상 동작하는지
  - 설정 저장이 정상 동작하는지
  - 워크플로우 동기화가 정상 동작하는지

- [ ] **원본과 비교**
  - UI/UX가 원본과 동일한지
  - 기능 동작이 원본과 동일한지

---

## 🔍 목표 기능 vs 현재 구현 비교

### 1. 템플릿 관리 기능

#### 목표 (원본)
- **10개 템플릿** 표시 및 관리
- **기본 템플릿 5개** 자동 선택 (ID: 1,2,3,4,5)
- 템플릿 **선택/해제** 기능
- 템플릿 **저장** 기능
- 저장 시 **워크플로우 자동 동기화**

#### 현재 구현
- ✅ 10개 템플릿 정의 완료
- ✅ 기본 템플릿 자동 선택 로직 구현
- ✅ 템플릿 선택/해제 UI 구현
- ✅ 템플릿 저장 API 구현
- ✅ 워크플로우 동기화 로직 구현
- ⚠️ **실제 동작 테스트 필요**

**차이점**: 없음 (코드 레벨에서는 동일)

---

### 2. 설정 관리 기능

#### 목표 (원본)
- **결제 설정**: 잔액 조회, 충전 기능 (포트원 연동)
- **연동 설정**: 스마트스토어 API Key, Secret, Store ID
- **템플릿 선택**: 설정 탭에서도 템플릿 선택 가능

#### 현재 구현
- ✅ 결제 설정 UI 구현 (`PaymentSettings.vue`)
- ✅ 연동 설정 UI 구현 (`AIAlimbotSettings.vue`)
- ✅ 템플릿 선택 UI 구현
- ✅ 설정 저장 API 구현
- ⚠️ **포트원 연동 테스트 필요**

**차이점**: 포트원 연동은 코드는 있으나 실제 결제 테스트 필요

---

### 3. 워크플로우 동기화 기능

#### 목표 (원본)
- 선택된 템플릿에 맞는 워크플로우 **자동 생성/업데이트**
- 워크플로우 이름: `[AI알림봇] {템플릿명}`
- 웹훅 URL: `https://tools.alimbot.com/api/v1/msg/process`
- 이벤트명 매핑: 템플릿 ID → 이벤트명

#### 현재 구현
- ✅ 워크플로우 동기화 로직 구현
- ✅ 템플릿 ID → 이벤트명 매핑 구현
- ✅ 웹훅 URL 설정 구현
- ✅ 워크플로우 생성/업데이트 로직 구현
- ⚠️ **실제 워크플로우 생성 확인 필요**

**차이점**: 없음 (코드 레벨에서는 동일)

---

### 4. 디버그 로그 뷰어

#### 목표 (원본)
- GW/WF 디버그 로그 표시
- 필터링 기능 (컴포넌트, 방향, 개수)
- 자동 새로고침 (3초)
- GW/WF 테스트 버튼

#### 현재 구현
- ✅ 디버그 로그 뷰어 컴포넌트 구현
- ✅ 필터링 기능 구현
- ✅ 자동 새로고침 기능 구현
- ✅ 테스트 버튼 구현
- ⚠️ **실제 로그 표시 확인 필요**

**차이점**: 없음 (코드 레벨에서는 동일)

---

## 🎯 핵심 차이점 요약

### 기술 스택 차이 (의도된 변경)
| 항목 | 원본 | 현재 구현 | 비고 |
|------|------|----------|------|
| Frontend | React.js | Vue.js 3 | ✅ 목표 달성 |
| State | useState | Pinia Store | ✅ 목표 달성 |
| API 경로 | `/api/ai-bot/*` | `/api/ai-alimbot/*` | ✅ 용어 통일 |

### 기능 차이 (없음)
- **모든 기능이 코드 레벨에서 구현 완료**
- **차이점은 없으며, 실제 동작 확인만 필요**

### 미완성 항목
- ❌ **실제 서버 실행 및 테스트**
- ❌ **원본과 UI/UX 비교**
- ❌ **기능 동작 검증**

---

## 📝 단계별 데모 진행 가이드

### Step 1: 서버 실행 확인

#### 1.1 백엔드 서버 실행

**명령어**:
```bash
cd C:\Users\hckim\frients_public\cursorAI\backend
node server.js
```

**확인 사항**:
- ✅ 콘솔에 "서버가 포트 5000에서 실행중입니다." 메시지
- ✅ 에러 메시지 없음
- ✅ 데이터베이스 파일 생성 확인 (`database.db`)

**예상 출력**:
```
서버가 포트 5000에서 실행중입니다.
이벤트 수신 URL: http://localhost:5000/api/events
```

#### 1.2 프론트엔드 서버 실행

**명령어**:
```bash
cd C:\Users\hckim\frients_public\cursorAI\frontend
npm run dev
```

**확인 사항**:
- ✅ Vite 개발 서버 시작
- ✅ 포트 5173에서 실행
- ✅ 빌드 에러 없음

**예상 출력**:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 2: 대시보드 탭 데모

#### 2.1 페이지 접속

1. 브라우저에서 `http://localhost:5173/ai-bot` 접속
2. 또는 메인 페이지에서 "AI 알림봇" 메뉴 클릭

**원본 비교**:
- 원본: https://workflow.changups.kr/ai-bot
- 신규: http://localhost:5173/ai-bot

**확인 사항**:
- [ ] 헤더 디자인 동일 (그라데이션 배경)
- [ ] 탭 네비게이션 동일 (대시보드/설정)
- [ ] 업종 선택 카드 4개 표시
- [ ] 템플릿 그리드 10개 표시

#### 2.2 기본 템플릿 자동 선택 확인

**원본 동작**:
- 페이지 로드 시 ID 1,2,3,4,5 템플릿이 자동으로 선택됨
- 선택된 템플릿은 체크 표시(✓)와 배경색 변경

**신규 확인**:
- [ ] 페이지 로드 시 기본 템플릿 5개가 선택되어 있는지
- [ ] 선택된 템플릿에 체크 표시가 있는지
- [ ] 선택된 템플릿의 배경색이 변경되었는지

**API 확인** (브라우저 Console):
```javascript
fetch('http://localhost:5000/api/ai-alimbot/templates')
  .then(r => r.json())
  .then(d => console.log('템플릿:', d))
```

**예상 결과**:
```json
{
  "success": true,
  "data": [1, 2, 3, 4, 5]
}
```

#### 2.3 템플릿 선택/해제 테스트

**테스트 시나리오**:
1. "구매확정" 템플릿 카드 클릭
   - ✅ 체크 표시(✓) 나타남
   - ✅ 배경색 변경됨
2. 다시 클릭
   - ✅ 체크 표시 사라짐
   - ✅ 배경색 원래대로

**원본과 비교**:
- 원본: 동일한 동작
- 신규: 동일한 동작 확인 필요

#### 2.4 템플릿 저장 테스트

**테스트 시나리오**:
1. 템플릿 선택 (예: 1,2,3,4,5,6)
2. "선택한 템플릿 저장" 버튼 클릭
3. 성공 알림 확인: "설정이 저장되었습니다."
4. 워크플로우 동기화 메시지 확인

**API 확인**:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/templates', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({templateIds: [1,2,3,4,5,6]})
})
.then(r => r.json())
.then(d => console.log('저장 결과:', d))
```

**예상 결과**:
```json
{
  "success": true,
  "message": "템플릿이 저장되었습니다."
}
```

---

### Step 3: 설정 탭 데모

#### 3.1 설정 탭 접속

1. 상단 "설정" 탭 클릭
2. 설정 화면 표시 확인

**원본과 비교**:
- 원본: 3개 섹션 (결제, 연동, 템플릿 선택)
- 신규: 동일한 3개 섹션 확인

#### 3.2 연동 설정 테스트

**테스트 시나리오**:
1. "스마트스토어 연동 활성화" 체크박스 클릭
   - ✅ API Key, API Secret, Store ID 입력 필드 표시
2. 테스트 값 입력:
   - API Key: `test-api-key-123`
   - API Secret: `test-secret-456`
   - Store ID: `test-store-789`
3. "연동 설정 저장" 버튼 클릭
   - ✅ 저장 성공 알림

**API 확인**:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/integration', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    smartstore: {
      enabled: true,
      apiKey: 'test-api-key-123',
      apiSecret: 'test-secret-456',
      storeId: 'test-store-789'
    }
  })
})
.then(r => r.json())
.then(d => console.log('연동 설정 저장:', d))
```

**저장 확인**:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/settings')
  .then(r => r.json())
  .then(d => console.log('설정 조회:', d))
```

---

### Step 4: 워크플로우 동기화 데모

#### 4.1 워크플로우 동기화 실행

**테스트 시나리오**:
1. 템플릿 선택 (예: 주문접수, 결제완료)
2. "선택한 템플릿 저장" 클릭
3. 워크플로우 동기화 자동 실행

**API 확인**:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/sync-workflows', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
})
.then(r => r.json())
.then(d => console.log('워크플로우 동기화:', d))
```

**예상 결과**:
```json
{
  "success": true,
  "message": "2개의 워크플로우가 동기화되었습니다.",
  "data": [
    {"id": 1, "name": "[AI알림봇] 주문접수", "action": "created"},
    {"id": 2, "name": "[AI알림봇] 결제완료", "action": "created"}
  ]
}
```

#### 4.2 생성된 워크플로우 확인

**확인 방법**:
1. 브라우저에서 "마케팅자동화" 메뉴 클릭
2. 생성된 워크플로우 확인:
   - `[AI알림봇] 주문접수`
   - `[AI알림봇] 결제완료`

**API 확인**:
```javascript
fetch('http://localhost:5000/api/workflows')
  .then(r => r.json())
  .then(d => {
    const aiWorkflows = d.data.filter(w => w.name.includes('[AI알림봇]'));
    console.log('AI 알림봇 워크플로우:', aiWorkflows);
  })
```

---

## 🔄 원본과 비교 체크리스트

### UI/UX 비교

| 항목 | 원본 | 신규 | 상태 |
|------|------|------|------|
| 헤더 디자인 | 그라데이션 배경 | 동일 | 확인 필요 |
| 탭 네비게이션 | 대시보드/설정 | 동일 | 확인 필요 |
| 업종 선택 카드 | 4개 카드 | 동일 | 확인 필요 |
| 템플릿 그리드 | 10개 그리드 | 동일 | 확인 필요 |
| 템플릿 카드 디자인 | 체크박스 + 배경색 | 동일 | 확인 필요 |
| 설정 화면 레이아웃 | 3개 섹션 | 동일 | 확인 필요 |

### 기능 동작 비교

| 기능 | 원본 | 신규 | 상태 |
|------|------|------|------|
| 템플릿 선택/해제 | ✅ | ✅ | 확인 필요 |
| 템플릿 저장 | ✅ | ✅ | 확인 필요 |
| 설정 저장 | ✅ | ✅ | 확인 필요 |
| 워크플로우 동기화 | ✅ | ✅ | 확인 필요 |
| 기본 템플릿 자동 선택 | ✅ | ✅ | 확인 필요 |

---

## 🎬 데모 실행 순서

### 1단계: 서버 실행
```bash
# 터미널 1 - 백엔드
cd C:\Users\hckim\frients_public\cursorAI\backend
node server.js

# 터미널 2 - 프론트엔드
cd C:\Users\hckim\frients_public\cursorAI\frontend
npm run dev
```

### 2단계: 브라우저 접속
- `http://localhost:5173/ai-bot` 접속

### 3단계: 기능 테스트
1. 대시보드 탭 확인
2. 템플릿 선택/해제 테스트
3. 템플릿 저장 테스트
4. 설정 탭 확인
5. 연동 설정 저장 테스트
6. 워크플로우 동기화 확인

### 4단계: 원본과 비교
- 원본: https://workflow.changups.kr/ai-bot
- 신규: http://localhost:5173/ai-bot
- 두 화면을 나란히 비교

---

## 📌 결론

### 현재 상태
- ✅ **코드 레벨**: 100% 완료
- ⚠️ **동작 확인**: 필요
- ⚠️ **원본 비교**: 필요

### 차이점
- **기능 차이**: 없음 (모든 기능 구현 완료)
- **기술 스택 차이**: React → Vue.js 3 (의도된 변경)
- **API 경로 차이**: `/api/ai-bot/*` → `/api/ai-alimbot/*` (용어 통일)

### 다음 단계
1. 서버 실행 및 기능 테스트
2. 원본과 UI/UX 비교
3. 발견된 버그 수정
4. 완성도 향상

---

**현재 상태 및 데모 가이드 작성 완료**

