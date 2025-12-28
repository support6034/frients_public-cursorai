# cursorAI 빠른 배포 가이드

**배포 URL**: https://cursorai.changups.kr  
**프로젝트 경로**: `C:\Users\hckim\frients_public\cursorAI`

---

## 🚀 Frontend 배포 (Vercel)

### 배포 명령어
```bash
cd "C:\Users\hckim\frients_public\cursorAI\frontend" && npx vercel --prod --yes
```

### 배포 확인
- 출력에 `Aliased: https://cursorai.changups.kr` 가 보이면 성공
- 브라우저에서 https://cursorai.changups.kr 접속 확인

---

## 🔧 Backend 배포 (Railway)

### 배포 방법
1. https://railway.app 접속
2. "New Project" → "Deploy from GitLab repo"
3. 저장소: `frients_public/cursorai`
4. Root Directory: `backend`
5. 환경 변수 설정:
   ```
   PORT=5000
   NODE_ENV=production
   ```
6. 배포 완료 후 백엔드 URL 확인

### Frontend API URL 업데이트
배포된 백엔드 URL을 Vercel 환경 변수로 설정:
- Vercel 대시보드 → Project → Settings → Environment Variables
- `VITE_API_URL` 추가: `https://cursorai-backend.up.railway.app`

---

**배포 준비 완료**

