# AI 알림봇 배포 가이드

**작성일**: 2025-01-XX  
**프로젝트**: cursorAI (AI 알림봇)

---

## 📋 배포 개요

### 배포 구조
- **Frontend**: Vercel (정적 호스팅)
- **Backend**: Railway (Node.js 서버)
- **Database**: SQLite (개발) / PostgreSQL (운영)

### 배포 URL (예상)
- **Frontend**: `https://cursorai.vercel.app` 또는 GitLab Pages
- **Backend**: `https://cursorai-backend.up.railway.app`

---

## 🚀 배포 방법

### 방법 1: Vercel + Railway (권장)

#### 1-1. Frontend 배포 (Vercel)

**전제 조건**:
- Vercel 계정 필요
- GitLab 저장소 연결

**배포 단계**:

1. **Vercel 프로젝트 생성**
   ```bash
   # Vercel CLI 설치 (선택사항)
   npm i -g vercel
   
   # Vercel 로그인
   vercel login
   ```

2. **프로젝트 연결**
   - Vercel 대시보드 접속: https://vercel.com
   - "New Project" 클릭
   - GitLab 저장소 선택: `frients_public/cursorai`
   - Root Directory: `frontend` 설정
   - Framework Preset: `Vite` 선택

3. **환경 변수 설정** (Vercel 대시보드)
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```

4. **빌드 설정 확인**
   - Build Command: `npm run build` (자동 감지)
   - Output Directory: `dist` (자동 감지)
   - Install Command: `npm install` (자동 감지)

5. **배포 실행**
   ```bash
   # 자동 배포 (Git push 시)
   git push origin feature/notification
   
   # 또는 수동 배포
   cd frontend
   vercel --prod
   ```

**설정 파일**: `frontend/vercel.json` ✅ 이미 존재

---

#### 1-2. Backend 배포 (Railway)

**전제 조건**:
- Railway 계정 필요
- GitHub/GitLab 계정 연결

**배포 단계**:

1. **Railway 프로젝트 생성**
   - Railway 대시보드 접속: https://railway.app
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택: `frients_public/cursorai`
   - Root Directory: `backend` 설정

2. **환경 변수 설정** (Railway 대시보드)
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=postgresql://... (PostgreSQL 연결 시)
   ALLOWED_ORIGINS=https://cursorai.vercel.app
   ```

3. **배포 설정 확인**
   - Start Command: `npm start` (자동 감지)
   - Build Command: 없음 (Node.js 프로젝트)

4. **배포 실행**
   ```bash
   # 자동 배포 (Git push 시)
   git push origin feature/notification
   
   # 또는 Railway CLI 사용
   railway up
   ```

**설정 파일**: `backend/railway.json` ✅ 이미 존재

---

### 방법 2: GitLab Pages + Railway

#### 2-1. Frontend 배포 (GitLab Pages)

**전제 조건**:
- GitLab 저장소 필요
- GitLab CI/CD 활성화

**배포 단계**:

1. **GitLab CI/CD 설정 확인**
   - 파일: `.gitlab-ci.yml` ✅ 이미 존재
   - 브랜치: `master` 또는 `main`

2. **환경 변수 설정** (GitLab CI/CD)
   - GitLab 프로젝트 → Settings → CI/CD → Variables
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```

3. **배포 실행**
   ```bash
   git checkout master
   git merge feature/notification
   git push origin master
   ```

4. **배포 확인**
   - GitLab 프로젝트 → Pages 메뉴
   - URL: `https://frients_public.gitlab.io/cursorai`

**설정 파일**: `.gitlab-ci.yml` ✅ 이미 존재

---

#### 2-2. Backend 배포 (Railway)

**방법 1-2와 동일**

---

### 방법 3: GitHub Pages + Railway

#### 3-1. Frontend 배포 (GitHub Pages)

**전제 조건**:
- GitHub 저장소 필요
- GitHub Actions 활성화

**배포 단계**:

1. **GitHub Actions 설정 확인**
   - 파일: `frontend/.github/workflows/deploy.yml` ✅ 이미 존재
   - 브랜치: `main`

2. **환경 변수 설정** (GitHub Actions)
   - GitHub 저장소 → Settings → Secrets and variables → Actions
   ```
   VITE_API_URL=https://cursorai-backend.up.railway.app
   ```

3. **배포 실행**
   ```bash
   git checkout main
   git merge feature/notification
   git push origin main
   ```

4. **배포 확인**
   - GitHub 저장소 → Settings → Pages
   - URL: `https://username.github.io/cursorai`

**설정 파일**: `frontend/.github/workflows/deploy.yml` ✅ 이미 존재

---

## ⚙️ 배포 전 확인 사항

### Frontend 확인

1. **빌드 테스트**
   ```bash
   cd frontend
   npm install
   npm run build
   # dist 폴더 생성 확인
   ```

2. **환경 변수 확인**
   - `frontend/src/api.js`에서 백엔드 URL 자동 감지 로직 확인
   - 프로덕션 환경에서 올바른 백엔드 URL 사용 확인

3. **라우터 설정 확인**
   - `frontend/src/router/index.js`에서 모든 경로 설정 확인
   - SPA 라우팅을 위한 rewrites 설정 확인 (Vercel)

### Backend 확인

1. **서버 실행 테스트**
   ```bash
   cd backend
   npm install
   npm start
   # 포트 5000에서 실행 확인
   ```

2. **환경 변수 확인**
   - `PORT` 환경 변수 설정 확인
   - `ALLOWED_ORIGINS` CORS 설정 확인
   - 데이터베이스 연결 설정 확인

3. **API 엔드포인트 확인**
   - 모든 API 엔드포인트 정상 동작 확인
   - CORS 설정 확인

---

## 🔧 배포 후 설정

### Frontend 설정

1. **백엔드 URL 업데이트**
   - `frontend/src/api.js`에서 프로덕션 백엔드 URL 확인
   - Railway 배포 후 받은 백엔드 URL로 업데이트

2. **CORS 설정 확인**
   - 백엔드에서 프론트엔드 도메인 허용 확인

### Backend 설정

1. **환경 변수 설정**
   ```
   PORT=5000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://cursorai.vercel.app,https://frients_public.gitlab.io
   ```

2. **데이터베이스 설정**
   - SQLite (개발): `backend/database.db`
   - PostgreSQL (운영): Railway PostgreSQL 서비스 연결

---

## 📝 배포 체크리스트

### 배포 전
- [ ] Frontend 빌드 테스트 통과
- [ ] Backend 서버 실행 테스트 통과
- [ ] 모든 API 엔드포인트 테스트 통과
- [ ] 환경 변수 설정 확인
- [ ] CORS 설정 확인

### 배포 중
- [ ] Vercel/Railway 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 배포 실행
- [ ] 배포 로그 확인

### 배포 후
- [ ] Frontend 접속 확인
- [ ] Backend API 접속 확인
- [ ] 기능 동작 확인
- [ ] 에러 로그 확인

---

## 🐛 문제 해결

### Frontend 배포 문제

**문제**: 빌드 실패
```bash
# 해결 방법
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**문제**: 라우터 경로 404
- Vercel: `vercel.json`의 rewrites 설정 확인
- GitLab Pages: `.gitlab-ci.yml`의 404.html 복사 확인

### Backend 배포 문제

**문제**: 서버 시작 실패
- Railway 로그 확인
- 환경 변수 설정 확인
- 포트 설정 확인

**문제**: CORS 에러
- `ALLOWED_ORIGINS` 환경 변수 확인
- 백엔드 `server.js`의 CORS 설정 확인

---

## 🎯 권장 배포 순서

1. **Backend 먼저 배포** (Railway)
   - 백엔드 URL 확인
   - API 테스트

2. **Frontend 배포** (Vercel 또는 GitLab Pages)
   - 백엔드 URL 환경 변수 설정
   - 빌드 및 배포

3. **통합 테스트**
   - 전체 기능 테스트
   - 에러 확인 및 수정

---

## 📚 참고 문서

- **Vercel 문서**: https://vercel.com/docs
- **Railway 문서**: https://docs.railway.app
- **GitLab Pages 문서**: https://docs.gitlab.com/ee/user/project/pages/
- **GitHub Pages 문서**: https://docs.github.com/pages

---

**배포 가이드 작성 완료**

