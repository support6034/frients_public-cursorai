# cursorAI 배포 - 단순 가이드

**배포 URL**: https://cursorai.changups.kr

---

## 🎯 제가 할 수 있는 것 vs 제가 못하는 것

### ✅ 제가 할 수 있는 것
- 코드 수정 및 준비
- Git 커밋/푸시
- 배포 설정 파일 작성
- 배포 가이드 작성

### ❌ 제가 못하는 것 (사용자님이 직접 해야 함)
- **Vercel 로그인** (이메일/비밀번호 필요)
- **Railway 로그인** (이메일/비밀번호 필요)
- **GitLab 인증** (OAuth 인증 필요)

---

## 📋 사용자님이 직접 해야 할 단계 (매우 간단)

### 1단계: Vercel 로그인 (2분)

1. 브라우저에서 https://vercel.com/login 접속
2. 이메일 주소 입력
3. "Continue with Email" 클릭
4. 비밀번호 입력 후 로그인

**또는** GitHub 계정이 있으면:
- "Continue with GitHub" 클릭
- GitHub 로그인

---

### 2단계: Vercel 프로젝트 생성 (3분)

1. 로그인 후 자동으로 대시보드로 이동
2. 우측 상단 **"Add New..."** → **"Project"** 클릭
3. **"Import Git Repository"** 섹션에서 **"Continue with GitLab"** 클릭
4. GitLab 로그인 (처음이면 인증 허용)
5. 저장소 목록에서 **`frients_public/cursorai`** 선택
6. **"Import"** 클릭

---

### 3단계: 프로젝트 설정 (2분)

1. **Root Directory**: `frontend` 입력
2. **Framework Preset**: `Vite` 선택 (자동 감지될 수도 있음)
3. **Project Name**: `cursorai` (또는 원하는 이름)
4. **Environment Variables** (나중에 설정 가능):
   - Key: `VITE_API_URL`
   - Value: (Railway 백엔드 배포 후 URL 입력)
5. **"Deploy"** 버튼 클릭

---

### 4단계: 배포 완료 확인 (1분)

1. 배포가 완료되면 (약 2-3분 소요)
2. **"Visit"** 버튼 클릭 또는
3. https://cursorai.changups.kr 접속 확인

---

## 🚂 Railway 백엔드 배포 (별도 진행)

### 1단계: Railway 로그인 (2분)

1. 브라우저에서 https://railway.app 접속
2. **"Login"** 클릭
3. GitHub/GitLab 계정으로 로그인

---

### 2단계: 프로젝트 생성 (3분)

1. **"New Project"** 클릭
2. **"Deploy from Git repo"** 선택
3. **GitLab** 선택
4. 저장소: **`frients_public/cursorai`** 선택
5. **"Deploy Now"** 클릭

---

### 3단계: 설정 (2분)

1. 프로젝트가 생성되면 **"Settings"** 탭 클릭
2. **"Root Directory"** 설정:
   - `backend` 입력
3. **"Variables"** 탭에서 환경 변수 추가:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
4. 저장 후 자동 재배포됨

---

### 4단계: 백엔드 URL 확인 (1분)

1. **"Settings"** → **"Domains"** 탭
2. 생성된 URL 확인 (예: `https://cursorai-backend.up.railway.app`)
3. 이 URL을 복사

---

### 5단계: Frontend API URL 업데이트 (2분)

1. Vercel 대시보드로 돌아가기
2. `cursorai` 프로젝트 선택
3. **"Settings"** → **"Environment Variables"**
4. **"Add New"** 클릭
5. Key: `VITE_API_URL`
6. Value: Railway에서 복사한 백엔드 URL 붙여넣기
7. **"Save"** 클릭
8. **"Deployments"** 탭에서 **"Redeploy"** 클릭

---

## ✅ 완료 체크리스트

- [ ] Vercel 로그인 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] Frontend 배포 완료
- [ ] Railway 로그인 완료
- [ ] Railway 프로젝트 생성 완료
- [ ] Backend 배포 완료
- [ ] 백엔드 URL 확인
- [ ] Frontend 환경 변수 업데이트
- [ ] Frontend 재배포 완료
- [ ] https://cursorai.changups.kr 접속 확인

---

## 🆘 문제 발생 시

### Vercel 로그인이 안 될 때
- 이메일/비밀번호 확인
- "Sign Up"으로 새 계정 생성 가능

### GitLab 연결이 안 될 때
- GitLab 계정 확인
- Vercel에서 GitLab 인증 재시도

### 배포가 실패할 때
- Vercel 대시보드 → "Deployments" → 실패한 배포 클릭
- 에러 로그 확인
- 제가 코드 수정 필요 시 알려주세요

---

**총 소요 시간: 약 15분**

**제가 준비한 것:**
- ✅ 모든 코드 준비 완료
- ✅ 배포 설정 파일 준비 완료
- ✅ GitLab에 푸시 완료

**사용자님이 하실 것:**
- 로그인 및 배포 실행 (위 단계 따라하기)

