# 배포 요청 사항

## 배포를 위해 필요한 정보

### 1. Railway 백엔드 배포 (필수)
- Railway 계정 필요
- 배포 후 받을 백엔드 URL 필요
- 예상 URL: `https://cursorai-backend.up.railway.app`

### 2. GitLab Pages 배포 (자동)
- GitLab 저장소: `https://gitlab.com/frients_public/cursorai`
- 브랜치: `master`
- `.gitlab-ci.yml` 설정 완료
- **커밋 푸시 시 자동 배포됨**

### 3. 환경 변수 설정 (Railway 배포 후)
```
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://frients_public.gitlab.io
```

## 현재 상태

✅ **코드 준비 완료**
- 모든 변경사항 커밋 완료
- GitLab CI/CD 설정 완료
- 배포 설정 파일 준비 완료

⏳ **배포 대기 중**
- Railway 백엔드 배포 필요
- GitLab Pages 자동 배포 대기 (푸시 시)

## 다음 단계

1. **Railway 백엔드 배포**
   - Railway 대시보드에서 프로젝트 생성
   - `backend` 폴더 배포
   - 환경 변수 설정
   - 배포 URL 확인

2. **GitLab Pages 배포**
   - `git push origin master` 실행
   - GitLab CI/CD 자동 배포
   - 배포 URL 확인

3. **연동 확인**
   - 프론트엔드에서 백엔드 URL 업데이트
   - 기능 테스트


