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

## 빠른 시작

### 1. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에서 필요한 값 설정
```

필요한 환경 변수:
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `SECRET_KEY` - JWT 시크릿 키
- `OPENAI_API_KEY` - OpenAI API 키 (페르소나 생성, 캐릭터 이미지)
- `CLOUDFLARE_TUNNEL_TOKEN` - Cloudflare 터널 토큰 (배포 시)

### 2. 개발 환경 실행
```bash
docker-compose up --build
```

### 3. 접속
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

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
02.DEAR_ME/
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
└── docker-compose.yml
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
