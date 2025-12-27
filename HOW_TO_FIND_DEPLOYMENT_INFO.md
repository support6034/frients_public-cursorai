# 배포 정보 확인 방법

## 필요한 정보 찾는 방법

### 1. Railway 백엔드 배포 정보 확인

**방법 1: Railway 대시보드 확인**
1. https://railway.app 접속
2. 로그인 후 프로젝트 목록 확인
3. `cursorai` 또는 `cursorAI` 프로젝트 확인
4. 프로젝트 클릭 → Settings → Domains
5. 배포된 URL 확인 (예: `https://cursorai-backend.up.railway.app`)

**방법 2: 새 프로젝트 생성**
1. Railway 대시보드: https://railway.app
2. New Project → Deploy from GitLab repo
3. 저장소: `frients_public/cursorai`
4. Root Directory: `backend`
5. 배포 후 URL 확인

**방법 3: Railway CLI 사용**
```bash
railway login
railway link
railway status
```

---

### 2. Vercel 프론트엔드 배포 정보 확인

**방법 1: Vercel 대시보드 확인**
1. https://vercel.com 접속
2. 로그인 후 프로젝트 목록 확인
3. `cursorai` 또는 `cursorAI` 프로젝트 확인
4. 프로젝트 클릭 → Settings → Domains
5. 배포된 URL 확인 (예: `https://cursorai.vercel.app`)

**방법 2: 새 프로젝트 생성**
1. Vercel 대시보드: https://vercel.com
2. New Project → Import GitLab Repository
3. 저장소: `frients_public/cursorai`
4. Root Directory: `frontend`
5. Framework: Vite
6. 배포 후 URL 확인

**방법 3: Vercel CLI 사용**
```bash
vercel login
vercel ls
```

---

### 3. 기존 배포 정보 확인 (참고)

**기존 프로젝트 배포 정보:**
- Frontend: https://grouptest.changups.kr
- Backend: https://grouptest-backend-production.up.railway.app
- Vercel Token: SonmQIW1S7XPBeOyrn88ofjO (기존 프로젝트용)

**새 프로젝트는 별도로 생성 필요**

---

## 배포 진행 방법

### 옵션 1: 대시보드에서 확인 후 진행
1. Railway/Vercel 대시보드에서 프로젝트 확인
2. 이미 생성되어 있으면 URL 확인
3. 없으면 새로 생성

### 옵션 2: CLI로 배포
1. Railway CLI 설치 및 로그인
2. Vercel CLI 설치 및 로그인
3. 배포 실행

---

**배포 정보 확인 방법 안내 완료**


