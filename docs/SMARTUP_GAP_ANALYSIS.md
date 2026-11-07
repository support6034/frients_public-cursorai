# 예측마케팅 기획서 ↔ cp2 smartup 기존 구조 대조

> **근거와 한계**: cp2 소스를 직접 보지 못했습니다. 다른 AI 둘의 보고서(기획서 `PREDICTIVE_MARKETING_PLAN.md` 9절)에 인용된 DDL과 설명만 근거로 했습니다. 표의 "불명"은 보고서만으로 판단할 수 없는 항목이고, cp2 접근이 있는 사람이 확인해야 합니다.
> **11-08 갱신**: 후속 8문항(기획서 9.8절)으로 일부 "불명"이 확정됨 — 아래에 반영. 핵심: `lead`(6.4만 건)가 고객 마스터, `agent_profile`은 데이터허브 요약(0행), 동의는 `lead.marketing_consent_yn`+`agent_profile.consent_marketing`, 90일 백필 불가(네이버 36시간 제한).
> **표기**: 재사용 = 이미 있어 그대로 쓸 수 있음, 확장 = 있지만 컬럼·로직을 더해야 함, 신규 = 보고서에서 찾지 못함, 불명 = 확인 필요.

---

## 1. 데이터 계층

| 기획서 항목 | 구분 | smartup에 있는 것 (보고서 기준) | 남는 일 |
|---|---|---|---|
| `customers` (고객 마스터) | 재사용·확장 | **`lead`가 고객 마스터**(6.4만 건, email·phone 거의 100% 채움, `lead_score`). `customer`(cid, `merged_into_cid` 병합 개념, 1,949건)가 영구 식별자. `agent_profile`(phone_norm, order_count, consent)은 데이터허브 요약표(현재 0행) | 생애주기 7값, 가치 등급, 서비스 플래그, 재구매 주기 필드 추가 |
| `customer_identities` (식별자 정규화·병합) | 확장 | `customer.merged_into_cid`, `agent_profile.phone_norm`·`anon_ids` | 전화·이메일 정규화 규칙, 병합 이력(되돌리기). 보고서만으로는 병합 로직의 실제 동작 불명 |
| `purchases` / `purchase_items` (주문·상품 줄) | **신규** | 스마트스토어 경로는 메모리만 쓰고 저장 안 함. `agent_profile_event`(type, at, ref, amount, properties)가 이벤트형 후보. 예약은 동적 「예약」 표에 저장 | 스마트스토어 주문 저장(결선 자체가 없음), 할인·원가·배송비 파싱 추가, 주문 묶음(`orderId`) |
| `message_log` (발송 이력) | 확장 | `message_log`(type, message, sender, receiver, lead_code), `workflow_action_log`(요청·응답 payload), `sent_records`(msgid, 상태) | 비용, 할인액, 통제·시험 그룹 표시, 워크플로우 연결. 열람·클릭 컬럼 없음 |
| `scheduled_actions` (지연 예약) | **재사용** | `scheduled_actions`(workflow_code, lead_code, action_index, action_data, scheduled_at, status) | 실행 직전 재검사(재구매, 동의)가 있는지 확인. `workflow_leads.REMOVED`(조건에서 벗어나면 남은 예약 취소)가 비슷한 기능으로 보임 |
| `workflow_holdouts` (통제 그룹) | 확장 | `agent_outcome_ledger.control_group_json`, `/booking/campaign/{wf}/enable`의 `holdout_ratio` 파라미터 | **실제 배정·집계 로직은 못 찾음** |
| `customer_metrics` (RFM, 점수, 가치) | **신규** | `lead.lead_score` 컬럼만 있고 채우는 산식 없음 | 전부 |
| `value_snapshots` (가치 이동) | **신규** | 없음 | 전부 |
| `product_cycles` (재보충 주기) | **신규** | 없음 | 전부 |
| 채널별 수신 동의 | 확장 | **리드 단위 `lead.marketing_consent_yn`** + 프로필 단위 `agent_profile.consent_marketing`+`consent_at`. 회사 단위 `ai_bot_settings.subscribed`는 별개 | `lead.marketing_consent_yn`을 채널별(카카오·문자·이메일·전화·우편)로 확장. setter 갱신 지점은 미확정 |

## 2. 엔진

| 기획서 항목 | 구분 | smartup에 있는 것 | 남는 일 |
|---|---|---|---|
| 조건 평가 | 확장 | `ConditionEvaluator`, `lead_group.is_smart` + `smart_conditions`(자동 갱신) | 새 조건 타입: 생애주기 단계, 구매 횟수·경과일, 점수, 가치 등급 |
| 액션 | 재사용·확장 | 알림톡, 이메일, SMS, 웹훅, 리스트, `funnel_move` | 인센티브 상한 검사, 개인별 할인 금액 |
| 지연 `wait` | 재사용 | `scheduled_actions` | 이벤트 데이터의 날짜 필드(예약일 등)를 기준으로 대기하는지 불명 |
| 이벤트 비동기·재시도 | 재사용 | `workflow_events`(PENDING/PROCESSING/COMPLETED/FAILED/DEAD, 재시도 횟수, 다음 재시도 시각) | 우리 기획서의 "동기 처리" 위험이 smartup에는 이미 해결되어 있음 |
| 빈도 상한 | 확장 | `agent_retarget_rule`(`dedup_days`, `daily_cap`) | 고객당 기간별 상한, 신규 가입 60일 정기 발송 제외, 개인 구매 주기 연동 |
| 생애주기 판정 | **신규** | `FunnelService`(`funnel_move`로 stage 이동)가 있으나 7값 판정과 같은지 불명 | 7값 정의, 일 단위 배치, `stage_changed` 이벤트. 퍼널 stage를 생애주기에 재사용할 수 있는지 확인 |
| 재구매·재방문 유도 | 부분 | `/booking/revisit`(완료 N일째 + 재예약 없음 → 알림톡), `/booking/auto-complete` | **예약 도메인에만** 있음. 스마트스토어 구매에는 없음 |
| 성과 집계 | 재사용 후보 | `agent_stats_daily`(sent, success, fail, click, conversion, conversion_krw) | click·conversion을 채우는 곳 불명 |
| 템플릿(신규 환영, 소모품 리마인드 등) | **신규** | 없음 | 12·13장 템플릿 5~6개 |

## 3. 데이터 수집 (스마트스토어)

| 항목 | 상태 |
|---|---|
| 스마트스토어 → 엔진 결선 | **없음.** 폴러는 상태에서 템플릿으로 직결하고 엔진(조건 평가)을 거치지 않으며, 현재 DRY_RUN |
| 필요한 첫 작업 | 폴러가 주문을 읽을 때 `lead` upsert와 주문 저장, `events` 적재를 하도록 연결 |
| 파싱 보강 | 단가, 할인, 쿠폰, 포인트, 배송비, 클레임(반품·교환·환불) |
| 과거 이력 | 주문 전용 표 없음, `sent_records` 0행. **90일 API 백필은 네이버 36시간 제한으로 실제 불가**(확정). 대안: 판매자센터 주문 CSV, 정산 데이터, 또는 지금부터 적재 |
| 식별 | `ordererEmail`이 null일 수 있고 예약은 이메일 없음 → 전화 중심. 안심번호(0504) 여부는 라이브 미확인. `orderId` 비저장이라 주문 묶음·최초/반복 판정을 적재 단계에서 생성해야 함 |

## 4. 결론: 구현 위치별 영향

**신규로 남는 핵심** (보고서가 "찾지 못함"이라고 한 것)
1. 스마트스토어 주문의 저장과 엔진 결선
2. 생애주기 판정(7값)과 `stage_changed`
3. RFM·가치 세그먼트(10/60/30), 가치 이동 리포트
4. `lead_score`를 채우는 점수 엔진과 할인 결정
5. 통제 그룹의 실제 배정·집계
6. 재구매 주기 계산, 인센티브 상한, 빈도 상한 확장
7. 템플릿과 프로파일·리포트 화면

| 선택지 | 이 대조에서 본 영향 |
|---|---|
| A. CursorAI 독립 구현 | 위 표의 "재사용" 항목(지연 예약, 이벤트 재시도, 리드, 메시지 이력)을 다시 만들게 됩니다. 중복이 가장 큽니다 |
| B. smartup 대상 명세서 | 신규 7개와 "확장" 항목만 정리하면 됩니다. 중복이 가장 적고 이 문서가 그 초안입니다 |
| C. smartup 직접 구현 | 접근·승인 절차(상용 수정 금지, 배포 65 단독)가 필요하고 지금은 제가 접근할 수 없습니다 |

## 5. cp2 쪽에서 확인해야 할 것 (구현 전)

후속 8문항으로 해소된 것(기획서 9.8절)은 제외하고, 아직 남은 것만 적습니다.

1. `scheduled_actions`가 실행 직전에 조건(재구매, 동의)을 다시 평가하는가? (우리 "예약 실행 시 재검사" 요구와 직결)
2. `FunnelService`의 stage가 생애주기 7값을 담을 수 있는가, 아니면 별도 단계 모델이 필요한가?
3. `agent_outcome_ledger`(22건 실데이터)와 `holdout_ratio` 파라미터가 통제 그룹 **배정**까지 하는가, 집계만 하는가?
4. 스마트스토어 주문을 `lead`·`events`로 연결(엔진 결선)하는 작업이 이미 계획되어 있는가?
5. 구매 이력 확보: 판매자센터 주문 CSV 내보내기 / 정산 데이터 / 지금부터 적재 중 어느 방식이 가능한가?
6. (대표 승인 시) 네이버 라이브 원본 1건의 금액·클레임·안심번호·이메일, 라이브 DB의 기간·재구매율 집계.
7. `lead.marketing_consent_yn`의 실제 갱신 지점과 채널별 동의 확장 가능 여부.
