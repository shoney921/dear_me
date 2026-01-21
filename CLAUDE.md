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
- **Zustand** - 클라이언트 상태 관리 (persist middleware 사용)
- **TanStack Query 5** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **React Router DOM 6** - 라우팅
- **Lucide React** - 아이콘

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
│       ├── api/api_v1/endpoints/   # API 엔드포인트 (auth, diary, persona, friend, chat, user)
│       ├── core/                    # 설정, DB, 보안, 의존성
│       ├── models/                  # SQLAlchemy 모델
│       ├── schemas/                 # Pydantic 스키마
│       ├── services/                # 비즈니스 로직 (persona_service, chat_service)
│       └── constants/               # 상수 (moods, weather, prompts)
├── frontend/
│   └── src/
│       ├── components/              # UI 컴포넌트 (common, diary, persona, chat, friend, ui)
│       ├── pages/                   # 페이지 컴포넌트
│       ├── services/                # API 서비스
│       ├── store/                   # Zustand 스토어
│       ├── types/                   # TypeScript 타입
│       ├── lib/                     # 유틸리티 (api.ts, utils.ts, error.ts, constants.ts)
│       └── hooks/                   # 커스텀 훅
├── nginx/                           # Nginx 설정
├── docs/                            # 프로젝트 문서
└── docker-compose.yml
```

---

## API 엔드포인트

### 인증 (Auth)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 (JWT 토큰 발급) |
| GET | `/api/v1/auth/me` | 현재 사용자 정보 |

### 사용자 (User)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/users/me` | 내 정보 조회 |
| PATCH | `/api/v1/users/me` | 내 정보 수정 |
| GET | `/api/v1/users/{user_id}` | 사용자 정보 조회 |
| GET | `/api/v1/users/search/{username}` | 사용자 검색 |

### 일기 (Diary)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/diaries` | 일기 목록 조회 |
| POST | `/api/v1/diaries` | 일기 작성 |
| GET | `/api/v1/diaries/{id}` | 일기 상세 조회 |
| PATCH | `/api/v1/diaries/{id}` | 일기 수정 |
| DELETE | `/api/v1/diaries/{id}` | 일기 삭제 |
| GET | `/api/v1/diaries/count` | 일기 개수 조회 |
| GET | `/api/v1/diaries/stats` | 일기 통계 조회 |
| GET | `/api/v1/diaries/prompt-suggestions` | AI 일기 주제 제안 |

### 페르소나 (Persona)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/personas/me` | 내 페르소나 조회 |
| PUT | `/api/v1/personas/me` | 내 페르소나 설정 수정 |
| PUT | `/api/v1/personas/me/customize` | 페르소나 커스터마이징 |
| GET | `/api/v1/personas/status` | 페르소나 생성 가능 상태 |
| POST | `/api/v1/personas/generate` | 페르소나 생성 |
| POST | `/api/v1/personas/regenerate` | 페르소나 재생성 |
| GET | `/api/v1/personas/{user_id}` | 친구 페르소나 조회 (친구만) |

### 친구 (Friend)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/friends` | 친구 목록 조회 |
| POST | `/api/v1/friends/request` | 친구 요청 보내기 |
| GET | `/api/v1/friends/requests/received` | 받은 친구 요청 |
| GET | `/api/v1/friends/requests/sent` | 보낸 친구 요청 |
| PATCH | `/api/v1/friends/requests/{id}` | 친구 요청 수락/거절 |
| DELETE | `/api/v1/friends/{friend_id}` | 친구 삭제 |

### 채팅 (Chat)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/chats` | 채팅 목록 |
| POST | `/api/v1/chats` | 채팅 생성 |
| GET | `/api/v1/chats/{id}` | 채팅 상세 (메시지 포함) |
| GET | `/api/v1/chats/{id}/messages` | 채팅 메시지 조회 |
| POST | `/api/v1/chats/{id}/messages` | 메시지 전송 |
| DELETE | `/api/v1/chats/{id}` | 채팅 삭제 |

### 알림 (Notification)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/notifications` | 알림 목록 조회 |
| GET | `/api/v1/notifications/unread-count` | 읽지 않은 알림 개수 |
| GET | `/api/v1/notifications/{id}` | 알림 상세 조회 |
| PATCH | `/api/v1/notifications/{id}/read` | 알림 읽음 처리 |
| POST | `/api/v1/notifications/mark-read` | 여러 알림 읽음 처리 |
| POST | `/api/v1/notifications/mark-all-read` | 모든 알림 읽음 처리 |
| DELETE | `/api/v1/notifications/{id}` | 알림 삭제 |

---

## 사용자 시나리오

### 1. 회원가입 및 로그인
```
1. 사용자가 회원가입 페이지에서 이메일, 사용자명, 비밀번호 입력
2. 회원가입 성공 시 로그인 페이지로 이동 (성공 메시지 표시)
3. 로그인 성공 시 메인 페이지로 이동
4. JWT 토큰이 localStorage에 저장되어 인증 상태 유지
```

### 2. 일기 작성 및 페르소나 생성
```
1. 사용자가 일기 작성 페이지에서 날짜, 제목, 내용, 기분, 날씨 입력
2. 일기가 7개 이상 쌓이면 페르소나 생성 가능
3. 페르소나 페이지에서 "페르소나 생성하기" 버튼 클릭
4. AI가 일기를 분석하여 성격, 특성, 말투 등 페르소나 생성
5. 생성된 페르소나와 대화 시작 가능
```

### 3. 친구 기능
```
1. 친구 페이지에서 사용자명으로 검색
2. "친구 요청" 버튼 클릭하여 요청 전송
3. 상대방이 "받은 친구 요청"에서 수락(✓) 또는 거절(✗)
4. 수락 시 친구 목록에 추가
5. 친구 목록에서 "대화" 버튼으로 친구 페르소나와 대화 가능
6. 친구 삭제도 가능 (확인 팝업 후)
```

### 4. 페르소나 대화
```
1. 내 페르소나: 페르소나 페이지에서 "대화 시작하기"
2. 친구 페르소나: 친구 목록에서 "대화" 버튼 클릭
3. 채팅 화면에서 메시지 입력
4. AI가 해당 페르소나의 성격/말투로 응답
5. 대화 내역은 저장되어 나중에 다시 볼 수 있음
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
cd frontend && npx tsc --noEmit
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
// 4. 유틸리티/타입 (@/services, @/types, @/lib)
```

---

## 에러 처리

### Frontend 에러 처리 가이드
- `src/lib/error.ts`의 `getApiErrorMessage()` 함수 사용
- 모든 mutation에 `onError` 핸들러 추가
- 에러 메시지는 한국어로 사용자에게 표시

```typescript
import { getApiErrorMessage } from '@/lib/error'

const mutation = useMutation({
  mutationFn: someService.action,
  onError: (err) => {
    setError(getApiErrorMessage(err))
  },
})
```

### Backend 에러 처리 가이드
- HTTPException 사용
- 영문 에러 메시지는 프론트엔드에서 한국어로 번역
- logging 모듈 사용 (print 금지)

```python
import logging
logger = logging.getLogger(__name__)

# 에러 발생 시
logger.error(f"Error description: {e}")
raise HTTPException(status_code=400, detail="Error message")
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

### Phase 4: 수익화 (예정)
- [ ] 멀티모달 캐릭터 생성
- [ ] 캐릭터 스타일 변경
- [ ] 프리미엄 구독 시스템
- [ ] 굿즈 제작 연동

---

## 주의사항

1. **일기 프라이버시**: 친구의 일기 내용은 절대 직접 노출하지 않음. 페르소나를 통해서만 간접 소통
2. **페르소나 생성 조건**: 최소 7개 이상의 일기 필요
3. **친구 관계 확인**: 친구 페르소나 조회/대화 시 반드시 친구 관계 확인
4. **LLM 프롬프트**: `docs/AI_PROMPTS.md` 참조하여 일관된 페르소나 성격 유지
5. **타입 안정성**: TypeScript strict 모드 사용, any 타입 지양
6. **에러 처리**: 모든 API 호출에 에러 처리 필수, 사용자에게 한국어로 메시지 표시
7. **Zustand Hydration**: persist 미들웨어 사용 시 `isHydrated` 상태 확인 후 라우팅
