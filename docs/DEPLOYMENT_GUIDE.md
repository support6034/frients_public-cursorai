# CursorAI 배포 절차서

> Vue.js + Spring Boot + PostgreSQL 프로젝트를 Vercel + Railway에 배포하는 완전한 가이드

## 목차
1. [사전 준비](#1-사전-준비)
2. [Backend 배포 (Railway)](#2-backend-배포-railway)
3. [Frontend 배포 (Vercel)](#3-frontend-배포-vercel)
4. [배포 확인](#4-배포-확인)
5. [재배포 방법](#5-재배포-방법)
6. [문제 해결](#6-문제-해결)

---

## 1. 사전 준비

### 1.1 필수 도구 설치

```bash
# Node.js (18 이상)
node --version

# Railway CLI 설치
npm install -g @railway/cli

# Vercel CLI 설치
npm install -g vercel
```

### 1.2 계정 준비
- **Railway**: https://railway.app (GitHub 계정으로 가입, $5 Hobby Plan 권장)
- **Vercel**: https://vercel.com (GitHub 계정으로 가입, 무료)

### 1.3 CLI 로그인

```bash
# Railway 로그인
railway login

# Vercel 로그인
vercel login
```

---

## 2. Backend 배포 (Railway)

### 2.1 프로젝트 구조 확인

```
backend/
├── src/
│   └── main/
│       ├── java/
│       └── resources/
│           └── application-prod.yml  # 프로덕션 설정
├── pom.xml
├── Dockerfile
└── railway.json
```

### 2.2 Dockerfile 확인

`backend/Dockerfile`:
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-1.0.0.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
CMD ["java", "-jar", "app.jar"]
```

### 2.3 railway.json 확인

`backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.4 application-prod.yml 확인

`backend/src/main/resources/application-prod.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${PGHOST:localhost}:${PGPORT:5432}/${PGDATABASE:railway}
    username: ${PGUSER:postgres}
    password: ${PGPASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

server:
  port: 8080
```

### 2.5 Railway 프로젝트 생성 및 배포

```bash
cd backend

# 1. 새 프로젝트 생성
railway init

# 프로젝트 이름 입력 (예: cursorai-backend)
```

```bash
# 2. PostgreSQL 데이터베이스 추가
railway add

# "Add a Database" 선택 → "PostgreSQL" 선택
```

```bash
# 3. Backend 서비스 생성
railway add --service api

# "Empty Service" 선택 → 서비스 이름: api
```

```bash
# 4. PostgreSQL 환경변수 확인
railway variables --service Postgres
```

출력에서 다음 값들을 확인:
- `PGHOST`: postgres.railway.internal
- `PGPORT`: 5432
- `PGDATABASE`: railway
- `PGUSER`: postgres
- `PGPASSWORD`: (자동 생성된 비밀번호)

```bash
# 5. API 서비스에 환경변수 설정
railway variables --service api \
  --set "PGHOST=postgres.railway.internal" \
  --set "PGPORT=5432" \
  --set "PGDATABASE=railway" \
  --set "PGUSER=postgres" \
  --set "PGPASSWORD=여기에_위에서_확인한_비밀번호" \
  --set "SPRING_PROFILES_ACTIVE=prod"
```

```bash
# 6. 배포
railway up --service api --detach

# Build Logs URL이 출력됨 - 클릭해서 빌드 진행 확인
```

```bash
# 7. 도메인 생성
railway domain --service api

# 출력 예: https://api-production-xxxx.up.railway.app
```

**이 URL을 기록해두세요! Frontend 설정에 필요합니다.**

---

## 3. Frontend 배포 (Vercel)

### 3.1 환경변수 파일 생성

`frontend/.env.production`:
```
VITE_API_URL=https://api-production-xxxx.up.railway.app
```

(위에서 받은 Railway Backend URL 입력)

### 3.2 api.js 확인

`frontend/src/api.js`에서 Vite 환경변수 사용 확인:
```javascript
// 올바른 방식 (Vite)
if (import.meta.env.VITE_API_URL) {
  return import.meta.env.VITE_API_URL;
}

// 잘못된 방식 (React) - 이렇게 되어있으면 수정 필요!
// if (process.env.VITE_API_URL) { ... }
```

### 3.3 Vercel 배포

```bash
cd frontend

# 배포 (처음)
vercel

# 질문에 답변:
# - Set up and deploy? Y
# - Which scope? 본인 계정 선택
# - Link to existing project? N
# - Project name? cursorai-frontend
# - Directory? ./
# - Override settings? N
```

```bash
# 프로덕션 배포
vercel --prod
```

### 3.4 커스텀 도메인 설정 (선택)

Vercel 대시보드 → 프로젝트 → Settings → Domains에서 도메인 추가

---

## 4. 배포 확인

### 4.1 Backend 확인

```bash
# 헬스 체크
curl https://api-production-xxxx.up.railway.app/

# 예상 응답: "Spring Boot is running"
```

```bash
# API 테스트
curl https://api-production-xxxx.up.railway.app/api/ai-bot/settings

# 예상 응답: {"data":{...},"success":true}
```

### 4.2 Frontend 확인

브라우저에서 Vercel URL 또는 커스텀 도메인 접속

---

## 5. 재배포 방법

### 5.1 Backend 재배포

```bash
cd backend

# 코드 수정 후 재배포
railway up --service api --detach
```

### 5.2 Frontend 재배포

```bash
cd frontend

# 코드 수정 후 재배포
vercel --prod
```

---

## 6. 문제 해결

### 6.1 "The executable 'java' could not be found"

**원인**: backend 폴더에 Node.js 파일(package.json, server.js 등)이 있어서 Railway가 Node.js로 빌드

**해결**:
```bash
cd backend
rm -f package.json package-lock.json server.js gateway.js database.js
```

### 6.2 "There was an error deploying from source"

**원인**: GitHub-Railway 연동 문제

**해결**: GitHub 연동 대신 Railway CLI 사용
```bash
# 기존 서비스 삭제 (Railway 대시보드에서)
# 새 서비스 생성 및 CLI로 배포
railway add --service api
railway up --service api --detach
```

### 6.3 서비스 CRASHED (DB 연결 실패)

**원인**: PostgreSQL 환경변수 누락

**확인**:
```bash
railway variables --service api
```

**해결**:
```bash
railway variables --service api \
  --set "PGHOST=postgres.railway.internal" \
  --set "PGPORT=5432" \
  --set "PGDATABASE=railway" \
  --set "PGUSER=postgres" \
  --set "PGPASSWORD=비밀번호" \
  --set "SPRING_PROFILES_ACTIVE=prod"

# 재배포
railway up --service api --detach
```

### 6.4 "405 Method Not Allowed" (Frontend에서)

**원인**: Frontend가 Backend URL을 못 읽어서 Vercel로 API 요청

**확인**: `frontend/src/api.js`에서:
```javascript
// 잘못됨 (React 방식)
process.env.VITE_API_URL

// 올바름 (Vite 방식)
import.meta.env.VITE_API_URL
```

**해결**: 수정 후 Frontend 재배포
```bash
cd frontend
vercel --prod
```

### 6.5 Railway 로그 확인

```bash
railway logs --service api
```

### 6.6 Railway 상태 확인

```bash
railway status
```

---

## 배포 완료 체크리스트

- [ ] Railway CLI 설치 및 로그인
- [ ] Vercel CLI 설치 및 로그인
- [ ] Railway 프로젝트 생성
- [ ] PostgreSQL 데이터베이스 추가
- [ ] API 서비스 생성
- [ ] PostgreSQL 환경변수 설정
- [ ] Backend 배포 (`railway up`)
- [ ] Backend 도메인 생성 (`railway domain`)
- [ ] Frontend `.env.production` 설정
- [ ] Frontend 배포 (`vercel --prod`)
- [ ] Backend API 테스트
- [ ] Frontend 접속 테스트

---

## 최종 배포 URL 기록

| 구분 | URL |
|------|-----|
| Frontend | https://cursorai.changups.kr |
| Backend | https://api-production-089a.up.railway.app |

---

*작성일: 2025-12-28*
