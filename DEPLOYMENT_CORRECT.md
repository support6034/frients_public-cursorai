# 올바른 배포 방법

## 기존 배포 환경 확인

### 기존 서비스 배포 환경
- **Frontend**: https://workflow.changups.kr (Vercel)
- **Backend**: https://workflow-backend-production-cdd6.up.railway.app (Railway)

### cursorAI 프로젝트 배포 방법

**기존 배포 환경과 동일하게 배포해야 합니다:**

1. **Frontend**: Vercel 배포
   - 기존: workflow.changups.kr
   - 신규: cursorai.vercel.app 또는 별도 도메인

2. **Backend**: Railway 배포
   - 기존 백엔드에 통합 또는 별도 서비스
   - 기존 백엔드 URL 사용: `https://workflow-backend-production-cdd6.up.railway.app`

## 배포 진행 방법

### Vercel 배포 (Frontend)

1. Vercel 대시보드에서 프로젝트 생성
2. GitLab 저장소 연결: `frients_public/cursorai`
3. Root Directory: `frontend`
4. Framework: Vite
5. 환경 변수: 백엔드 URL 자동 감지 (코드에 설정됨)

### Railway 배포 (Backend)

**옵션 1: 기존 백엔드에 통합**
- 기존 Railway 서비스에 `/api/ai-alimbot` 라우터 추가
- 이미 구현되어 있음

**옵션 2: 별도 Railway 서비스**
- 새로운 Railway 프로젝트 생성
- `backend` 폴더 배포

## 현재 상태

✅ **백엔드 URL 설정 완료**
- `frontend/src/api.js`에서 기존 백엔드 URL 사용
- `https://workflow-backend-production-cdd6.up.railway.app`

✅ **Vercel 설정 파일 준비 완료**
- `frontend/vercel.json` 존재

⏳ **Vercel 배포 필요**
- Vercel 대시보드에서 프로젝트 생성 필요

---

**올바른 배포 방법 정리 완료**


