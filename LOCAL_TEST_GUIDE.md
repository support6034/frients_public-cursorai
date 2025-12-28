# cursorAI 로컬 실행 및 시험 가이드

**작성일**: 2025-12-27  
**프로젝트**: cursorAI (AI 알림봇)

---

## 1. 로컬 실행 가능 여부 확인

### ✅ 확인 완료 사항

- ✅ `backend/node_modules` 존재 확인
- ✅ `frontend/node_modules` 존재 확인
- ✅ `backend/package.json` 확인 완료
- ✅ `frontend/package.json` 확인 완료
- ✅ `backend/server.js` 확인 완료
- ✅ `frontend/vite.config.js` 확인 완료

### ⚠️ 확인 필요 사항

- ⚠️ Node.js 설치 여부 확인 필요
- ⚠️ npm 명령어 인식 여부 확인 필요

---

## 2. 로컬 실행 방법

### 2.1 백엔드 실행

**터미널 1**:
```powershell
cd C:\Users\hckim\frients_public\cursorAI\backend
npm install  # 의존성 설치 (필요시)
npm start    # 또는 npm run dev
```

**예상 출력**:
```
Server is running on port 5000
```

**접속 URL**: http://localhost:5000

### 2.2 프론트엔드 실행

**터미널 2**:
```powershell
cd C:\Users\hckim\frients_public\cursorAI\frontend
npm install  # 의존성 설치 (필요시)
npm run dev  # 개발 서버 실행
```

**예상 출력**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**접속 URL**: http://localhost:5173/ai-bot

---

## 3. 시험 진행 방법

### 3.1 시험 절차

1. **백엔드 서버 실행** (터미널 1)
2. **프론트엔드 서버 실행** (터미널 2)
3. **브라우저에서 접속**: http://localhost:5173/ai-bot
4. **시험절차서 확인**: `CURSORAI_TEST_PROCEDURE_WITH_COMPARISON.md`
5. **각 시험 항목 실행**
6. **결과 기록**:
   - 배포 버전: 이미 기록됨 (1.통과)
   - 신규 버전: 시험 후 기록
   - 비교: ✅/⚠️/❌ 표시

### 3.2 시험 결과 기록 방법

**시험절차서 파일**: `CURSORAI_TEST_PROCEDURE_WITH_COMPARISON.md`

각 시험 항목의 "신규 버전" 컬럼에 다음 중 하나 기록:
- `1.통과` - 기능이 정상적으로 동작함
- `2.확인필요` - 기능은 동작하나 추가 확인이 필요함
- `3.탈락` - 기능이 동작하지 않거나 오류 발생

"비교" 컬럼에 다음 중 하나 표시:
- `✅` - 동일하게 동작함
- `⚠️` - 부분적으로 동작하거나 차이 있음
- `❌` - 동작하지 않음

---

## 4. 예상 시나리오

### 시나리오 1: 정상 실행

1. 백엔드 서버 실행 성공
2. 프론트엔드 서버 실행 성공
3. 브라우저에서 페이지 접속 성공
4. 모든 기능 정상 동작
5. 시험 결과: 대부분 `1.통과`, 비교: `✅`

### 시나리오 2: 부분 실행

1. 백엔드 서버 실행 성공
2. 프론트엔드 서버 실행 성공
3. 브라우저에서 페이지 접속 성공
4. 일부 기능만 동작
5. 시험 결과: 일부 `2.확인필요` 또는 `3.탈락`, 비교: `⚠️` 또는 `❌`

### 시나리오 3: 실행 실패

1. 백엔드 서버 실행 실패
   - 원인: Node.js 미설치, 의존성 오류 등
   - 해결: Node.js 설치, `npm install` 재실행
2. 프론트엔드 서버 실행 실패
   - 원인: Node.js 미설치, 의존성 오류 등
   - 해결: Node.js 설치, `npm install` 재실행
3. 브라우저 접속 실패
   - 원인: 서버 미실행, 포트 충돌 등
   - 해결: 서버 실행 확인, 포트 변경

---

## 5. 문제 해결

### 5.1 Node.js 미설치

**증상**: `node : 'node' 는 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.`

**해결**:
1. Node.js 다운로드: https://nodejs.org/
2. 설치 후 터미널 재시작
3. `node --version` 확인

### 5.2 의존성 오류

**증상**: `npm install` 실행 시 오류 발생

**해결**:
```powershell
cd backend
rm -r node_modules  # 또는 Remove-Item -Recurse node_modules
rm package-lock.json  # 또는 Remove-Item package-lock.json
npm install
```

### 5.3 포트 충돌

**증상**: `Port 5000 is already in use` 또는 `Port 5173 is already in use`

**해결**:
- 다른 프로세스 종료
- 또는 `backend/server.js`에서 포트 변경
- 또는 `frontend/vite.config.js`에서 포트 변경

---

## 6. 시험 결과 업데이트

시험 완료 후:
1. `CURSORAI_TEST_PROCEDURE_WITH_COMPARISON.md` 파일 업데이트
2. 각 시험 항목의 "신규 버전" 컬럼에 결과 기록
3. "비교" 컬럼에 ✅/⚠️/❌ 표시
4. 전체 시험 결과 요약 작성

---

**로컬 실행 가이드 작성 완료**

