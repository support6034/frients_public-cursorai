# AI 알림봇 기능 비교 및 데모 가이드

**작성일**: 2025-01-XX  
**목표**: 원본 React 서비스와 동일한 기능을 Vue.js 3로 구현  
**원본 배포 URL**: https://workflow.changups.kr  
**로컬 개발 URL**: http://localhost:5173/ai-bot

---

## 1. 목표 개발 기능 vs 현재 구현 상태

### 1.1 목표 개발 기능 (원본 기준)

#### 핵심 기능
1. **템플릿 관리**
   - 10개 템플릿 표시 (주문접수, 결제완료, 상품준비중, 배송시작, 배송완료, 구매확정, 리뷰요청, 재고부족, 주문취소, 환불완료)
   - 기본 템플릿 5개 자동 선택 (ID: 1,2,3,4,5)
   - 템플릿 선택/해제 기능
   - 템플릿 저장 기능

2. **설정 관리**
   - 결제 설정 (포트원 연동)
   - 스마트스토어 연동 설정 (API Key, Secret, Store ID)
   - 템플릿 선택 설정

3. **워크플로우 동기화**
   - 선택된 템플릿에 맞는 워크플로우 자동 생성/업데이트
   - 워크플로우 이름: `[AI알림봇] {템플릿명}`
   - 웹훅 URL: `https://tools.alimbot.com/api/v1/msg/process`

4. **디버그 로그 뷰어**
   - GW/WF 디버그 로그 표시
   - 필터링 기능 (컴포넌트, 방향, 개수)
   - 자동 새로고침 (3초)

### 1.2 현재 구현 상태

#### ✅ 구현 완료
- [x] 백엔드 API 6개 엔드포인트
- [x] 프론트엔드 컴포넌트 구조
- [x] 데이터베이스 스키마
- [x] 기본 UI 레이아웃

#### ⚠️ 테스트 및 검증 필요
- [ ] 실제 동작 확인
- [ ] 원본과 UI/UX 비교
- [ ] 기능 동작 검증
- [ ] 에러 처리 확인

---

## 2. 차이점 분석

### 2.1 기술 스택 차이

| 항목 | 원본 | 신규 구현 | 상태 |
|------|------|----------|------|
| Frontend | React.js | Vue.js 3 (Composition API) | ✅ 완료 |
| State Management | React useState | Pinia Store | ✅ 완료 |
| Routing | React Router | Vue Router | ✅ 완료 |
| Backend | Node.js/Express | Node.js/Express | ✅ 완료 |
| Database | SQLite | SQLite | ✅ 완료 |

### 2.2 기능별 차이점

#### 템플릿 관리
- **원본**: React 컴포넌트로 구현, `useState`로 상태 관리
- **신규**: Vue 컴포넌트로 구현, Pinia Store로 상태 관리
- **차이점**: 기술 스택만 다르고 기능은 동일

#### 설정 관리
- **원본**: React 컴포넌트로 구현
- **신규**: Vue 컴포넌트로 구현
- **차이점**: 기술 스택만 다르고 기능은 동일

#### API 엔드포인트
- **원본**: `/api/ai-bot/*`
- **신규**: `/api/ai-alimbot/*` (용어 통일)
- **차이점**: 경로만 다르고 로직은 동일

### 2.3 미구현/부족한 부분

#### ❌ 아직 구현되지 않은 기능
없음 (모든 기능 구현 완료)

#### ⚠️ 테스트 및 검증 필요
1. **실제 동작 확인**
   - 서버 실행 및 접속 확인
   - API 호출 동작 확인
   - 데이터 저장/조회 확인

2. **UI/UX 검증**
   - 원본과 스타일 비교
   - 레이아웃 비교
   - 인터랙션 비교

3. **기능 검증**
   - 템플릿 선택/저장 동작
   - 설정 저장 동작
   - 워크플로우 동기화 동작

---

## 3. 단계별 데모 가이드

### Step 1: 환경 설정 및 서버 실행

#### 1.1 백엔드 서버 실행

```bash
# 터미널 1
cd C:\Users\hckim\frients_public\cursorAI\backend
npm install  # 의존성 설치 (필요시)
node server.js
```

**확인 사항**:
- ✅ 서버가 포트 5000에서 실행되는지 확인
- ✅ 콘솔에 "서버가 포트 5000에서 실행중입니다." 메시지 확인
- ✅ 데이터베이스 테이블 생성 확인

**예상 출력**:
```
서버가 포트 5000에서 실행중입니다.
이벤트 수신 URL: http://localhost:5000/api/events
```

#### 1.2 프론트엔드 서버 실행

```bash
# 터미널 2
cd C:\Users\hckim\frients_public\cursorAI\frontend
npm install  # 의존성 설치 (필요시)
npm run dev
```

**확인 사항**:
- ✅ 서버가 포트 5173에서 실행되는지 확인
- ✅ Vite 개발 서버 시작 확인

**예상 출력**:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### 1.3 브라우저 접속

1. 브라우저에서 `http://localhost:5173` 접속
2. 상단 메뉴에서 "AI 알림봇" 클릭
3. 또는 직접 `http://localhost:5173/ai-bot` 접속

**확인 사항**:
- ✅ 페이지가 정상적으로 로드되는지 확인
- ✅ 에러 메시지가 없는지 확인 (F12 → Console 탭)

---

### Step 2: 대시보드 탭 데모

#### 2.1 기본 화면 확인

**원본 (https://workflow.changups.kr)**:
- 헤더: "AI 알림봇" 제목 + "쇼핑몰 주문 알림톡 자동 발송" 설명
- 탭: "대시보드" / "설정"
- 업종 선택 카드: 4개 (쇼핑몰/예약/프랜차이즈/매장)
- 템플릿 그리드: 10개 템플릿 카드

**신규 (http://localhost:5173/ai-bot)**:
- [ ] 동일한 헤더 디자인 확인
- [ ] 동일한 탭 네비게이션 확인
- [ ] 동일한 업종 선택 카드 확인
- [ ] 동일한 템플릿 그리드 확인

#### 2.2 기본 템플릿 자동 선택 확인

**원본**:
- 페이지 로드 시 ID 1,2,3,4,5 템플릿이 자동으로 선택됨
- 선택된 템플릿은 체크 표시(✓)와 배경색 변경

**신규**:
- [ ] 페이지 로드 시 기본 템플릿 5개가 선택되어 있는지 확인
- [ ] 선택된 템플릿에 체크 표시가 있는지 확인
- [ ] 선택된 템플릿의 배경색이 변경되었는지 확인

**확인 방법**:
1. 브라우저 개발자 도구(F12) → Console 탭
2. 다음 코드 실행하여 API 호출 확인:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/templates')
  .then(r => r.json())
  .then(d => console.log('템플릿:', d))
```

#### 2.3 템플릿 선택/해제 테스트

**테스트 시나리오**:
1. "구매확정" 템플릿 카드 클릭
   - ✅ 체크 표시(✓) 나타남
   - ✅ 배경색 변경됨
2. 다시 클릭
   - ✅ 체크 표시 사라짐
   - ✅ 배경색 원래대로 돌아옴
3. "리뷰요청" 템플릿도 선택
   - ✅ 두 개의 템플릿이 선택된 상태

**확인 방법**:
- 브라우저 개발자 도구 → Network 탭에서 API 호출 확인
- 또는 Console에서 상태 확인

#### 2.4 템플릿 저장 테스트

**테스트 시나리오**:
1. "선택한 템플릿 저장" 버튼 클릭
2. 성공 알림 확인: "설정이 저장되었습니다."
3. 워크플로우 동기화 메시지 확인

**확인 방법**:
```javascript
// 브라우저 Console에서 실행
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

#### 2.5 디버그 로그 뷰어 확인

**원본**:
- 대시보드 하단에 "GW/WF 디버그 로그" 섹션 표시
- 필터 옵션 (컴포넌트, 방향, 개수)
- 자동 새로고침 체크박스
- GW/WF 테스트 버튼

**신규**:
- [ ] 동일한 디버그 로그 섹션 확인
- [ ] 필터 옵션 동작 확인
- [ ] 자동 새로고침 동작 확인

---

### Step 3: 설정 탭 데모

#### 3.1 설정 탭 접속

1. 상단 "설정" 탭 클릭
2. 설정 화면 표시 확인

**확인 사항**:
- ✅ "1. 결제" 섹션 표시
- ✅ "2. 연동" 섹션 표시
- ✅ "3. 템플릿 선택" 섹션 표시

#### 3.2 결제 설정 확인

**원본**:
- 현재 잔액 표시 (0원)
- 충전 금액 선택 버튼 (1만원, 3만원, 5만원, 10만원, 30만원, 50만원)
- 직접 입력 필드
- 결제 수단 선택 (신용카드, 계좌이체, 가상계좌)
- 충전 내역 테이블

**신규**:
- [ ] 동일한 결제 설정 UI 확인
- [ ] 잔액 조회 API 동작 확인

**API 테스트**:
```javascript
fetch('http://localhost:5000/api/payment/balance')
  .then(r => r.json())
  .then(d => console.log('잔액:', d))
```

#### 3.3 연동 설정 테스트

**테스트 시나리오**:
1. "스마트스토어 연동 활성화" 체크박스 클릭
   - ✅ API Key, API Secret, Store ID 입력 필드 표시
2. 테스트 값 입력:
   - API Key: `test-api-key-123`
   - API Secret: `test-secret-456`
   - Store ID: `test-store-789`
3. "연동 설정 저장" 버튼 클릭
   - ✅ 저장 성공 알림 확인

**API 테스트**:
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

**확인 방법**:
```javascript
fetch('http://localhost:5000/api/ai-alimbot/settings')
  .then(r => r.json())
  .then(d => console.log('설정 조회:', d))
```

#### 3.4 템플릿 선택 (설정 탭)

**원본**:
- 10개 템플릿 체크박스 리스트
- 선택된 템플릿은 체크됨
- "템플릿 선택 저장" 버튼

**신규**:
- [ ] 동일한 템플릿 리스트 확인
- [ ] 체크박스 선택/해제 동작 확인
- [ ] 저장 버튼 동작 확인

---

### Step 4: 워크플로우 동기화 데모

#### 4.1 워크플로우 동기화 실행

**테스트 시나리오**:
1. 템플릿 선택 (예: 주문접수, 결제완료)
2. "선택한 템플릿 저장" 클릭
3. 워크플로우 동기화 자동 실행

**API 테스트**:
```javascript
// 1. 템플릿 저장
fetch('http://localhost:5000/api/ai-alimbot/templates', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({templateIds: [1, 2]})
})
.then(r => r.json())
.then(d => {
  console.log('템플릿 저장:', d);
  
  // 2. 워크플로우 동기화
  return fetch('http://localhost:5000/api/ai-alimbot/sync-workflows', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  });
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
3. 워크플로우 편집에서 확인:
   - 이벤트명: "주문접수", "결제완료"
   - 웹훅 URL: `https://tools.alimbot.com/api/v1/msg/process`

**API 테스트**:
```javascript
fetch('http://localhost:5000/api/workflows')
  .then(r => r.json())
  .then(d => {
    const aiWorkflows = d.data.filter(w => w.name.includes('[AI알림봇]'));
    console.log('AI 알림봇 워크플로우:', aiWorkflows);
  })
```

---

### Step 5: 원본과 비교 검증

#### 5.1 UI/UX 비교

**비교 항목**:
- [ ] 헤더 디자인 (그라데이션 배경)
- [ ] 탭 네비게이션 스타일
- [ ] 업종 선택 카드 디자인
- [ ] 템플릿 그리드 레이아웃
- [ ] 설정 화면 레이아웃
- [ ] 버튼 스타일
- [ ] 폰트 및 색상

**비교 방법**:
1. 원본: https://workflow.changups.kr/ai-bot
2. 신규: http://localhost:5173/ai-bot
3. 두 화면을 나란히 비교

#### 5.2 기능 동작 비교

**비교 항목**:
- [ ] 템플릿 선택/해제 동작
- [ ] 템플릿 저장 동작
- [ ] 설정 저장 동작
- [ ] 워크플로우 동기화 동작
- [ ] 에러 처리

**비교 방법**:
1. 원본에서 동일한 시나리오 실행
2. 신규에서 동일한 시나리오 실행
3. 결과 비교

---

## 4. 데모 체크리스트

### 기본 기능 체크리스트

- [ ] **서버 실행**
  - [ ] 백엔드 서버 실행 (포트 5000)
  - [ ] 프론트엔드 서버 실행 (포트 5173)
  - [ ] 브라우저 접속 성공

- [ ] **대시보드 탭**
  - [ ] 페이지 로드 성공
  - [ ] 업종 선택 카드 표시
  - [ ] 템플릿 그리드 표시
  - [ ] 기본 템플릿 자동 선택
  - [ ] 템플릿 선택/해제 동작
  - [ ] 템플릿 저장 동작
  - [ ] 디버그 로그 뷰어 표시

- [ ] **설정 탭**
  - [ ] 설정 탭 접속 성공
  - [ ] 결제 섹션 표시
  - [ ] 연동 섹션 표시
  - [ ] 템플릿 선택 섹션 표시
  - [ ] 연동 설정 저장 동작
  - [ ] 템플릿 선택 저장 동작

- [ ] **워크플로우 동기화**
  - [ ] 워크플로우 동기화 실행
  - [ ] 워크플로우 생성 확인
  - [ ] 워크플로우 이름 형식 확인
  - [ ] 워크플로우 이벤트명 확인
  - [ ] 워크플로우 웹훅 URL 확인

- [ ] **원본과 비교**
  - [ ] UI/UX 동일성 확인
  - [ ] 기능 동작 동일성 확인
  - [ ] API 응답 형식 확인

---

## 5. 문제 해결 가이드

### 문제 1: 서버가 실행되지 않음

**증상**: 포트 에러 또는 서버 시작 실패

**해결 방법**:
1. 포트 사용 중 확인:
   ```bash
   # PowerShell
   netstat -ano | findstr :5000
   netstat -ano | findstr :5173
   ```
2. 다른 포트 사용:
   - 백엔드: `PORT=5001 node server.js`
   - 프론트엔드: `npm run dev -- --port 5174`

### 문제 2: API 호출 실패

**증상**: Network 탭에서 404 또는 CORS 에러

**해결 방법**:
1. 백엔드 서버 실행 확인
2. Vite proxy 설정 확인 (`vite.config.js`)
3. CORS 설정 확인 (`backend/server.js`)

### 문제 3: 페이지가 로드되지 않음

**증상**: 빈 화면 또는 에러 메시지

**해결 방법**:
1. 브라우저 개발자 도구(F12) → Console 탭 확인
2. 에러 메시지 확인 및 수정
3. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)

### 문제 4: 데이터가 저장되지 않음

**증상**: 저장 버튼 클릭 후 데이터가 사라짐

**해결 방법**:
1. 데이터베이스 파일 확인 (`backend/database.db`)
2. API 응답 확인 (Network 탭)
3. 백엔드 로그 확인

---

## 6. 다음 단계

### 즉시 실행
1. [ ] 서버 실행 및 접속 확인
2. [ ] 기본 기능 테스트
3. [ ] 원본과 비교

### 버그 수정
1. [ ] 발견된 버그 수정
2. [ ] 원본과 다른 동작 수정
3. [ ] 에러 처리 개선

### 완성도 향상
1. [ ] 모든 기능 테스트 완료
2. [ ] 원본과 100% 동일하게 동작 확인
3. [ ] 문서화 완료

---

**데모 가이드 작성 완료**


