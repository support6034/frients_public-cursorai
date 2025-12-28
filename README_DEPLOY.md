# cursorAI 배포 - 빠른 시작

## 🚀 배포 방법 (매우 간단)

### Frontend 배포 (Vercel)

**총 소요 시간: 약 5분**

1. **로그인**: https://vercel.com/login
2. **프로젝트 생성**: "Add New..." → "Project"
3. **GitLab 연결**: "Continue with GitLab" → `frients_public/cursorai` 선택
4. **설정**: Root Directory = `frontend`, Framework = `Vite`
5. **배포**: "Deploy" 클릭

**완료!** → https://cursorai.changups.kr 접속 확인

---

### Backend 배포 (Railway)

**총 소요 시간: 약 5분**

1. **로그인**: https://railway.app
2. **프로젝트 생성**: "New Project" → "Deploy from Git repo" → GitLab
3. **저장소 선택**: `frients_public/cursorai`
4. **설정**: Root Directory = `backend`
5. **환경 변수**: `PORT=5000`, `NODE_ENV=production`
6. **배포 완료 후 URL 확인**

**완료!** → 백엔드 URL을 Vercel 환경 변수에 추가

---

## 📖 자세한 가이드

**`SIMPLE_DEPLOYMENT_GUIDE.md`** 파일 참고

---

**제가 준비 완료한 것:**
- ✅ 모든 코드
- ✅ 배포 설정 파일
- ✅ GitLab 푸시 완료

**사용자님이 하실 것:**
- 위 5단계만 따라하시면 됩니다!

