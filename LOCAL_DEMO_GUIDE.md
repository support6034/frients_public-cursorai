# 로컬 데모 실행 가이드

**작성일**: 2025-12-27  
**프로젝트**: cursorAI (AI 알림봇)

---

## 로컬 데모 실행 가능 여부

✅ **로컬 데모 실행 가능합니다!**

로컬에서 백엔드와 프론트엔드를 실행하여 데모를 확인할 수 있습니다.

---

## 사전 준비 사항

### 1. Node.js 설치 확인
```bash
node --version
npm --version
```
- Node.js 18 이상 권장

### 2. 의존성 설치 확인
```bash
# Backend 의존성 설치
cd backend
npm install

# Frontend 의존성 설치
cd ../frontend
npm install
```

---

## 로컬 데모 실행 방법

### 방법 1: 두 개의 터미널 사용 (권장)

#### 터미널 1: Backend 서버 실행
```bash
cd C:\Users\hckim\frients_public\cursorAI\backend
npm install  # 처음 실행 시에만 필요
npm start
# 또는
node server.js
```

**예상 출력**:
```
서버가 포트 5000에서 실행중입니다.
이벤트 수신 URL: http://localhost:5000/api/events
```

#### 터미널 2: Frontend 서버 실행
```bash
cd C:\Users\hckim\frients_public\cursorAI\frontend
npm install  # 처음 실행 시에만 필요
npm run dev
```

**예상 출력**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 방법 2: 백그라운드 실행 (PowerShell)

```powershell
# Backend 백그라운드 실행
cd C:\Users\hckim\frients_public\cursorAI\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

# Frontend 백그라운드 실행
cd C:\Users\hckim\frients_public\cursorAI\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

---

## 데모 접속 방법

### 1. AI 알림봇 페이지 접속
- URL: http://localhost:5173/ai-bot
- 또는: http://localhost:5173 → AI 알림봇 메뉴 클릭

### 2. 예상 화면
- **대시보드 탭**: 업종 선택 카드, 템플릿 그리드 (10개)
- **설정 탭**: 결제 설정, 연동 설정, 템플릿 선택

---

## 기능 테스트 체크리스트

### 대시보드 탭 테스트
- [ ] 페이지 접속 확인 (`/ai-bot`)
- [ ] 업종 선택 카드 표시 확인 (4개)
- [ ] 템플릿 그리드 표시 확인 (10개)
- [ ] 템플릿 선택/해제 기능 테스트
- [ ] 템플릿 저장 기능 테스트
- [ ] 디버그 로그 뷰어 표시 확인

### 설정 탭 테스트
- [ ] 설정 탭 전환 확인
- [ ] 결제 설정 섹션 표시 확인
- [ ] 연동 설정 섹션 표시 확인 (스마트스토어)
- [ ] 템플릿 선택 섹션 표시 확인
- [ ] 설정 저장 기능 테스트

### API 테스트
- [ ] `GET /api/ai-alimbot/settings` - 설정 조회
- [ ] `POST /api/ai-alimbot/settings` - 설정 저장
- [ ] `GET /api/ai-alimbot/templates` - 템플릿 조회
- [ ] `POST /api/ai-alimbot/templates` - 템플릿 저장
- [ ] `POST /api/ai-alimbot/sync-workflows` - 워크플로우 동기화

---

## 문제 해결

### Backend 서버가 시작되지 않는 경우

**문제 1: 포트 5000이 이미 사용 중**
```bash
# 포트 사용 확인
netstat -ano | findstr :5000

# 다른 포트 사용 (server.js에서 PORT 변경)
```

**문제 2: 데이터베이스 파일 없음**
```bash
# database.js가 자동으로 생성하므로 문제 없음
# 만약 오류가 발생하면:
cd backend
node -e "require('./database.js')"
```

**문제 3: 의존성 설치 오류**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend 서버가 시작되지 않는 경우

**문제 1: 포트 5173이 이미 사용 중**
```bash
# Vite가 자동으로 다른 포트 사용
# 또는 vite.config.js에서 포트 변경
```

**문제 2: 의존성 설치 오류**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**문제 3: 빌드 오류**
```bash
# Vue 관련 오류인 경우
cd frontend
npm install vue@^3.4.0 vue-router@^4.2.5 pinia@^2.1.7
```

### API 연결 오류

**문제: 프론트엔드에서 백엔드 API 호출 실패**
- `vite.config.js`의 프록시 설정 확인
- `frontend/src/api.js`의 백엔드 URL 확인
- 브라우저 콘솔에서 에러 메시지 확인

---

## 로컬 데모 vs 배포 서비스 비교

| 항목 | 로컬 데모 | 배포 서비스 |
|------|----------|------------|
| Frontend URL | http://localhost:5173 | (배포 후 URL) |
| Backend URL | http://localhost:5000 | (배포 후 URL) |
| 데이터베이스 | SQLite (로컬 파일) | SQLite/PostgreSQL |
| 환경 | 개발 환경 | 프로덕션 환경 |

---

## 다음 단계

1. **로컬 데모 실행**
   - 위의 방법으로 서버 실행
   - http://localhost:5173/ai-bot 접속

2. **기능 테스트**
   - 위의 체크리스트에 따라 테스트
   - 원본 서비스와 비교

3. **배포 진행**
   - 로컬 데모 확인 후 배포 진행
   - Railway/Vercel 배포

---

**로컬 데모 실행 준비 완료!**

