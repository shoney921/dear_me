# DearMe (디어미)

일기 기반 AI 페르소나 서비스

## 프로젝트 개요

사용자가 일기를 꾸준히 작성하면 LLM이 일기를 분석하여 **"나만의 AI 캐릭터(페르소나)"**를 생성하고, 친구의 페르소나와 대화할 수 있는 소셜 일기 플랫폼입니다.

### 핵심 기능

1. **일기 작성** - 매일 일기를 작성하고 기분/날씨 태그 추가
2. **페르소나 생성** - 일기 7개 이상 작성 시 AI가 나만의 페르소나 생성
3. **자기 성찰 대화** - 내 페르소나와 대화하며 자기 이해
4. **친구 페르소나 대화** - 친구의 일기 기반 페르소나와 대화 (일기는 비공개)
5. **멀티모달 캐릭터** - DALL-E 3 기반 AI 캐릭터 이미지 생성 및 진화
6. **프리미엄 구독** - 다양한 캐릭터 스타일 및 추가 기능

### 핵심 가치

| 가치 | 설명 |
|------|------|
| 자기 이해 | 일기 작성과 페르소나를 통한 자기 성찰 |
| 프라이버시 보호 | 친구 일기는 비공개, AI 페르소나로만 간접 소통 |
| 관계 강화 | 직접 묻기 어려운 질문을 페르소나에게 |

---

## 기술 스택

### Backend
- **FastAPI 0.104.1** - Python 비동기 웹 프레임워크
- **PostgreSQL 15** - 관계형 데이터베이스
- **SQLAlchemy 2.0** - ORM
- **Alembic** - DB 마이그레이션
- **LangChain 0.3 + OpenAI** - AI/LLM 통합 (GPT-4, DALL-E 3)
- **Pydantic 2.x** - 데이터 검증
- **python-jose + bcrypt** - JWT 인증

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript 5** - 타입 안정성
- **Vite 5** - 빌드 도구
- **Tailwind CSS 3** - 스타일링
- **Zustand** - 클라이언트 상태 관리 (persist middleware)
- **TanStack Query 5** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **React Router DOM 6** - 라우팅
- **Lucide React** - 아이콘

### Infrastructure
- **Docker & Docker Compose** - 컨테이너화
- **Nginx** - 리버스 프록시
- **Cloudflare Tunnel** - HTTPS 및 배포

---

## 환경별 실행 가이드

> 신입사원분들은 이 섹션을 순서대로 따라하시면 됩니다.

### 개발 환경 vs 프로덕션 환경 비교

| 구분 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| **용도** | 로컬에서 코드 작성/테스트 | 실제 서비스 배포 |
| **프로토콜** | HTTP (암호화 없음) | HTTPS (SSL/TLS 암호화) |
| **접속 URL** | localhost:5173, localhost:8000 | 실제 도메인 |
| **코드 변경 반영** | 즉시 반영 (Hot Reload) | 재빌드 필요 |
| **성능** | 느림 (개발 편의 우선) | 빠름 (최적화됨) |
| **보안** | 낮음 (로컬 전용) | 높음 (HTTPS + 방화벽) |
| **DB 포트 노출** | 외부 접근 가능 (5432) | 내부 전용 (5433) |
| **설정 파일** | `docker-compose.yml` | `docker-compose.prod.yml` |
| **환경변수 파일** | `.env` | `.env.production` |

#### Docker 리소스 분리 (동시 실행 가능)

개발/운영 환경이 서로 다른 리소스를 사용하므로 **동시에 실행할 수 있습니다.**

| 리소스 | 개발 환경 (dev) | 운영 환경 (prod) |
|--------|----------------|-----------------|
| 프로젝트 이름 | `dearme-dev` | `dearme-prod` |
| PostgreSQL 컨테이너 | `dearme-dev-postgres` | `dearme-prod-postgres` |
| Backend 컨테이너 | `dearme-dev-backend` | `dearme-prod-backend` |
| Frontend 컨테이너 | `dearme-dev-frontend` | `dearme-prod-frontend` |
| DB 포트 | 5432 | 5433 |
| API 포트 | 8000 | 8001 |
| 웹 포트 | 5173 | 8080 |
| DB 볼륨 | `postgres_data_dev` | `postgres_data_prod` |
| 네트워크 | `dearme-dev-network` | `dearme-prod-network` |

---

### 개발 환경 실행 (로컬 개발용)

#### 1단계: 저장소 클론
```bash
git clone <repository-url>
cd 01_dear_me
```

#### 2단계: 환경 변수 설정
```bash
# 샘플 파일 복사
cp .env.example .env

# .env 파일 열어서 수정
```

**필수 환경 변수:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DB_USER` | DB 사용자명 | `dearme` |
| `DB_PASSWORD` | DB 비밀번호 | `dearme123` |
| `SECRET_KEY` | JWT 서명 키 | 아무 문자열 (개발용) |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |

#### 3단계: Docker 실행
```bash
# 이미지 빌드 + 컨테이너 실행
docker-compose up --build

# 백그라운드 실행 (터미널 계속 사용하려면)
docker-compose up --build -d
```

#### 4단계: DB 마이그레이션 (최초 1회)
```bash
docker-compose exec backend alembic upgrade head
```

#### 5단계: 접속 확인
| 서비스 | URL | 설명 |
|--------|-----|------|
| **프론트엔드** | http://localhost:5173 | React 앱 |
| **백엔드 API** | http://localhost:8000 | FastAPI 서버 |
| **API 문서** | http://localhost:8000/docs | Swagger UI |
| **DB** | localhost:5432 | PostgreSQL (DBeaver 등으로 접속 가능) |

#### 개발 시 유용한 명령어
```bash
# 로그 실시간 확인
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f backend

# 컨테이너 중지
docker-compose down

# 컨테이너 + 볼륨(DB 데이터) 삭제 (주의: DB 초기화됨)
docker-compose down -v

# 백엔드 컨테이너 접속 (디버깅용)
docker-compose exec backend bash
```

#### 시드 데이터 생성 (테스트용 샘플 데이터)

개발 환경에서 테스트용 샘플 데이터를 쉽게 생성할 수 있습니다.

> **주의:** 시드 데이터를 생성하기 전에 반드시 DB 마이그레이션이 완료되어 있어야 합니다.
> 마이그레이션 없이 실행하면 `relation "users" does not exist` 에러가 발생합니다.
> ```bash
> # 마이그레이션 먼저 실행!
> docker-compose exec backend alembic upgrade head
> ```

```bash
# 샘플 데이터 생성
docker-compose exec backend python -m scripts.seed_data

# 기존 데이터 삭제 후 새로 생성
docker-compose exec backend python -m scripts.seed_data --clear
```

**생성되는 데이터:**
| 데이터 | 수량 | 설명 |
|--------|------|------|
| 유저 | 10명 | `user1@test.com` ~ `user10@test.com` (비밀번호: `test1234`) |
| 일기 | 80개 | 유저당 8개 (페르소나 생성 조건 7개 충족) |
| 페르소나 | 10개 | 유저당 1개 |
| 친구 관계 | ~25개 | 수락됨 22개, 대기중 3개 |
| 채팅 | ~15개 | 메시지 약 60개 |
| 알림 | ~12개 | 친구 요청 알림 등 |
| 구독 | 10개 | 프리미엄 2명, 무료 8명 |

---

### 프로덕션 환경 실행 (실제 배포용)

> ⚠️ **주의:** 프로덕션 배포는 팀 리드와 상의 후 진행하세요.

#### 1단계: 환경 변수 설정
```bash
# 프로덕션용 샘플 파일 복사
cp .env.production.example .env.production
```

#### 2단계: `.env.production` 수정

파일을 열어 실제 값을 입력합니다:

```bash
# 데이터베이스 (강력한 비밀번호 사용!)
DB_USER=dearme
DB_PASSWORD=Xk9$mP2@nQ5!wL8#   # 예시 - 실제로는 더 강력하게

# 보안 키 생성 (터미널에서 실행)
openssl rand -hex 32
# 출력된 값을 SECRET_KEY에 복사

# OpenAI
OPENAI_API_KEY=sk-실제키입력

# Cloudflare (아래 '터널 설정' 참고)
CLOUDFLARE_TUNNEL_TOKEN=터널토큰입력

# 도메인
API_DOMAIN=https://api.yourdomain.com
FRONTEND_DOMAIN=https://yourdomain.com

# 디버그 모드 끄기 (필수!)
DEBUG=false
```

#### 3단계: Cloudflare Tunnel 설정 (HTTPS용)

Cloudflare Tunnel은 별도 SSL 인증서 없이 HTTPS를 제공합니다.

1. https://one.dash.cloudflare.com 접속
2. **Zero Trust** > **Networks** > **Tunnels** 클릭
3. **Create a tunnel** 클릭
4. 터널 이름 입력 (예: `dearme-prod`)
5. **Docker** 선택
6. 표시되는 토큰을 `.env.production`의 `CLOUDFLARE_TUNNEL_TOKEN`에 복사
7. **Public hostname** 설정:
   - `api.yourdomain.com` → `http://backend:8000`
   - `yourdomain.com` → `http://frontend:80`

#### 4단계: 프로덕션 실행
```bash
# 프로덕션 빌드 + 실행
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# DB 마이그레이션
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

#### 5단계: 상태 확인
```bash
# 모든 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

---

### 개발 vs 프로덕션 기술 차이점

#### Frontend 차이점

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| **빌드 도구** | Vite Dev Server | Vite Build → Nginx |
| **실행 방식** | `npm run dev` | 정적 파일 서빙 |
| **코드 변경** | Hot Module Replacement (즉시 반영) | 재빌드 필요 |
| **소스맵** | 있음 (디버깅 가능) | 없음 (보안) |
| **번들 크기** | 최적화 안됨 | Tree-shaking, 압축 |
| **Dockerfile** | `Dockerfile` | `Dockerfile.prod` |

**왜 다른가?**
- 개발: 빠른 피드백이 중요 → HMR로 코드 수정 즉시 확인
- 프로덕션: 성능이 중요 → 빌드된 정적 파일을 Nginx가 서빙

#### Backend 차이점

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| **실행 명령** | `uvicorn --reload` | `uvicorn` (reload 없음) |
| **DEBUG 모드** | `true` | `false` |
| **에러 표시** | 상세 스택트레이스 | 간략한 메시지 |
| **포트 노출** | 8000 외부 접근 가능 | 내부만 (Cloudflare 경유) |

**왜 다른가?**
- `--reload`: 파일 변경 감지하여 서버 재시작 (개발 편의)
- `DEBUG=true`: 에러 발생 시 상세 정보 노출 (보안 위험이지만 디버깅 용이)

#### Database 차이점

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| **포트 노출** | `5432:5432` (외부 접근) | `5433:5432` (외부 접근) |
| **비밀번호** | 간단 (`dearme123`) | 복잡 (특수문자 포함) |
| **볼륨** | `postgres_data_dev` | `postgres_data_prod` |

**왜 다른가?**
- 개발: DBeaver 등으로 직접 DB 확인 필요 (포트 5432)
- 프로덕션: 개발과 다른 포트(5433) 사용으로 동시 실행 가능

#### 네트워크/보안 차이점

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| **프로토콜** | HTTP | HTTPS |
| **비밀번호 전송** | 평문 (로컬이라 OK) | 암호화됨 |
| **CORS** | localhost 허용 | 실제 도메인만 허용 |
| **SSL 인증서** | 없음 | Cloudflare 자동 관리 |

**왜 HTTPS가 중요한가?**
- HTTP: 네트워크에서 데이터가 그대로 노출 (카페 와이파이에서 비밀번호 탈취 가능)
- HTTPS: 모든 데이터 암호화 (중간에서 가로채도 해독 불가)

---

### 자주 발생하는 문제 & 해결법

#### 1. "relation does not exist" 에러
**원인:** DB 테이블이 생성되지 않음
```bash
# 해결: 마이그레이션 실행
docker-compose exec backend alembic upgrade head
```

#### 2. 컨테이너가 계속 재시작됨
**원인:** 환경변수 누락 또는 DB 연결 실패
```bash
# 해결: 로그 확인
docker-compose logs backend
```

#### 3. 프론트엔드에서 API 호출 실패 (CORS)
**원인:** 백엔드 CORS 설정에 프론트엔드 URL 누락
```python
# backend/app/core/config.py 확인
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",  # 이 줄이 있는지 확인
]
```

#### 4. OpenAI API 에러
**원인:** API 키 누락 또는 잔액 부족
```bash
# .env 파일에서 OPENAI_API_KEY 확인
# https://platform.openai.com 에서 잔액 확인
```

#### 5. 포트 이미 사용 중 에러
**원인:** 다른 프로세스가 포트 사용 중
```bash
# 해결: 해당 포트 사용 프로세스 확인
lsof -i :5173
lsof -i :8000

# 또는 기존 컨테이너 정리
docker-compose down
```

#### 6. 환경 전환 후 프론트엔드 "npm not found" 에러
**원인:** 개발/프로덕션 환경 전환 시 Docker 이미지가 캐시됨
- 개발환경: Node.js 이미지 (npm 포함)
- 프로덕션: Nginx 이미지 (npm 없음)

```bash
# 해결: 이미지 강제 재빌드
docker-compose build --no-cache frontend
docker-compose up -d frontend

# 또는 처음부터 --build 옵션 사용 (권장)
docker-compose up -d --build
```

#### 7. 새 환경에서 "relation does not exist" 에러
**원인:** 환경 분리로 새 DB 볼륨 사용 시 테이블이 없음
- 개발환경: `postgres_data_dev` 볼륨
- 프로덕션: `postgres_data_prod` 볼륨

```bash
# 해결: 해당 환경에서 마이그레이션 실행

# 개발 환경
docker-compose exec backend alembic upgrade head

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

> **팁:** 환경을 처음 실행하거나 전환할 때는 항상 `--build` 옵션과 마이그레이션을 함께 실행하세요:
> ```bash
> docker-compose up -d --build && docker-compose exec backend alembic upgrade head
> ```

---

## 주요 기능 상세

### 일기 시스템
- 날짜별 일기 작성 (제목, 내용, 기분, 날씨)
- 일기 통계 및 인사이트 대시보드
- AI 기반 일기 주제 제안

### 페르소나 시스템
- 일기 7개 이상 작성 시 AI 페르소나 자동 생성
- 페르소나 재생성 및 커스터마이징
  - 말투 스타일 (정중함/친근함/귀여움)
  - 이모지 사용 설정
  - 성격 특성 오버라이드
  - 커스텀 인사말
- 페르소나와 자기 성찰 대화

### 친구 시스템
- 사용자명으로 친구 검색
- 친구 요청/수락/거절
- 친구 페르소나와 대화 (일기 내용은 비공개)

### 알림 시스템
- 친구 요청 알림
- 읽음/안읽음 상태 관리
- 실시간 알림 뱃지

### 멀티모달 캐릭터 (Phase 4)
- DALL-E 3 기반 캐릭터 이미지 생성
- 6가지 스타일 지원:
  - 애니메이션 (무료)
  - 수채화, 픽셀 아트, 3D, 실사, 카툰 (프리미엄)
- 캐릭터 진화 시스템 (일기 30개마다 진화)
- 진화 히스토리 열람

### 프리미엄 구독 (Phase 4)
- 월간/연간 구독 플랜
- 프리미엄 혜택:
  - 캐릭터 스타일 무제한 변경
  - 친구 캐릭터 무제한 열람
  - 케미 분석 기능
  - 시즌 스킨 선행 접근
  - 광고 제거

---

## API 엔드포인트 요약

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| GET | `/api/v1/auth/me` | 현재 사용자 정보 |

### 일기
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/diaries` | 일기 목록 |
| POST | `/api/v1/diaries` | 일기 작성 |
| GET | `/api/v1/diaries/{id}` | 일기 상세 |
| PATCH | `/api/v1/diaries/{id}` | 일기 수정 |
| DELETE | `/api/v1/diaries/{id}` | 일기 삭제 |
| GET | `/api/v1/diaries/stats` | 일기 통계 |

### 페르소나
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/personas/me` | 내 페르소나 |
| POST | `/api/v1/personas/generate` | 페르소나 생성 |
| PUT | `/api/v1/personas/me/customize` | 커스터마이징 |
| GET | `/api/v1/personas/{user_id}` | 친구 페르소나 |

### 친구
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/friends` | 친구 목록 |
| POST | `/api/v1/friends/request` | 친구 요청 |
| PATCH | `/api/v1/friends/requests/{id}` | 요청 수락/거절 |

### 채팅
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/chats` | 채팅 목록 |
| POST | `/api/v1/chats` | 채팅 생성 |
| POST | `/api/v1/chats/{id}/messages` | 메시지 전송 |

### 캐릭터 (Phase 4)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/characters/me` | 내 캐릭터 |
| GET | `/api/v1/characters/status` | 생성 가능 상태 |
| GET | `/api/v1/characters/styles` | 스타일 목록 |
| POST | `/api/v1/characters/generate` | 캐릭터 생성 |
| PUT | `/api/v1/characters/me/style` | 스타일 변경 (프리미엄) |
| POST | `/api/v1/characters/me/evolve` | 캐릭터 진화 |

### 구독 (Phase 4)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/subscriptions/me` | 내 구독 정보 |
| GET | `/api/v1/subscriptions/status` | 구독 상태 |
| GET | `/api/v1/subscriptions/plans` | 플랜 목록 |
| POST | `/api/v1/subscriptions/upgrade` | 프리미엄 업그레이드 |
| POST | `/api/v1/subscriptions/cancel` | 구독 취소 |

---

## 프로젝트 구조

```
01_dear_me/
├── backend/
│   └── app/
│       ├── api/api_v1/endpoints/   # API 엔드포인트
│       ├── core/                    # 설정, DB, 보안
│       ├── models/                  # SQLAlchemy 모델
│       ├── schemas/                 # Pydantic 스키마
│       ├── services/                # 비즈니스 로직
│       └── constants/               # 상수
├── frontend/
│   └── src/
│       ├── components/              # UI 컴포넌트
│       ├── pages/                   # 페이지 컴포넌트
│       ├── services/                # API 서비스
│       ├── store/                   # Zustand 스토어
│       ├── types/                   # TypeScript 타입
│       ├── lib/                     # 유틸리티
│       └── hooks/                   # 커스텀 훅
├── nginx/                           # Nginx 설정
├── docs/                            # 프로젝트 문서
├── docker-compose.yml               # 개발 환경 (name: dearme-dev)
└── docker-compose.prod.yml          # 운영 환경 (name: dearme-prod)
```

---

## 문서 가이드

| 문서 | 설명 | AI 작업 시 참고 |
|------|------|-----------------|
| [RPD.md](docs/RPD.md) | 전체 요구사항 및 설계 | 프로젝트 전체 이해 |
| [TECH_STACK.md](docs/TECH_STACK.md) | 기술 스택 및 의존성 | 패키지 설치 시 |
| [DIRECTORY.md](docs/DIRECTORY.md) | 디렉토리 구조 | 파일 생성 시 |
| [INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Docker/배포 설정 | 인프라 구성 시 |
| [API_SPEC.md](docs/API_SPEC.md) | API 엔드포인트 명세 | API 구현 시 |
| [AI_PROMPTS.md](docs/AI_PROMPTS.md) | LLM 프롬프트 설계 | AI 서비스 구현 시 |

---

## 개발 마일스톤

### Phase 1: MVP (완료)
- [x] 프로젝트 초기 세팅 (Docker, DB)
- [x] 사용자 인증 (회원가입/로그인)
- [x] 일기 CRUD
- [x] 페르소나 생성 (LLM)
- [x] 페르소나 대화

### Phase 2: 소셜 기능 (완료)
- [x] 친구 요청/수락/거절
- [x] 친구 목록 관리
- [x] 친구 페르소나 대화
- [x] 사용자 검색

### Phase 3: 고도화 (완료)
- [x] 일기 통계/인사이트
- [x] 알림 기능
- [x] 페르소나 커스터마이징
- [x] 일기 수정 기능
- [x] AI 일기 프롬프트 제안

### Phase 4: 수익화 (완료)
- [x] 프리미엄 구독 시스템
- [x] 멀티모달 캐릭터 생성 (DALL-E 3)
- [x] 캐릭터 스타일 변경 (프리미엄)
- [x] 캐릭터 진화 시스템
- [x] 진화 히스토리

### 향후 계획
- [ ] 결제 시스템 연동 (실제 결제)
- [ ] 굿즈 제작 연동
- [ ] 시즌 스킨 시스템
- [ ] 케미 분석 기능

---

## 개발 명령어

### DB 마이그레이션
```bash
# 마이그레이션 생성
docker-compose exec backend alembic revision --autogenerate -m "description"

# 마이그레이션 적용
docker-compose exec backend alembic upgrade head

# 마이그레이션 롤백
docker-compose exec backend alembic downgrade -1
```

### 테스트
```bash
# Backend 테스트
docker-compose exec backend pytest

# Frontend 타입 체크
cd frontend && npx tsc --noEmit
```

---

## 라이선스

Private Project
