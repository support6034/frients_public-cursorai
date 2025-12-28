# cursorAI 배포 요약

**작성일**: 2025-12-27  
**배포 URL**: https://cursorai.changups.kr

---

## 배포 진행 상황

### 현재 상태
- ✅ Vercel 대시보드 접속 완료
- ✅ "New Project" 페이지 접속 완료
- ⚠️ **로그인 필요** - GitLab 버튼이 비활성화됨

### 배포 방법

배포 절차서 참고: `C:\Users\hckim\frients_public\claudeAI\docs\배포절차서.md`

#### Frontend 배포 (Vercel)
1. **Vercel 로그인** (필수)
   - https://vercel.com/login 접속
   - 이메일/비밀번호로 로그인

2. **GitLab 연결**
   - "Continue with GitLab" 클릭
   - GitLab 인증 완료

3. **프로젝트 설정**
   - 저장소 선택: `frients_public/cursorai`
   - Root Directory: `frontend`
   - Framework: Vite
   - 환경 변수: `VITE_API_URL` (Railway 백엔드 URL)

4. **배포 실행**
   - Deploy 클릭
   - 배포 완료 후 https://cursorai.changups.kr 확인

#### Backend 배포 (Railway)
1. Railway 대시보드: https://railway.app
2. "New Project" → "Deploy from GitLab repo"
3. 저장소: `frients_public/cursorai`
4. Root Directory: `backend`
5. 환경 변수 설정
6. 배포 실행

---

## 다음 단계

1. **Vercel 로그인** (수동 필요)
2. GitLab 연결
3. 프로젝트 설정 및 배포

---

**배포 준비 완료 - 로그인 후 진행 가능**
