# DearMe 스케일링 전략 가이드

이 문서는 DearMe 서비스의 성장에 따른 단계별 스케일링 전략과 트래픽 모니터링 방법을 정리합니다.

---

## 목차

1. [현재 인프라 현황](#현재-인프라-현황)
2. [단계별 스케일링 전략](#단계별-스케일링-전략)
3. [트래픽 모니터링 방법](#트래픽-모니터링-방법)
4. [병목 지점 및 개선 우선순위](#병목-지점-및-개선-우선순위)
5. [비용 예측](#비용-예측)

---

## 현재 인프라 현황

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel                        │
│                      (HTTPS 터미널)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                        Nginx                                 │
│              (리버스 프록시 + 정적 파일)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼─────────┐         ┌───────────▼───────────┐
│   FastAPI Backend │         │   React Frontend      │
│   (Uvicorn 4w)    │         │   (정적 빌드 파일)     │
└─────────┬─────────┘         └───────────────────────┘
          │
┌─────────▼─────────┐
│   PostgreSQL 15   │
│   (단일 인스턴스)  │
└───────────────────┘
```

### 현재 구성 상세

| 컴포넌트 | 구성 | 용량/성능 |
|----------|------|-----------|
| **Backend** | Uvicorn 4 workers | ~100-200 동시 요청 처리 |
| **Database** | PostgreSQL 15 단일 인스턴스 | 기본 커넥션 풀 |
| **Frontend** | Nginx 정적 파일 서빙 | 캐싱 적용 (1년) |
| **HTTPS** | Cloudflare Tunnel | DDoS 보호 포함 |
| **AI 서비스** | OpenAI API 직접 호출 | 동기 처리 |

### 현재 제약 사항

1. **DB 커넥션**: SQLAlchemy 기본 풀 (pool_size=5)
2. **캐시 없음**: 모든 요청이 DB로 직접 연결
3. **AI 동기 처리**: LLM 호출 시 워커 블로킹
4. **수평 확장 불가**: 단일 서버 구조

---

## 단계별 스케일링 전략

### Phase 1: 현재 (0-1,000 DAU)

현재 인프라로 충분히 운영 가능한 단계입니다.

**현재 구성으로 처리 가능한 규모:**
- DAU: ~1,000명
- 동시 접속: ~100명
- 일일 일기 작성: ~500건
- 페르소나 대화: ~2,000회

**최적화 포인트:**
```python
# backend/app/core/database.py - 커넥션 풀 조정
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,        # 5 → 10
    max_overflow=20,     # 10 → 20
    pool_pre_ping=True,
)
```

---

### Phase 2: 중간 규모 (1,000-10,000 DAU)

사용자 증가에 따른 첫 번째 스케일링 단계입니다.

#### 2.1 Redis 캐시 레이어 추가

```yaml
# docker-compose.prod.yml 추가
redis:
  image: redis:7-alpine
  container_name: dearme-redis
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  networks:
    - internal
  restart: unless-stopped
```

**캐시 대상:**
| 데이터 | TTL | 예상 효과 |
|--------|-----|----------|
| 사용자 세션 | 24h | 인증 조회 90% 감소 |
| 페르소나 정보 | 1h | 대화 시작 시 DB 조회 감소 |
| 일기 통계 | 10m | 대시보드 로딩 속도 향상 |
| 친구 목록 | 5m | 소셜 기능 응답 개선 |

#### 2.2 PgBouncer 커넥션 풀링

```yaml
# docker-compose.prod.yml 추가
pgbouncer:
  image: edoburu/pgbouncer:1.21.0
  container_name: dearme-pgbouncer
  environment:
    DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
  networks:
    - internal
  depends_on:
    - postgres
```

**효과:**
- DB 커넥션 재사용으로 연결 오버헤드 감소
- 트랜잭션 모드로 커넥션 효율 극대화
- 최대 1,000개 클라이언트 연결 지원

#### 2.3 PostgreSQL Read Replica

```yaml
# docker-compose.prod.yml 추가
postgres-replica:
  image: postgres:15
  container_name: dearme-postgres-replica
  environment:
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  command: |
    postgres
    -c wal_level=replica
    -c hot_standby=on
    -c max_wal_senders=3
  volumes:
    - postgres_replica_data:/var/lib/postgresql/data
  networks:
    - internal
```

**읽기/쓰기 분리:**
```python
# 읽기 전용 쿼리는 replica로
@router.get("/diaries")
async def get_diaries(db: AsyncSession = Depends(get_read_db)):
    ...

# 쓰기 작업은 primary로
@router.post("/diaries")
async def create_diary(db: AsyncSession = Depends(get_write_db)):
    ...
```

#### 2.4 Cloudflare CDN 활성화

Cloudflare 대시보드에서 설정:

| 설정 | 권장값 | 효과 |
|------|--------|------|
| **Caching Level** | Standard | 정적 리소스 자동 캐싱 |
| **Browser Cache TTL** | 1 year | 클라이언트 캐시 활용 |
| **Always Online** | On | 서버 다운 시 캐시 서빙 |
| **Auto Minify** | JS, CSS, HTML | 파일 크기 감소 |
| **Brotli** | On | 압축률 향상 |

#### 2.5 Backend 수평 확장

```yaml
# docker-compose.prod.yml 수정
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '1'
        memory: 1G
```

```nginx
# nginx/conf.d/default.conf 수정
upstream backend {
    least_conn;  # 최소 연결 로드밸런싱
    server backend:8000 weight=1;
    server backend:8000 weight=1;
    server backend:8000 weight=1;
    keepalive 32;
}
```

---

### Phase 3: 대규모 (10,000+ DAU)

서비스 규모가 커지면 근본적인 아키텍처 변경이 필요합니다.

#### 3.1 Kubernetes 전환

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Backend Pod │  │ Backend Pod │  │ Backend Pod │   HPA        │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │  (Auto)      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                     │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │              Ingress Controller               │              │
│  │              (Nginx or Traefik)               │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Redis    │  │  PostgreSQL │  │   Message   │              │
│  │   Cluster   │  │   (Cloud)   │  │    Queue    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

**권장 Kubernetes 서비스:**
- AWS EKS / GCP GKE / Azure AKS
- 관리형 PostgreSQL (RDS, Cloud SQL)
- 관리형 Redis (ElastiCache, Memorystore)

#### 3.2 메시지 큐 도입 (AI 비동기 처리)

```yaml
# AI 작업을 비동기로 처리
celery:
  image: dearme-backend
  container_name: dearme-celery
  command: celery -A app.workers worker -l info -Q ai_tasks
  environment:
    - CELERY_BROKER_URL=redis://redis:6379/1
    - CELERY_RESULT_BACKEND=redis://redis:6379/2
  depends_on:
    - redis
    - postgres
```

**비동기 처리 대상:**
| 작업 | 현재 | 개선 후 |
|------|------|---------|
| 페르소나 생성 | 동기 (10-30초 블로킹) | 비동기 + 웹소켓 알림 |
| 심리 분석 | 동기 | 비동기 |
| 주간/월간 리포트 | 동기 | 스케줄 배치 처리 |

#### 3.3 서비스 분리 (마이크로서비스)

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼───┐           ┌─────▼─────┐         ┌─────▼─────┐
│ Auth  │           │   Diary   │         │    AI     │
│Service│           │  Service  │         │  Service  │
└───┬───┘           └─────┬─────┘         └─────┬─────┘
    │                     │                     │
┌───▼───┐           ┌─────▼─────┐         ┌─────▼─────┐
│ User  │           │  Diary    │         │ OpenAI    │
│  DB   │           │    DB     │         │   API     │
└───────┘           └───────────┘         └───────────┘
```

**분리 우선순위:**
1. AI 서비스 (가장 리소스 집약적)
2. 인증 서비스 (보안 격리)
3. 알림 서비스 (비동기 특성)

---

## 트래픽 모니터링 방법

### 즉시 사용 가능: Cloudflare Analytics

Cloudflare 대시보드에서 제공하는 기본 분석:

| 지표 | 확인 방법 | 활용 |
|------|----------|------|
| **총 요청 수** | Analytics > Traffic | 일일/주간 트래픽 추세 |
| **고유 방문자** | Analytics > Traffic | DAU 추정 |
| **대역폭** | Analytics > Traffic | CDN 효율 확인 |
| **캐시 적중률** | Analytics > Caching | 캐시 최적화 필요성 판단 |
| **위협 차단** | Security > Events | 보안 상태 확인 |
| **오류율** | Analytics > Traffic | 5xx 에러 모니터링 |

### Docker 레벨 모니터링: cAdvisor

```yaml
# docker-compose.monitoring.yml
cadvisor:
  image: gcr.io/cadvisor/cadvisor:latest
  container_name: dearme-cadvisor
  ports:
    - "8080:8080"
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
  networks:
    - internal
```

**모니터링 가능 지표:**
- 컨테이너별 CPU/메모리 사용량
- 네트워크 I/O
- 디스크 I/O
- 컨테이너 상태 (uptime, restarts)

### 권장: Prometheus + Grafana 스택

```yaml
# docker-compose.monitoring.yml
prometheus:
  image: prom/prometheus:latest
  container_name: dearme-prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.retention.time=30d'
  networks:
    - internal

grafana:
  image: grafana/grafana:latest
  container_name: dearme-grafana
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
  volumes:
    - grafana_data:/var/lib/grafana
    - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
  depends_on:
    - prometheus
  networks:
    - internal
```

**Prometheus 설정 (monitoring/prometheus.yml):**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

**FastAPI 메트릭 추가:**
```python
# backend/app/main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Prometheus 메트릭 엔드포인트 추가
Instrumentator().instrument(app).expose(app)
```

```bash
# requirements.txt 추가
prometheus-fastapi-instrumentator==6.1.0
```

### 핵심 모니터링 대시보드

**1. 서비스 상태 대시보드:**
| 패널 | 쿼리 예시 | 알림 조건 |
|------|----------|----------|
| API 응답시간 | `histogram_quantile(0.95, http_request_duration_seconds)` | p95 > 2초 |
| 에러율 | `rate(http_requests_total{status=~"5.."}[5m])` | > 1% |
| 동시 요청 | `http_requests_inprogress` | > 80 |

**2. 리소스 대시보드:**
| 패널 | 쿼리 예시 | 알림 조건 |
|------|----------|----------|
| CPU 사용률 | `container_cpu_usage_seconds_total` | > 80% |
| 메모리 사용률 | `container_memory_usage_bytes` | > 85% |
| DB 커넥션 | `pg_stat_activity_count` | > pool_size * 0.8 |

**3. 비즈니스 대시보드:**
| 패널 | 데이터 소스 | 용도 |
|------|------------|------|
| DAU/MAU | 로그 분석 | 성장 추적 |
| 일기 작성 수 | DB 쿼리 | 핵심 지표 |
| AI 호출 수 | API 로그 | 비용 모니터링 |

---

## 병목 지점 및 개선 우선순위

### 예상 병목 지점 분석

```
요청 흐름 시간 분석 (현재 추정):

Cloudflare → Nginx → Backend → DB → AI (OpenAI)
   ~10ms      ~5ms     ~20ms   ~50ms  ~3000ms
   └────────────────────────────────────────┘
              총 ~3,100ms (AI 호출 시)
              총 ~85ms (일반 API)
```

### 우선순위별 개선 방안

#### 1순위: DB 커넥션 풀링 (즉시 적용 가능)

**문제:** 기본 SQLAlchemy 풀 크기(5)로 동시 요청 병목
**해결:** 커넥션 풀 확대 + PgBouncer 도입
**효과:** 동시 처리량 5배 증가

```python
# backend/app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)
```

#### 2순위: 캐시 레이어 도입

**문제:** 모든 요청이 DB 직접 조회
**해결:** Redis 캐시 레이어 추가
**효과:** DB 부하 60-70% 감소

```python
# backend/app/core/cache.py
from redis import asyncio as aioredis

redis = aioredis.from_url("redis://redis:6379")

async def get_cached_persona(user_id: int) -> dict | None:
    cached = await redis.get(f"persona:{user_id}")
    if cached:
        return json.loads(cached)
    return None

async def set_cached_persona(user_id: int, data: dict, ttl: int = 3600):
    await redis.setex(f"persona:{user_id}", ttl, json.dumps(data))
```

#### 3순위: AI 서비스 비동기화

**문제:** LLM 호출 시 워커 3-10초 블로킹
**해결:** Celery + Redis로 백그라운드 처리
**효과:** API 응답 시간 90% 단축 (즉시 응답 + 비동기 처리)

```python
# backend/app/workers/tasks.py
from celery import Celery

celery_app = Celery('dearme', broker='redis://redis:6379/1')

@celery_app.task
def generate_persona_async(user_id: int, diary_ids: list[int]):
    # 페르소나 생성 로직
    persona = PersonaService.generate(user_id, diary_ids)
    # 완료 알림 (WebSocket 또는 푸시)
    notify_user(user_id, "persona_ready", persona)
```

#### 4순위: 프론트엔드 최적화

**문제:** 초기 번들 크기, 리소스 로딩 시간
**해결:** 코드 스플리팅 + 이미지 최적화 + 프리페치

```typescript
// React Router lazy loading
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const PersonaPage = lazy(() => import('./pages/PersonaPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
```

---

## 비용 예측

### 단계별 인프라 비용 (월간)

| 규모 | 인프라 구성 | 예상 비용 (AWS 기준) |
|------|------------|---------------------|
| **Phase 1** (현재) | EC2 t3.medium + RDS t3.micro | ~$50-80 |
| **Phase 2** | EC2 t3.large x2 + RDS t3.small + ElastiCache t3.micro | ~$200-300 |
| **Phase 3** | EKS + RDS r5.large + ElastiCache m5.large | ~$800-1,500 |

### 세부 비용 분석

#### Phase 1 (0-1,000 DAU)
| 항목 | 사양 | 월 비용 |
|------|------|--------|
| EC2 (단일 서버) | t3.medium (2 vCPU, 4GB) | ~$30 |
| RDS PostgreSQL | t3.micro (1 vCPU, 1GB) | ~$15 |
| EBS | 50GB gp3 | ~$5 |
| 데이터 전송 | ~100GB | ~$10 |
| **소계** | | **~$60/월** |

#### Phase 2 (1,000-10,000 DAU)
| 항목 | 사양 | 월 비용 |
|------|------|--------|
| EC2 (Backend x2) | t3.large (2 vCPU, 8GB) x2 | ~$120 |
| RDS PostgreSQL | t3.small (2 vCPU, 2GB) + Read Replica | ~$60 |
| ElastiCache Redis | t3.micro (1 노드) | ~$15 |
| ALB | 로드밸런서 | ~$20 |
| EBS | 100GB gp3 | ~$10 |
| 데이터 전송 | ~500GB | ~$50 |
| **소계** | | **~$275/월** |

#### Phase 3 (10,000+ DAU)
| 항목 | 사양 | 월 비용 |
|------|------|--------|
| EKS 클러스터 | 관리 비용 | ~$75 |
| EC2 노드 그룹 | m5.large x3 | ~$200 |
| RDS PostgreSQL | r5.large + Read Replica | ~$400 |
| ElastiCache Redis | m5.large 클러스터 | ~$200 |
| ALB | 로드밸런서 | ~$50 |
| CloudWatch | 로그 + 메트릭 | ~$100 |
| 데이터 전송 | ~2TB | ~$200 |
| **소계** | | **~$1,225/월** |

### 추가 비용 고려사항

| 항목 | 비용 모델 | 최적화 방안 |
|------|----------|------------|
| **OpenAI API** | 토큰당 과금 | 프롬프트 최적화, 캐싱 |
| **Cloudflare** | 무료 ~ $20/월 (Pro) | 무료 플랜으로 시작 |
| **도메인** | ~$10-15/년 | - |
| **백업 스토리지** | S3 기준 ~$0.023/GB | 수명 주기 정책 설정 |

---

## 스케일링 체크리스트

### 즉시 적용 가능 (비용 $0)
- [ ] SQLAlchemy 커넥션 풀 크기 조정
- [ ] Cloudflare 캐싱 설정 최적화
- [ ] Nginx Gzip 압축 확인
- [ ] 프론트엔드 코드 스플리팅

### Phase 2 진입 시점 (DAU 500+ 도달 시)
- [ ] Redis 캐시 레이어 추가
- [ ] PgBouncer 도입
- [ ] PostgreSQL Read Replica 구성
- [ ] Backend 인스턴스 2개로 확장

### Phase 3 진입 시점 (DAU 5,000+ 도달 시)
- [ ] Kubernetes 전환 검토
- [ ] AI 서비스 비동기 처리 구현
- [ ] 관리형 DB 서비스 마이그레이션
- [ ] 서비스 분리 설계

---

## 참고 자료

- [FastAPI 성능 튜닝](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL 스케일링 가이드](https://www.postgresql.org/docs/current/high-availability.html)
- [Redis 캐싱 패턴](https://redis.io/docs/manual/patterns/)
- [Kubernetes 베스트 프랙티스](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Cloudflare 성능 최적화](https://developers.cloudflare.com/fundamentals/speed/)
