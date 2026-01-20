# CLAUDE.md - Claude Code 프로젝트 컨텍스트

이 파일은 Claude Code가 DearMe 프로젝트를 이해하고 효과적으로 작업할 수 있도록 돕는 컨텍스트 파일입니다.

## 프로젝트 개요

**DearMe (디어미)** - 일기 기반 AI 페르소나 서비스

사용자가 일기를 작성하면 LLM이 분석하여 "나만의 AI 캐릭터(페르소나)"를 생성하고, 친구의 페르소나와 대화할 수 있는 소셜 일기 플랫폼입니다.

### 핵심 기능
1. **일기 작성** - 매일 일기 작성 + 기분/날씨 태그
2. **페르소나 생성** - 일기 7개 이상 작성 시 AI가 페르소나 생성
3. **자기 성찰 대화** - 내 페르소나와 대화
4. **친구 페르소나 대화** - 친구의 페르소나와 대화 (일기는 비공개)

---

## 기술 스택

### Backend
- **FastAPI** (0.104.1) - Python 비동기 웹 프레임워크
- **PostgreSQL 15** - 관계형 데이터베이스
- **SQLAlchemy 2.0** - ORM
- **Alembic** - DB 마이그레이션
- **LangChain 0.3 + OpenAI** - AI/LLM 통합
- **Pydantic 2.x** - 데이터 검증
- **python-jose + bcrypt** - JWT 인증

### Frontend
- **React 18** + **TypeScript 5**
- **Vite 5** - 빌드 도구
- **Tailwind CSS 3** - 스타일링
- **Zustand** - 클라이언트 상태 관리
- **TanStack Query 5** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **React Router DOM 6** - 라우팅

### Infrastructure
- **Docker & Docker Compose**
- **Nginx** - 리버스 프록시
- **Cloudflare Tunnel** - HTTPS

---

## 디렉토리 구조

```
02.DEAR_ME/
├── backend/
│   └── app/
│       ├── api/api_v1/endpoints/   # API 엔드포인트 (auth, diary, persona, friend, chat)
│       ├── core/                    # 설정, DB, 보안, 의존성
│       ├── models/                  # SQLAlchemy 모델
│       ├── schemas/                 # Pydantic 스키마
│       ├── services/                # 비즈니스 로직
│       └── constants/               # 상수 (moods, weather, prompts)
├── frontend/
│   └── src/
│       ├── components/              # UI 컴포넌트 (common, diary, persona, chat, friend, ui)
│       ├── pages/                   # 페이지 컴포넌트
│       ├── services/                # API 서비스
│       ├── store/                   # Zustand 스토어
│       ├── types/                   # TypeScript 타입
│       ├── lib/                     # 유틸리티 (api.ts, utils.ts)
│       └── hooks/                   # 커스텀 훅
├── nginx/                           # Nginx 설정
├── docs/                            # 프로젝트 문서
└── docker-compose.yml
```

---

## 개발 명령어

### 개발 환경 실행
```bash
docker-compose up --build
```

### 접속 URL
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### DB 마이그레이션
```bash
# 마이그레이션 생성
docker-compose exec backend alembic revision --autogenerate -m "description"

# 마이그레이션 적용
docker-compose exec backend alembic upgrade head

# 마이그레이션 롤백
docker-compose exec backend alembic downgrade -1
```

### 테스트 실행
```bash
# Backend 테스트
docker-compose exec backend pytest

# Frontend 타입 체크
docker-compose exec frontend npm run typecheck
```

---

## 코딩 컨벤션

### Backend (Python)
| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 | snake_case | `diary_service.py` |
| 클래스 | PascalCase | `DiaryService` |
| 함수/변수 | snake_case | `get_diary_by_id` |
| 상수 | UPPER_SNAKE_CASE | `MAX_DIARY_LENGTH` |

### Frontend (TypeScript)
| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 컴포넌트 파일 | PascalCase | `DiaryCard.tsx` |
| 유틸리티 파일 | camelCase | `authService.ts` |
| 컴포넌트 | PascalCase | `DiaryCard` |
| 함수/변수 | camelCase | `getDiaryById` |
| 타입/인터페이스 | PascalCase | `DiaryResponse` |

### Import 순서

**Backend:**
```python
# 1. 표준 라이브러리
# 2. 서드파티 라이브러리
# 3. 로컬 모듈
```

**Frontend:**
```typescript
// 1. React 관련
// 2. 서드파티 라이브러리
// 3. 로컬 컴포넌트 (@/components)
// 4. 유틸리티/타입 (@/services, @/types)
```

---

## 작업 가이드

### 새 API 엔드포인트 추가 시
1. `backend/app/models/` - SQLAlchemy 모델 생성
2. `backend/app/schemas/` - Pydantic 스키마 생성
3. `backend/app/services/` - 비즈니스 로직 구현
4. `backend/app/api/api_v1/endpoints/` - 엔드포인트 구현
5. `backend/app/api/api_v1/api.py` - 라우터 등록

### 새 페이지 추가 시
1. `frontend/src/types/` - TypeScript 타입 정의
2. `frontend/src/services/` - API 서비스 함수 작성
3. `frontend/src/components/` - 필요한 컴포넌트 생성
4. `frontend/src/pages/` - 페이지 컴포넌트 생성
5. `frontend/src/App.tsx` - 라우트 추가

---

## 문서 참조

| 문서 | 설명 | 참고 시점 |
|------|------|----------|
| [docs/RPD.md](docs/RPD.md) | 전체 요구사항 및 설계 | 프로젝트 전체 이해 |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | 기술 스택 상세 | 패키지 설치 시 |
| [docs/DIRECTORY.md](docs/DIRECTORY.md) | 디렉토리 구조 | 파일 생성 시 |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Docker/배포 설정 | 인프라 구성 시 |
| [docs/API_SPEC.md](docs/API_SPEC.md) | API 엔드포인트 명세 | API 구현 시 |
| [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md) | LLM 프롬프트 설계 | AI 서비스 구현 시 |

---

## 환경 변수

필요한 환경 변수 (`.env` 파일):
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `SECRET_KEY` - JWT 시크릿 키
- `OPENAI_API_KEY` - OpenAI API 키
- `CLOUDFLARE_TUNNEL_TOKEN` - Cloudflare 터널 토큰 (배포 시)

---

## 현재 개발 상태

### Phase 1: MVP (진행 중)
- [ ] 프로젝트 초기 세팅 (Docker, DB)
- [ ] 사용자 인증 (회원가입/로그인)
- [ ] 일기 CRUD
- [ ] 페르소나 생성 (LLM)
- [ ] 페르소나 대화

### Phase 2: 소셜 기능
- [ ] 친구 요청/수락
- [ ] 친구 페르소나 대화

### Phase 3: 고도화
- [ ] 일기 통계/인사이트
- [ ] 알림 기능

---

## 주의사항

1. **일기 프라이버시**: 친구의 일기 내용은 절대 직접 노출하지 않음. 페르소나를 통해서만 간접 소통
2. **페르소나 생성 조건**: 최소 7개 이상의 일기 필요
3. **LLM 프롬프트**: `docs/AI_PROMPTS.md` 참조하여 일관된 페르소나 성격 유지
4. **타입 안정성**: TypeScript strict 모드 사용, any 타입 지양
