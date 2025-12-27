# 최종 배포 설정

## 기존 배포 환경 (확인됨)

| 구분 | URL |
|------|-----|
| Frontend | https://grouptest.changups.kr |
| Backend | https://grouptest-backend-production.up.railway.app |
| GitLab | https://gitlab.com/frients_public/workflow-automation |

## 배포 방법

### Frontend: Vercel 자동 배포
- **배포 방식**: Git push 시 자동 배포
- **도메인**: https://grouptest.changups.kr
- **설정 파일**: `frontend/vercel.json` ✅

### Backend: Railway 수동 배포
- **배포 방식**: 수동 배포 (Railway 대시보드)
- **도메인**: https://grouptest-backend-production.up.railway.app
- **설정 파일**: `backend/railway.json` ✅

## 현재 설정 상태

✅ **백엔드 URL 수정 완료**
- `frontend/src/api.js`: `https://grouptest-backend-production.up.railway.app` 사용

✅ **Vercel 설정 준비 완료**
- `frontend/vercel.json` 존재
- 자동 배포 설정 완료

## 다음 단계

1. **코드 푸시** (자동 배포)
   - Git push → Vercel 자동 배포
   - Frontend: https://grouptest.changups.kr

2. **백엔드 수동 배포** (필요 시)
   - Railway 대시보드에서 수동 배포
   - Backend: https://grouptest-backend-production.up.railway.app

---

**최종 배포 설정 완료**


