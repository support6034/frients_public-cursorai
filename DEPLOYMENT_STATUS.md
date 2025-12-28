# cursorAI 배포 상태

**작성일**: 2025-12-27  
**배포 URL**: https://cursorai.changups.kr

---

## 배포 진행 상황

### 현재 상태
- ⏳ **배포 진행 중**

### 배포 방법
배포 절차서 참고: `C:\Users\hckim\frients_public\claudeAI\docs\배포절차서.md`

---

## Frontend 배포 (Vercel)

### 방법 1: Vercel CLI (npx 인식 불가로 대시보드 사용)
- Vercel 대시보드에서 배포 진행 중

### 방법 2: Vercel 대시보드
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitLab 저장소 연결: `frients_public/cursorai`
4. Root Directory: `frontend`
5. Framework: Vite
6. 환경 변수: `VITE_API_URL` (Railway 백엔드 URL)
7. Deploy 클릭

---

## Backend 배포 (Railway)

### 배포 방법
1. https://railway.app 접속
2. "New Project" → "Deploy from GitLab repo"
3. 저장소: `frients_public/cursorai`
4. Root Directory: `backend`
5. 환경 변수 설정
6. 배포 실행

---

**배포 진행 중**
