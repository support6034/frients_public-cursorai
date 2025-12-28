# CursorAI 배포 절차서 (Step-by-Step)

> 모든 명령어를 순서대로 복사-붙여넣기만 하면 배포 완료!

---

## STEP 1: CLI 도구 설치

PowerShell 또는 터미널에서 실행:

```bash
npm install -g @railway/cli
```

```bash
npm install -g vercel
```

설치 확인:
```bash
railway --version
```

```bash
vercel --version
```

---

## STEP 2: CLI 로그인

### 2.1 Railway 로그인

```bash
railway login
```
→ 브라우저가 열리면 GitHub 계정으로 로그인
→ 터미널에 `Logged in as xxx@xxx.com` 표시되면 성공

### 2.2 Vercel 로그인

```bash
vercel login
```
→ 이메일 입력 → 이메일로 온 인증 링크 클릭
→ `Congratulations!` 메시지 나오면 성공

---

## STEP 3: Backend 폴더로 이동

```bash
cd C:\Users\hckim\frients_public\cursorAI\backend
```

---

## STEP 4: Railway 프로젝트 생성

```bash
railway init
```

질문이 나오면:
1. `Empty Project` 선택 (화살표로 이동 후 Enter)
2. 프로젝트 이름 입력: `cursorai-backend` 입력 후 Enter

→ `Project cursorai-backend created` 메시지 나오면 성공

---

## STEP 5: PostgreSQL 데이터베이스 추가

```bash
railway add
```

질문이 나오면:
1. `Database` 선택 (화살표로 이동 후 Enter)
2. `PostgreSQL` 선택 후 Enter

→ PostgreSQL이 추가됨

---

## STEP 6: PostgreSQL 환경변수 확인

```bash
railway variables --service Postgres
```

출력에서 **PGPASSWORD** 값을 복사해두세요! (예: `okrjaeDHQOsZMVbEuMPYbTBVsOgBXnlm`)

---

## STEP 7: Backend API 서비스 생성

```bash
railway add --service api
```

질문이 나오면:
1. `Empty Service` 선택 후 Enter
2. 서비스 이름: `api` (자동 입력됨) 그냥 Enter
3. 변수 입력: 그냥 Enter (빈칸으로)

---

## STEP 8: API 서비스에 환경변수 설정

**중요: 아래 명령에서 `PGPASSWORD=` 뒤에 STEP 6에서 복사한 비밀번호를 붙여넣으세요!**

```bash
railway variables --service api --set "PGHOST=postgres.railway.internal" --set "PGPORT=5432" --set "PGDATABASE=railway" --set "PGUSER=postgres" --set "PGPASSWORD=여기에비밀번호붙여넣기" --set "SPRING_PROFILES_ACTIVE=prod"
```

예시 (실제 비밀번호로 교체):
```bash
railway variables --service api --set "PGHOST=postgres.railway.internal" --set "PGPORT=5432" --set "PGDATABASE=railway" --set "PGUSER=postgres" --set "PGPASSWORD=okrjaeDHQOsZMVbEuMPYbTBVsOgBXnlm" --set "SPRING_PROFILES_ACTIVE=prod"
```

---

## STEP 9: Backend 배포

```bash
railway up --service api --detach
```

→ `Indexing...` → `Uploading...` 메시지 후
→ `Build Logs: https://railway.com/...` URL이 출력됨
→ 이 URL을 클릭하거나 Railway 대시보드에서 빌드 진행 확인
→ 약 2-3분 후 `Active` 상태가 되면 성공

---

## STEP 10: Backend 도메인 생성

```bash
railway domain --service api
```

→ `Service Domain created: https://api-production-xxxx.up.railway.app` 출력
→ **이 URL을 복사해두세요!** (Frontend 설정에 필요)

---

## STEP 11: Backend 작동 확인

위에서 받은 URL로 테스트:

```bash
curl https://api-production-xxxx.up.railway.app/
```

→ `Spring Boot is running` 출력되면 성공!

---

## STEP 12: Frontend 폴더로 이동

```bash
cd C:\Users\hckim\frients_public\cursorAI\frontend
```

---

## STEP 13: Frontend 환경변수 파일 생성

`.env.production` 파일 생성 (STEP 10에서 받은 URL 사용):

PowerShell:
```powershell
echo "VITE_API_URL=https://api-production-xxxx.up.railway.app" > .env.production
```

또는 직접 파일 생성:
1. `frontend` 폴더에 `.env.production` 파일 생성
2. 아래 내용 입력 (URL은 본인 것으로 교체):
```
VITE_API_URL=https://api-production-xxxx.up.railway.app
```

---

## STEP 14: Frontend 배포 (처음)

```bash
vercel
```

질문에 답변:
1. `Set up and deploy?` → `Y` 입력 후 Enter
2. `Which scope?` → 본인 계정 선택 후 Enter
3. `Link to existing project?` → `N` 입력 후 Enter
4. `What's your project's name?` → `cursorai-frontend` 입력 후 Enter
5. `In which directory is your code located?` → 그냥 Enter (현재 폴더)
6. `Want to modify these settings?` → `N` 입력 후 Enter

→ 빌드 완료 후 URL 출력

---

## STEP 15: Frontend 프로덕션 배포

```bash
vercel --prod
```

→ `Production: https://xxx.vercel.app` 출력
→ 커스텀 도메인 있으면 `Aliased: https://cursorai.changups.kr` 도 출력

---

## STEP 16: 최종 확인

브라우저에서 Frontend URL 접속:
- https://cursorai-frontend.vercel.app 또는
- https://cursorai.changups.kr (커스텀 도메인)

리스트 생성 등 기능 테스트!

---

# 재배포 방법

## Backend 재배포 (코드 수정 후)

```bash
cd C:\Users\hckim\frients_public\cursorAI\backend
```

```bash
railway up --service api --detach
```

## Frontend 재배포 (코드 수정 후)

```bash
cd C:\Users\hckim\frients_public\cursorAI\frontend
```

```bash
vercel --prod
```

---

# 문제 발생 시

## Railway 로그 확인

```bash
railway logs --service api
```

## Railway 환경변수 확인

```bash
railway variables --service api
```

## Railway 상태 확인

```bash
railway status
```

---

# 전체 명령어 요약

```bash
# 1. CLI 설치
npm install -g @railway/cli
npm install -g vercel

# 2. 로그인
railway login
vercel login

# 3. Backend 배포
cd C:\Users\hckim\frients_public\cursorAI\backend
railway init
railway add                    # PostgreSQL 추가
railway variables --service Postgres   # 비밀번호 확인
railway add --service api      # API 서비스 생성
railway variables --service api --set "PGHOST=postgres.railway.internal" --set "PGPORT=5432" --set "PGDATABASE=railway" --set "PGUSER=postgres" --set "PGPASSWORD=비밀번호" --set "SPRING_PROFILES_ACTIVE=prod"
railway up --service api --detach
railway domain --service api   # URL 받기

# 4. Frontend 배포
cd C:\Users\hckim\frients_public\cursorAI\frontend
echo "VITE_API_URL=Backend_URL" > .env.production
vercel
vercel --prod
```

---

*작성일: 2025-12-28*
