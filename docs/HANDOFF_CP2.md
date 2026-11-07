# 인수인계 — 예측마케팅 자동화 엔진 기획 (cp2 세션용)

> **작성**: CursorAI 세션(GitHub `support6034/frients_public-cursorai`), 2026-11-07~08.
> **목적**: 이 세션이 한 기획 작업 전체를 cp2 팀이 이어받을 수 있게 기록.
> **성격**: 이 세션은 **기획·문서 작업만** 했고 **코드는 한 줄도 바꾸지 않았습니다.** cp2 소스에는 접근하지 못했습니다(아래 6절).

---

## 1. 무엇을 하려던 작업인가

『빅데이터를 활용한 예측마케팅 전략』(외머 아튼·도미니크 레빈)의 2부 9가지 전략을, 기존 워크플로우 엔진(이벤트 → 조건 평가 → 웹훅 → 알림톡) 위에 **고객·구매 데이터 + 생애주기 + 점수 + 지연 발송**을 더해 구현하려는 것.

처음에는 이 저장소(CursorAI)에 구현하려 했으나, cp2 조사 결과 **smartup에 이미 상당 부분이 운영 중**임이 드러나 구현 위치를 재검토 중(아래 5절).

---

## 2. 산출물 (이 저장소 `docs/`)

| 파일 | 내용 |
|---|---|
| `PREDICTIVE_MARKETING_PLAN.md` | **메인 기획서.** 책 규칙 추출(2-1~2-6절), 4단계 로드맵, 데이터 모델 초안, 시스템 다이어그램(8절), cp2 교차 검증(9절) |
| `SMARTUP_GAP_ANALYSIS.md` | 기획서 ↔ smartup 기존 구조 항목별 대조(재사용/확장/신규). **선택지 B 확정 시 cp2 명세서로 다듬을 초안** |
| `book/README.md` | 책 목차·도표 수치·추출 규칙 위치. 본문 전문은 저작권상 미수록 |
| `HANDOFF_CP2.md` | 이 문서 |

기획서 기준 **책에서 반영 완료한 장**: 3장(94-108), 7, 8, 9, 12, 13장 (본문+도표 사진 확인).
**미확보 장**: 4(LTV), 5, 6, 10, 11, 17, 부록 → `book/README.md` 마지막 절에 우선순위.

---

## 3. 책에서 확정한 핵심 규칙 (기획서 2절 요약)

- **생애주기 7값**(3장 도표 3.5 기준): 예상고객 / 신규 / 반복 / 비활성 일회성 / 비활성 반복 / 유효기간경과 일회성 / 유효기간경과 반복. 임계값 90일·365일(설정).
- **가치 세그먼트 10/60/30**(8장): 가치 순위 상위 10% VIP / 60% 중간 / 30% 낮음. 비율 기준(금액 기준 아님). 마진 기준 권장.
- **가치 이동 행렬**(8장 도표 8.2~8.4): 이전 12개월 × 최근 12개월 교차, "소리 없는 감소" 추적.
- **구매 가능성으로 할인 차등**(9장): 높을수록 적은 할인, 낮을수록 큰 할인. 과거 반응 할인 수준 이내.
- **참여 세그먼트 5종**(9장): 마니아/길거리쇼핑객/잠꾸러기/유령/신참. 세그먼트별 발송 빈도. 신참 60일은 생애주기·행동 메일만.
- **재보충 알림**(12장): 개별 주기 → 전체 평균 → 수동 순. 통제 그룹 필수.
- **유지 지출 상한**(13장): X = Y(%) × LTV. 재활성화 비용 = 신규의 1/10.
- **수신거부 비용**(9장): 미래 LTV 60% 손실.

---

## 4. 설계한 데이터 모델 (신규 테이블, 기획서 4절)

`customers`, `customer_identities`(식별자 정규화·병합), `customer_merge_log`, `purchases`+`purchase_items`, `product_cycles`, `customer_metrics`(RFM·점수·가치), `value_snapshots`(가치 이동), `scheduled_actions`(지연), `workflow_holdouts`(통제 그룹), `message_log`.

> ⚠️ cp2 조사 후 판명: 이 중 상당수가 smartup에 **이미 존재**(아래 5절). 신규 설계를 그대로 만들면 중복.

---

## 5. cp2 조사 결과 (기획서 9절, 두 보고서 종합) — 가장 중요

두 AI(작성 41, 총괄PM 65)가 cp2 소스를 읽어 보고. **후속 8문항으로 확정(11-08):**

### 5.1 기존 자산 (smartup, 같은 DB) — 재사용 가능
- `lead`(식별 고객, **6.4만 건**, email·phone 거의 100%, `lead_score` 컬럼), `customer`(영구 식별자 1,949건, `merged_into_cid`), `events`, `workflow`, `workflow_leads`(이탈=REMOVED), `scheduled_actions`(지연 48건), `workflow_events`(재시도), `message_log`(**13.9만 건**), `workflow_action_log`, `campaign`, `lead_group`(스마트 조건), `FunnelService`(funnel_move), `agent_retarget_rule`(`dedup_days`·`daily_cap`), `agent_outcome_ledger`(holdout·성과 **22건**), `agent_stats_daily`(click·conversion 컬럼).
- 조건엔진: `ConditionEvaluator`, `WorkflowExecutionService`/`WorkflowTriggerService`.
- 수신 동의: `lead.marketing_consent_yn` + `agent_profile.consent_marketing`+`consent_at`(회사 단위 `ai_bot_settings.subscribed`는 별개).

### 5.2 신규로 남는 부분 (두 보고서 "찾지 못함")
1. 스마트스토어 주문 **저장·엔진 결선**(현재 폴러는 상태→템플릿 직결, DRY_RUN, `/api/events` 미연결)
2. 생애주기 7값 판정 + `stage_changed`
3. RFM·가치 세그먼트(10/60/30), 가치 이동 리포트
4. `lead_score`를 채우는 **스코어링 산식**(컬럼만 있음)
5. 통제 그룹 **실제 배정·집계**(`holdout_ratio` 파라미터·원장은 있음)
6. 재구매 주기, 인센티브 상한, 빈도 상한 확장
7. 템플릿·프로파일·리포트 화면

### 5.3 막힌 전제 2가지
- **구매 이력 백필 불가**: 네이버 커머스는 36시간 초과 질의에 빈 응답 → `now-90일` 요청해도 최근분만. 페이지 처리(moreSequence) 없음. → 과거 12~24개월은 **판매자센터 주문 CSV / 정산 데이터 / 지금부터 적재** 중 선택 필요.
- **고객 키**: `ordererEmail` null 가능, 예약은 이메일 없음 → 전화(`phone_norm`) 중심. `orderId` 비저장이라 주문 묶음·최초/반복 판정을 적재 단계에서 생성.

### 5.4 못 찾은 것 (라이브/문서 확인 필요)
원가(마진), 알림톡 열람·클릭·수신거부 콜백, 건당 비용, 야간 발송 제한, 라이브 원본 1건의 금액·클레임·안심번호·이메일, 라이브 집계(기간·재구매율), 알림봇 라이브 배포 SHA.

### 5.5 스마트스토어 폴러 사실관계
- 위치: `ai-alimbot/user/backend/.../service/SmartStoreService.java`, `SmartStorePollingService.java`. (Node `smartstore_poling` 저장소는 **없음** — 우리 저장소 문서 설명은 낡음.)
- 주문 상태 8종: PAYED, CANCELED, DISPATCHED, PICKED_UP, DELIVERING, DELIVERY_EXPECTED, DELIVERED, PURCHASE_DECIDED. (환불완료·리뷰요청 상태 없음.)
- 네이버 API: `api.commerce.naver.com`, bcrypt 서명, 60초 폴링, (상품주문번호×템플릿) 중복 방지.

---

## 6. 접근·환경 상태 (이 세션이 못 한 것)

- **cp2 GitLab(`frients2027/cp2`) 접근 실패.** 환경에 저장한 `gitlab.com` 인증이 401로 거부됨(공개 저장소도 401 → 저장된 값 자체가 무효). 복제·조사 전부 두 AI 보고서에 의존.
- **운영 DB·라이브 API 미조회.** 수치는 11-06 백업 기준이지 라이브 아님.
- cp2 규칙 준수: 상용 수정 금지, 발송 동결(DRY_RUN·워크플로우 OFF), 배포 65 단독, 브랜치 `cp2-Rel1.1` — 이 세션은 cp2에 아무 변경도 하지 않음.

### 🔴 보안 (전달 전 조치)
- cp2 중첩 저장소 remote URL에 GitLab PAT가 박혀 있음 → URL 외부 노출 금지, 토큰 회전 검토.
- `ai-alimbot/.../front/src/data/lead-sample.json` 실 PII 평문, 백업 설정 테이블에 스마트스토어 client_secret 평문 → 마스킹·`<REDACTED>` 처리.
- (이 세션 채팅에 GitLab PAT가 평문으로 입력된 적 있음 → 해당 토큰 폐기 권장.)

---

## 7. 열린 결정 사항 (cp2 팀이 정해야 함)

1. **구현 위치**: A(CursorAI 독립, 중복 큼) / **B(smartup 대상 명세서, 권장)** / C(smartup 직접 구현). 이 세션 권고 = B.
2. **구매 이력 확보 방식**: 판매자센터 CSV / 정산 데이터 / 지금부터 적재.
3. `scheduled_actions`가 실행 직전 재검사(재구매·동의)를 하는가?
4. `FunnelService` stage로 생애주기 7값을 담을 수 있는가?
5. `agent_outcome_ledger`·`holdout_ratio`가 통제 그룹 **배정**까지 하는가?
6. (대표 승인 시) 라이브 원본 1건·라이브 집계 조사.

---

## 8. 다음 작업 순서 (권장)

1. 위 7-1(위치)을 B로 확정 → `SMARTUP_GAP_ANALYSIS.md`를 cp2 명세서로 확장(재사용 자산 전제, 신규 7개만 상세화).
2. 7-2(구매 이력) 확정 → 적재 파이프라인 설계.
3. 미확보 장(4장 LTV 우선) 스캔 → 기획서 2절 보강.
4. 라이브 승인 조사(원가·콜백·집계) → 8장 마진·9장 참여 모델 확정.
5. 신규 7개를 smartup 코드 규칙(snake_case payload, core 레지스트리 우선, bootRun 게이트)에 맞춰 구현.

---

## 9. 커밋 이력 (이 세션, 브랜치 `ccr-c5250c88-uvv6wg`)

```
docs: Add predictive marketing automation implementation plan
docs: Reflect chapter 7 lifecycle rules
docs: Reflect chapter 12 post-purchase and loyalty rules
docs: Confirm figure 12.1 hourglass funnel
docs: Reflect chapter 13 retention and reactivation rules
docs: Fill in chapter 13 tables and figures from book photos
docs: Reflect chapter 8 value-based marketing
docs: Reflect chapter 9 propensity and engagement rules
docs: Reflect chapter 3 data collection and integration
docs: Add implementation placement and system diagrams
docs: Record cp2 cross-check of two reports and open decisions
docs: Add gap analysis between the plan and existing smartup structure
docs: Fold the two follow-up cp2 reports into the plan and gap analysis
(+ 책 원본 참조·인수인계 문서)
```
