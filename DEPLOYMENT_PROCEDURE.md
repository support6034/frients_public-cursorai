# cursorAI 배포 절차서

**작성일**: 2025-12-27  
**프로젝트**: cursorAI (AI 알림봇)  
**배포 URL**: https://cursorai.changups.kr  
**GitLab**: https://gitlab.com/frients_public/cursorai

---

## 0. 프로젝트 정보

### 0.1 경로
- **프로젝트 경로**: `C:\Users\hckim\frients_public\cursorAI`
- **Frontend 경로**: `C:\Users\hckim\frients_public\cursorAI\frontend`
- **Backend 경로**: `C:\Users\hckim\frients_public\cursorAI\backend`

### 0.2 배포 URL
- **Frontend**: https://cursorai.changups.kr (Vercel)
- **Backend**: Railway 배포 필요 (배포 후 URL 확인)

---

## 1. Frontend 배포 (Vercel)

### Step 1: 배포 명령어 실행

```bash
cd "C:\Users\hckim\frients_public\cursorAI\frontend" && npx vercel --prod --yes
```

### Step 2: 배포 완료 확인
- 출력에 `Aliased: https://cursorai.changups.kr` 가 보이면 성공

### Step 3: 브라우저에서 확인
- https://cursorai.changups.kr 접속
- 페이지가 정상 로드되면 완료

---

## 2. Backend 배포 (Railway)

### Step 1: Railway 대시보드 접속
- https://railway.app 접속
- 로그인

### Step 2: 새 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitLab repo" 선택
3. 저장소 선택: `frients_public/cursorai`
4. Root Directory: `backend` 설정

### Step 3: 환경 변수 설정
```
PORT=5000
NODE_ENV=production
```

### Step 4: 배포 실행
- Railway가 자동으로 배포 시작
- 배포 완료 후 URL 확인 (예: `https://cursorai-backend.up.railway.app`)

### Step 5: Frontend API URL 업데이트
배포된 백엔드 URL을 Frontend에 반영:

**방법 1: Vercel 환경 변수 설정**
- Vercel 대시보드 → Project → Settings → Environment Variables
- `VITE_API_URL` 추가: `https://cursorai-backend.up.railway.app`

**방법 2: 코드 수정**
- `frontend/src/api.js` 파일 수정
- 백엔드 URL 업데이트 후 재배포

---

## 3. 배포 실패 시 확인사항

### 3.1 "command not found: npx"
Node.js가 설치되어 있지 않음.
```bash
# Node.js 버전 확인
node -v
```

### 3.2 "Vercel CLI not found"
```bash
npm install -g vercel
```

### 3.3 Vercel 로그인 필요
```bash
npx vercel login
```
→ 이메일 입력 후 인증

### 3.4 빌드 에러
```bash
# 로컬에서 먼저 빌드 테스트
cd frontend
npm run build
```

---

## 4. 환경 변수 확인

### Frontend 환경 변수
배포 전 API URL이 올바른지 확인:

**Vercel 환경 변수 설정**:
```
VITE_API_URL=https://cursorai-backend.up.railway.app
```

또는 `.env.production` 파일 생성:
```
VITE_API_URL=https://cursorai-backend.up.railway.app
```

### Backend 환경 변수 (Railway)
```
PORT=5000
NODE_ENV=production
```

---

## 5. 배포 성공 체크리스트

- [ ] Frontend 배포 명령어 실행
- [ ] `Aliased: https://cursorai.changups.kr` 출력 확인
- [ ] https://cursorai.changups.kr 접속 확인
- [ ] Railway 백엔드 프로젝트 생성
- [ ] 백엔드 배포 완료 확인
- [ ] 백엔드 URL 확인
- [ ] Frontend API URL 업데이트
- [ ] Frontend 재배포 (API URL 반영)

---

## 6. 요약 (빠른 참조)

### Frontend 배포
```bash
cd "C:\Users\hckim\frients_public\cursorAI\frontend" && npx vercel --prod --yes
```

### Backend 배포
- Railway 대시보드에서 수동 배포
- GitLab 저장소 연결: `frients_public/cursorai`
- Root Directory: `backend`

**결과 URL**:
- Frontend: https://cursorai.changups.kr
- Backend: Railway 배포 후 확인

---

**배포 절차서 작성 완료**

