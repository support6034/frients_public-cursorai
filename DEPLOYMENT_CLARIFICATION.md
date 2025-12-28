# 배포 대상 명확화

**작성일**: 2025-12-27

---

## 🔍 현재 상황 확인

### 제 미션
- **원본**: grouptest의 AI 알림봇 기능
- **대상**: cursorAI로 마이그레이션
- **목표**: cursorAI 배포

### 사용자 요청
- cursorAI 배포가 안 되니까
- 이미 배포되어 있는 grouptest를 재배포해보라고 함

### 제가 한 것
- ❌ `grouptest\workflow-automation` 배포 시도
- 이건 잘못된 접근

---

## ✅ 올바른 이해

### grouptest.changups.kr
- **프로젝트**: workflow-automation (React)
- **상태**: 이미 배포되어 정상 작동 중
- **URL**: https://grouptest.changups.kr

### cursorAI
- **프로젝트**: cursorAI (Vue.js)
- **상태**: 배포 필요
- **목표 URL**: https://cursorai.changups.kr

---

## ❓ 확인 필요 사항

1. **grouptest.changups.kr 재배포 목적**?
   - 단순히 배포 방법 검증?
   - 아니면 실제로 재배포가 필요한가?

2. **제가 배포해야 할 것**?
   - cursorAI (제 미션)
   - grouptest (검증용?)

---

**명확화 필요 - 사용자님의 의도 확인 중**

