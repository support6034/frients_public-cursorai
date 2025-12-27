# cursorAI 프로젝트 별도 배포 설정

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | cursorAI (AI 알림봇) |
| GitLab 저장소 | https://gitlab.com/frients_public/cursorai |
| 로컬 폴더 | `C:\Users\hckim\frients_public\cursorAI` |

## 배포 전략

### 기존 프로젝트와 분리
- **기존 프로젝트**: workflow-automation (grouptest.changups.kr)
- **신규 프로젝트**: cursorAI (별도 배포 필요)

### 배포 방법 (기존과 동일한 방식)

#### Frontend: Vercel 자동 배포
- **새로운 Vercel 프로젝트 생성 필요**
- GitLab 저장소: `frients_public/cursorai`
- Root Directory: `frontend`
- Framework: Vite
- **자동 배포**: Git push 시 자동 배포

#### Backend: Railway 수동 배포
- **새로운 Railway 프로젝트 생성 필요**
- GitLab 저장소: `frients_public/cursorai`
- Root Directory: `backend`
- **수동 배포**: Railway 대시보드에서 수동 배포

## 현재 설정 상태

### Frontend 설정
- ✅ `frontend/vercel.json` 존재
- ✅ `frontend/vite.config.js` 설정 완료
- ⚠️ **Vercel 프로젝트 생성 필요** (새 프로젝트)

### Backend 설정
- ✅ `backend/railway.json` 존재
- ✅ `backend/package.json` 설정 완료
- ⚠️ **Railway 프로젝트 생성 필요** (새 프로젝트)

### API 설정
- ✅ `frontend/src/api.js` 백엔드 URL 자동 감지 로직
- ⚠️ **새로운 Railway 백엔드 URL로 업데이트 필요** (배포 후)

## 배포 단계

### 1단계: Railway 백엔드 배포 (수동)

1. Railway 대시보드 접속: https://railway.app
2. New Project → Deploy from GitLab repo
3. 저장소 선택: `frients_public/cursorai`
4. Root Directory: `backend`
5. 환경 변수 설정:
   ```
   PORT=5000
   NODE_ENV=production
   ```
6. 배포 실행 (수동)
7. 배포된 백엔드 URL 확인 (예: `https://cursorai-backend.up.railway.app`)

### 2단계: Frontend API URL 업데이트

1. 배포된 백엔드 URL 확인
2. `frontend/src/api.js` 업데이트:
   ```javascript
   // 새로운 Railway 백엔드 URL 사용
   return 'https://cursorai-backend.up.railway.app';
   ```
3. 커밋 및 푸시

### 3단계: Vercel 프론트엔드 배포 (자동)

1. Vercel 대시보드 접속: https://vercel.com
2. New Project → Import GitLab Repository
3. 저장소 선택: `frients_public/cursorai`
4. Root Directory: `frontend`
5. Framework Preset: Vite
6. 환경 변수 설정 (필요 시)
7. Deploy 클릭
8. **이후 Git push 시 자동 배포됨**

## 배포 후 확인

### Frontend
- Vercel 배포 URL 확인
- 커스텀 도메인 설정 (필요 시)

### Backend
- Railway 배포 URL 확인
- `/api/ai-alimbot/*` 엔드포인트 동작 확인

### 통합 테스트
- Frontend → Backend API 호출 확인
- AI 알림봇 기능 동작 확인

---

**새 프로젝트 배포 설정 가이드 작성 완료**


