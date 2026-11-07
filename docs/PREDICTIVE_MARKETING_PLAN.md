# 예측마케팅 자동화 엔진 구현 기획서

> 근거 자료: 『빅데이터를 활용한 예측마케팅 전략』(외머 아튼·도미니크 레빈, 마인드큐브, 2017)의 **2부 목차(5~13장)**.
> **주의**: 책 본문은 확인하지 못했고 목차만 근거로 했습니다. 각 장의 세부 규칙(군집 유형, 점수 기준, 캠페인 구성)은
> 본문을 확인한 뒤 반영해야 합니다. 본문 확인이 필요한 항목은 `[본문확인]`으로 표시했습니다.
> 현재 코드 분석은 `WorkflowExecutionService`, `EventService`, `V1__initial_schema.sql`, `ListMember`를 직접 읽은 결과입니다.

---

## 1. 현재 엔진의 상태 (코드로 확인한 사실)

| 항목 | 현재 | 예측마케팅에 필요한 것 |
|---|---|---|
| 처리 방식 | 이벤트 1건이 들어오면 `EventService.processEvent`가 런칭된 워크플로우를 전부 순회하며 **즉시·동기** 실행 | 시간 기반(지연, 주기) 실행 |
| 조건 타입 | `list`(리스트 소속), `custom_event`(이벤트 이름 일치) 두 가지뿐 | 단계, 점수, 세그먼트, 구매 횟수·금액 조건 |
| 액션 타입 | `list`(추가/제거), `webhook`(알림봇 포함) | 대기(wait), 단계 변경, 점수 갱신 |
| 지연 실행 | **없음** (`@Scheduled`/`@EnableScheduling` 사용처 없음) | "구매 3일 뒤", "30일 미접속 시" 같은 시간 조건 |
| 고객 모델 | **없음**. 고객은 이메일 문자열이고 `list_members`에만 존재 | 고객 테이블, 구매 이력, 지표 |
| 이벤트 저장 | `event_logs.event_data`에 JSON 문자열(TEXT) | 구매 금액·상품 집계용 정규화 테이블 |
| 빈도 조건 | `frequency`, `frequency_period` 필드는 있으나 `evaluateEventCondition`이 **사용하지 않음** | "30일 안에 3회 방문" 같은 조건 |
| `actionLogic` | 정규화는 하지만 `executeActions`에서 **사용하지 않음** | - |
| 목표 조건 | 있음(`goal_groups`, 달성 시 액션 중단) | 전환 측정에 재사용 가능 |
| 중복 방지 | `workflow_processed_leads` 테이블이 있고 `WorkflowService`가 사용함 (동작 방식은 미확인) | 재발송 주기 제어에 활용 |
| 마이그레이션 | Flyway, `V1`과 `V3`만 존재 (`V2` 없음) | 다음 번호를 정할 때 확인 필요 |

**결론**: 규칙 실행 뼈대는 있지만 **시간(지연·배치)**, **고객 데이터 모델**, **점수/단계 조건**이 없습니다. 예측마케팅 9개 전략은 대부분 이 세 가지 위에 올라갑니다.

---

## 2. 9개 전략과 구현 대응

| 장 | 전략 | 구현 방향 | 필요한 기반 | 단계 |
|---|---|---|---|---|
| 5 | 마케팅 지출 최적화 (획득·유지·재활성화 투자, 가치별 차등 지출, 채널별 가치) | 채널(UTM)별 고객 수·매출·고객가치 집계 리포트. 광고비 입력을 받아 채널별 획득비용(CAC) 대비 가치 계산 | 구매 이력, 유입 채널 필드, 광고비 입력 | 4 |
| 6 | 페르소나 예측 (군집) | 고객 지표(구매 주기, 금액, 카테고리)로 군집화하는 배치. 결과를 세그먼트로 저장하고 리스트로 연동 `[본문확인: 군집 유형]` | 고객 지표, 배치 실행 환경 | 3 |
| 7 | 고객여정·생애주기 마케팅 | 생애주기 단계 모델(신규, 활성, 재구매, 휴면 위험, 이탈, 복귀)과 단계 전이 규칙. 단계를 조건으로 사용 `[본문확인: 여정 단계 정의]` | 고객 테이블, 단계 컬럼, 단계 조건 | 1 |
| 8 | 고객가치 예측 | 처음엔 과거 구매 합계 기반 가치, 이후 예측값(구매 빈도 모델 등)으로 교체 | 구매 이력, 지표 배치 | 2 |
| 9 | 구매·참여 가능성 예측 (등급화) | 고객별 점수와 등급(상/중/하). 처음엔 규칙 기반 점수, 이후 모델 `[본문확인: 점수 구간 기준]` | 지표 배치, 점수 조건 | 2→3 |
| 10 | 개인별 추천 | 함께 구매된 상품 통계로 고객별 추천 상품을 만들어 메시지 변수로 전달 | 구매 상품 이력, 상품 ID | 4 |
| 11 | 예측 리마케팅, 유사고객 | 구매 확률 상위 고객 리스트를 광고 플랫폼(맞춤 타깃)으로 내보내기. 유사고객은 플랫폼 기능 활용 | 점수, 리스트 내보내기(CSV/API) | 4 |
| 12 | 구매 후 프로그램, 사은 캠페인 | "구매 후 N일 대기 → 발송" 템플릿 워크플로우 | 대기 액션, 지연 스케줄러 | 1 |
| 13 | 이탈 예방·재활성화 | 이탈 위험 점수 기준 선제 발송, 휴면 고객 복귀 캠페인. 이탈 정의는 업종에 따라 다름 `[본문확인: 이탈 정의, 가치별 차등]` | 단계, 점수, 대기 액션 | 1→2 |

---

## 3. 단계별 로드맵

### 1단계 — 시간과 고객 기반 (7, 12, 13장 규칙 기반 버전)

가장 먼저 만들 것입니다. 점수 없이도 "구매 3일 뒤 후기 요청", "60일 미구매 시 복귀 쿠폰"이 동작합니다.

1. **지연 실행**
   - `scheduled_actions` 테이블(워크플로우 ID, 고객, 실행 예정 시각, 상태)을 만들고 `@Scheduled` 작업이 1분마다 실행 예정 건을 처리합니다.
   - 새 액션 타입 `wait`(예: 3일)을 추가합니다. `executeActions`가 `wait`를 만나면 나머지 액션을 예약 건으로 저장합니다.
2. **고객·구매 모델**
   - `customers`: 이메일, 최초·최종 활동 시각, 현재 생애주기 단계, 유입 채널
   - `purchases`: 고객, 금액, 상품 ID, 구매 시각. `event_logs`에서 `purchase` 이벤트가 들어올 때 함께 적재합니다. 이벤트 JSON 필드 이름은 사용 중인 GTM 설정에 맞춰야 하므로 확인이 필요합니다.
3. **생애주기 단계**
   - 단계 전이 규칙은 설정으로 둡니다(예: 마지막 구매 후 N일 경과 → 휴면 위험). 일 단위 배치로 갱신하고 단계가 바뀌면 `stage_changed` 이벤트를 내보내 기존 워크플로우의 트리거로 씁니다.
4. **새 조건 타입** (`evaluateConditionGroup`에 추가): `stage`, `purchase_count`, `days_since_last_purchase`
5. **기존 결함 정리**: `frequency` 필드 반영, `actionLogic` 사용 여부 결정
6. **템플릿**: 구매 후 감사, 후기 요청, 재구매 유도, 휴면 복귀 워크플로우 템플릿

### 2단계 — 점수와 고객가치 (8, 9, 13장)

1. `customer_metrics` 테이블: RFM(최근성, 빈도, 금액), 누적 가치, 이탈 위험 점수, 구매 가능성 점수, 계산 시각
2. 일 단위 배치 계산(처음에는 SQL과 규칙 기반 가중치)
3. 새 조건 타입 `score`(지표 이름, 비교, 값)와 점수 등급 조건
4. 점수 등급별 리스트 자동 갱신(`list` 액션 재사용)

### 3단계 — 모델 도입 (6, 9장)

1. 군집화와 구매·이탈 확률 모델은 Java 내부 구현보다 **별도 Python 배치/서비스**가 적합합니다. 결과를 `customer_metrics`와 `segments`에 쓰기만 하면 엔진은 변경이 필요 없습니다.
2. 학습에 필요한 데이터량은 확인이 필요합니다. 구매 이력이 충분하지 않으면 2단계의 규칙 기반 점수를 유지하는 편이 낫습니다.
3. 모델 성능은 목표 조건(`goal_groups`)과 전환 데이터로 측정합니다.

### 4단계 — 분석·추천·광고 연동 (5, 10, 11장)

1. 채널별 획득비용 대비 고객가치 리포트(광고비 입력 화면 포함)
2. 함께 구매 상품 기반 추천을 메시지 변수로 제공
3. 상위 점수 고객 리스트의 CSV·광고 플랫폼 내보내기

---

## 4. 데이터 모델 초안 (1~2단계)

```sql
-- 다음 마이그레이션 번호는 V2 부재 여부를 확인한 뒤 결정
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_seen_at TIMESTAMP, last_seen_at TIMESTAMP,
  lifecycle_stage VARCHAR(30), stage_changed_at TIMESTAMP,
  acquisition_channel VARCHAR(100)
);
CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  amount NUMERIC(14,2), product_id VARCHAR(100),
  purchased_at TIMESTAMP, event_id BIGINT REFERENCES event_logs(id)
);
CREATE TABLE customer_metrics (
  customer_id BIGINT PRIMARY KEY REFERENCES customers(id),
  recency_days INT, frequency INT, monetary NUMERIC(14,2),
  value_score NUMERIC, churn_risk NUMERIC, purchase_propensity NUMERIC,
  segment VARCHAR(50), computed_at TIMESTAMP
);
CREATE TABLE scheduled_actions (
  id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT REFERENCES workflows(id) ON DELETE CASCADE,
  customer_email VARCHAR(255), remaining_actions TEXT, event_data TEXT,
  run_at TIMESTAMP NOT NULL, status VARCHAR(20) DEFAULT 'pending'
);
CREATE INDEX idx_scheduled_due ON scheduled_actions(status, run_at);
```

---

## 5. 변경 지점 요약 (기존 코드)

- `WorkflowExecutionService.evaluateConditionGroup`: `stage`, `score`, `purchase_count`, `days_since_last_purchase` 분기 추가
- `WorkflowExecutionService.executeActions`: `wait` 액션 처리(예약 저장 후 중단), 예약 건 재개 진입점 추가
- `EventService.processEvent`: 구매 이벤트 적재 단계 추가
- 신규: `LifecycleService`, `MetricsService`(배치), `ScheduledActionRunner`
- 프런트: `ConditionBuilder.vue`, `ActionBuilder.vue`에 새 조건·액션 입력 추가, 고객 상세·세그먼트 화면

---

## 6. 위험과 확인 필요 사항

1. **개인정보**: 고객 이메일·구매 이력을 점수화하므로 개인정보 처리방침과 마케팅 수신 동의 확인이 필요합니다. 동의하지 않은 고객에게는 발송하지 않는 조건이 필요합니다.
2. **발송 비용**: 알림톡 등 건당 비용이 있습니다. 점수 기반 대량 발송은 잘못 설정하면 비용이 급증하므로 일일 발송 상한과 승인 단계가 필요합니다.
3. **동기 처리**: 지금은 이벤트 수신 요청 안에서 모든 워크플로우를 실행합니다. 워크플로우가 늘면 응답이 느려지므로 1단계에서 비동기 처리 전환을 검토합니다.
4. **다중 사용자 분리**: 확인한 범위에서는 사용자(테넌트) 구분이 보이지 않습니다. 고객 테이블을 추가하기 전에 단일 사용자 시스템인지 확인이 필요합니다.
5. **구매 이벤트 형식**: 현재 수집되는 GTM 이벤트에 금액·상품 ID가 들어오는지 확인되지 않았습니다. 1단계의 전제 조건입니다.
6. **업종·데이터량**: 이탈 정의와 모델 적용 가능 여부는 업종과 구매 데이터량에 달려 있습니다.

## 7. 다음 결정 사항

- [ ] 책 본문 중 우선 확인할 장: 7장(고객여정), 12장(구매 후), 13장(이탈) 권장
- [ ] 구매 이벤트에 들어오는 필드 확인
- [ ] 1단계 착수 승인
