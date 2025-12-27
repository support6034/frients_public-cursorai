# cursorAI 배포 단계별 가이드

## 기존 배포 방법 참고

기존 프로젝트 (workflow-automation) 배포 방법:
- **Frontend**: Vercel 자동 배포 (Git push 시)
- **Backend**: Railway 수동 배포

## cursorAI 배포 단계

### 1단계: Railway 백엔드 배포 (수동)

**기존 방법과 동일:**

1. Railway 대시보드: https://railway.app
2. New Project → Deploy from GitLab repo
3. 저장소: `frients_public/cursorai`
4. Root Directory: `backend`
5. 환경 변수:
   ```
   PORT=5000
   NODE_ENV=production
   ```
6. 배포 실행 (수동)
7. 배포된 URL 확인 (예: `https://cursorai-backend.up.railway.app`)

**설정 파일 확인:**
- ✅ `backend/railway.json` - `node server.js` 설정 완료
- ✅ `backend/package.json` - `start` 스크립트 확인

---

### 2단계: Frontend API URL 업데이트

**배포된 백엔드 URL 확인 후:**

1. `frontend/src/api.js` 업데이트:
   ```javascript
   // 새로운 Railway 백엔드 URL
   return 'https://cursorai-backend.up.railway.app';
   ```

2. 커밋 및 푸시

---

### 3단계: Vercel 프론트엔드 배포 (자동)

**기존 방법과 동일:**

1. Vercel 대시보드: https://vercel.com
2. New Project → Import GitLab Repository
3. 저장소: `frients_public/cursorai`
4. Root Directory: `frontend`
5. Framework Preset: Vite
6. 환경 변수 (선택):
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```
7. Deploy 클릭
8. **이후 Git push 시 자동 배포됨**

**설정 파일 확인:**
- ✅ `frontend/vercel.json` - Vite 설정 완료
- ✅ `frontend/vite.config.js` - 빌드 설정 완료

---

## 현재 준비 상태

✅ **설정 파일 준비 완료**
- `backend/railway.json` - Node.js 설정
- `frontend/vercel.json` - Vite 설정
- `frontend/src/api.js` - 백엔드 URL 자동 감지

⏳ **배포 필요**
- Railway 백엔드 프로젝트 생성 및 배포
- Vercel 프론트엔드 프로젝트 생성 및 배포

---

**배포 단계별 가이드 작성 완료**


