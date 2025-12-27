# cursorAI 프로젝트 별도 배포 설정

## 중요: 기존 프로젝트와 완전 분리

### 기존 프로젝트 (변경하지 않음)
- **프로젝트명**: workflow-automation
- **Frontend**: https://grouptest.changups.kr
- **Backend**: https://grouptest-backend-production.up.railway.app
- **GitLab**: https://gitlab.com/frients_public/workflow-automation

### 신규 프로젝트 (별도 배포)
- **프로젝트명**: cursorAI
- **Frontend**: 새로운 Vercel 프로젝트 (별도 URL)
- **Backend**: 새로운 Railway 프로젝트 (별도 URL)
- **GitLab**: https://gitlab.com/frients_public/cursorai

---

## 배포 방법 (기존과 동일한 방식, 별도 프로젝트)

### 1단계: Railway 백엔드 배포 (수동)

**새로운 Railway 프로젝트 생성:**

1. Railway 대시보드: https://railway.app
2. New Project → Deploy from GitLab repo
3. 저장소 선택: `frients_public/cursorai`
4. Root Directory: `backend` 설정
5. 환경 변수 설정:
   ```
   PORT=5000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://cursorai-frontend.vercel.app
   ```
6. 배포 실행 (수동)
7. 배포된 백엔드 URL 확인 (예: `https://cursorai-backend.up.railway.app`)

**설정 파일 확인:**
- ✅ `backend/railway.json` - Node.js 설정으로 수정 완료
- ✅ `backend/package.json` - start 스크립트 확인

---

### 2단계: Frontend API URL 업데이트

**배포된 백엔드 URL 확인 후:**

1. `frontend/src/api.js` 업데이트:
   ```javascript
   // 새로운 Railway 백엔드 URL 사용
   return 'https://cursorai-backend.up.railway.app';
   ```

2. 또는 Vercel 환경 변수 설정:
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```

3. 커밋 및 푸시

---

### 3단계: Vercel 프론트엔드 배포 (자동)

**새로운 Vercel 프로젝트 생성:**

1. Vercel 대시보드: https://vercel.com
2. New Project → Import GitLab Repository
3. 저장소 선택: `frients_public/cursorai`
4. Root Directory: `frontend` 설정
5. Framework Preset: Vite 선택
6. 환경 변수 설정:
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```
7. Deploy 클릭
8. **이후 Git push 시 자동 배포됨**

**설정 파일 확인:**
- ✅ `frontend/vercel.json` - Vite 설정 완료
- ✅ `frontend/vite.config.js` - 빌드 설정 완료

---

## 현재 설정 상태

### ✅ 준비 완료
- `backend/railway.json` - Node.js 설정으로 수정 완료
- `frontend/vercel.json` - Vite 설정 완료
- `frontend/src/api.js` - 백엔드 URL 자동 감지 로직 (배포 후 URL 업데이트 필요)

### ⏳ 배포 필요
- **Railway 백엔드**: 새로운 프로젝트 생성 및 배포 필요
- **Vercel 프론트엔드**: 새로운 프로젝트 생성 및 배포 필요

---

## 배포 후 확인 사항

### Backend
- [ ] Railway 배포 완료
- [ ] `/api/ai-alimbot/*` 엔드포인트 동작 확인
- [ ] CORS 설정 확인

### Frontend
- [ ] Vercel 배포 완료
- [ ] 백엔드 URL 업데이트 완료
- [ ] API 호출 정상 동작 확인

---

**별도 배포 설정 가이드 작성 완료**

