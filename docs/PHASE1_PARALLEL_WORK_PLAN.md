# DearMe Phase 1 - Git Worktree 병렬 작업 계획서

## 개요

Phase 1 MVP를 3개의 독립적인 브랜치로 나누어 git worktree로 병렬 작업합니다.
각 작업은 서로 의존성이 최소화되어 있어 동시 진행이 가능합니다.

---

## 작업 분할 전략

```
                    master
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   feature/db    feature/diary   feature/persona
   -and-auth      -api-ui        -service
        │             │             │
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
                   master
                  (병합)
```

---

## 브랜치 1: `feature/db-and-auth`

### 담당 영역
- 프로젝트 초기 구조 설정
- 데이터베이스 모델 및 마이그레이션
- 인증 시스템 (JWT)
- 공통 유틸리티

### 상세 작업 목록

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1 | Backend 폴더 구조 생성 | `backend/app/` 전체 디렉토리 |
| 2 | `requirements.txt` 작성 | 의존성 파일 |
| 3 | 설정 파일 (config.py) | 환경 변수 로드 |
| 4 | SQLAlchemy Base 설정 | `backend/app/db/base.py` |
| 5 | Users 모델 | `backend/app/models/user.py` |
| 6 | Diaries 모델 | `backend/app/models/diary.py` |
| 7 | Personas 모델 | `backend/app/models/persona.py` |
| 8 | PersonaChats, ChatMessages 모델 | `backend/app/models/chat.py` |
| 9 | Alembic 설정 및 마이그레이션 | `backend/alembic/` |
| 10 | 인증 유틸 (JWT, 해싱) | `backend/app/core/security.py` |
| 11 | Auth API (register, login) | `backend/app/api/v1/endpoints/auth.py` |
| 12 | Auth Schemas | `backend/app/schemas/auth.py` |
| 13 | get_current_user 의존성 | `backend/app/api/deps.py` |
| 14 | FastAPI 앱 엔트리포인트 | `backend/app/main.py` |
| 15 | Docker 설정 (backend) | `Dockerfile`, `docker-compose.yml` |

### 핵심 파일
```
backend/
├── requirements.txt
├── Dockerfile
├── alembic.ini
├── alembic/
│   └── versions/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── diary.py
│   │   ├── persona.py
│   │   └── chat.py
│   ├── schemas/
│   │   ├── auth.py
│   │   └── user.py
│   └── api/
│       ├── deps.py
│       └── v1/
│           └── endpoints/
│               └── auth.py
docker-compose.yml
```

### 완료 조건
- [ ] `docker-compose up`으로 PostgreSQL + Backend 실행
- [ ] `/api/v1/auth/register` 회원가입 성공
- [ ] `/api/v1/auth/login` 로그인 및 JWT 토큰 발급
- [ ] 보호된 엔드포인트에서 토큰 검증 동작

---

## 브랜치 2: `feature/diary-api-ui`

### 담당 영역
- 일기 CRUD API
- 프론트엔드 초기 구조
- 일기 관련 UI 전체

### 상세 작업 목록

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1 | Diary Schemas | `backend/app/schemas/diary.py` |
| 2 | Diary CRUD 서비스 | `backend/app/services/diary_service.py` |
| 3 | Diary API 엔드포인트 | `backend/app/api/v1/endpoints/diaries.py` |
| 4 | Frontend 폴더 구조 생성 | `frontend/src/` 전체 |
| 5 | `package.json` 및 Vite 설정 | 프론트엔드 설정 |
| 6 | Tailwind CSS 설정 | `tailwind.config.js` |
| 7 | API 클라이언트 설정 (Axios) | `frontend/src/lib/api.ts` |
| 8 | Auth Store (Zustand) | `frontend/src/stores/authStore.ts` |
| 9 | React Query 설정 | `frontend/src/lib/queryClient.ts` |
| 10 | 레이아웃 컴포넌트 | `frontend/src/components/Layout.tsx` |
| 11 | 로그인/회원가입 페이지 | `frontend/src/pages/Login.tsx`, `Register.tsx` |
| 12 | ProtectedRoute 컴포넌트 | `frontend/src/components/ProtectedRoute.tsx` |
| 13 | 대시보드 페이지 | `frontend/src/pages/Dashboard.tsx` |
| 14 | 일기 작성 페이지 | `frontend/src/pages/diaries/DiaryNew.tsx` |
| 15 | 일기 목록 페이지 (캘린더 뷰) | `frontend/src/pages/diaries/DiaryList.tsx` |
| 16 | 일기 상세/수정 페이지 | `frontend/src/pages/diaries/DiaryDetail.tsx` |
| 17 | 기분/날씨 선택 컴포넌트 | `frontend/src/components/diary/MoodPicker.tsx` |
| 18 | Frontend Dockerfile | `frontend/Dockerfile` |

### 핵심 파일
```
backend/app/
├── schemas/
│   └── diary.py
├── services/
│   └── diary_service.py
└── api/v1/endpoints/
    └── diaries.py

frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── Dockerfile
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── lib/
    │   ├── api.ts
    │   └── queryClient.ts
    ├── stores/
    │   └── authStore.ts
    ├── components/
    │   ├── Layout.tsx
    │   ├── ProtectedRoute.tsx
    │   └── diary/
    │       ├── MoodPicker.tsx
    │       ├── WeatherPicker.tsx
    │       └── DiaryCard.tsx
    └── pages/
        ├── Dashboard.tsx
        ├── Login.tsx
        ├── Register.tsx
        └── diaries/
            ├── DiaryList.tsx
            ├── DiaryNew.tsx
            └── DiaryDetail.tsx
```

### 완료 조건
- [ ] 일기 CRUD API 동작 (`POST`, `GET`, `PUT`, `DELETE`)
- [ ] 캘린더 뷰에서 일기 목록 표시
- [ ] 일기 작성 (기분/날씨 태그 포함)
- [ ] 일기 수정/삭제
- [ ] 반응형 UI

---

## 브랜치 3: `feature/persona-service`

### 담당 영역
- LLM 기반 페르소나 생성 서비스
- 페르소나 대화 API (스트리밍)
- 페르소나 UI

### 상세 작업 목록

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1 | Persona Schemas | `backend/app/schemas/persona.py` |
| 2 | Chat Schemas | `backend/app/schemas/chat.py` |
| 3 | LLM 클라이언트 설정 | `backend/app/services/llm/client.py` |
| 4 | 페르소나 생성 프롬프트 | `backend/app/services/llm/prompts.py` |
| 5 | 페르소나 생성 서비스 | `backend/app/services/persona_service.py` |
| 6 | 페르소나 API 엔드포인트 | `backend/app/api/v1/endpoints/personas.py` |
| 7 | 대화 서비스 (스트리밍) | `backend/app/services/chat_service.py` |
| 8 | 대화 API 엔드포인트 | `backend/app/api/v1/endpoints/chats.py` |
| 9 | 페르소나 프로필 페이지 | `frontend/src/pages/persona/PersonaProfile.tsx` |
| 10 | 페르소나 생성 진행 UI | `frontend/src/components/persona/GenerateProgress.tsx` |
| 11 | 대화 목록 페이지 | `frontend/src/pages/persona/ChatList.tsx` |
| 12 | 대화 페이지 (스트리밍) | `frontend/src/pages/persona/ChatRoom.tsx` |
| 13 | 채팅 메시지 컴포넌트 | `frontend/src/components/chat/ChatMessage.tsx` |
| 14 | 채팅 입력 컴포넌트 | `frontend/src/components/chat/ChatInput.tsx` |
| 15 | AI 프롬프트 테스트 | 프롬프트 품질 검증 |

### 핵심 파일
```
backend/app/
├── schemas/
│   ├── persona.py
│   └── chat.py
├── services/
│   ├── persona_service.py
│   ├── chat_service.py
│   └── llm/
│       ├── client.py
│       └── prompts.py
└── api/v1/endpoints/
    ├── personas.py
    └── chats.py

frontend/src/
├── components/
│   ├── persona/
│   │   ├── PersonaCard.tsx
│   │   └── GenerateProgress.tsx
│   └── chat/
│       ├── ChatMessage.tsx
│       └── ChatInput.tsx
└── pages/
    └── persona/
        ├── PersonaProfile.tsx
        ├── ChatList.tsx
        └── ChatRoom.tsx
```

### 완료 조건
- [ ] 일기 7개 이상 시 페르소나 생성 가능
- [ ] LLM이 일기 분석하여 페르소나 생성
- [ ] 페르소나 프로필 카드 표시
- [ ] 페르소나와 대화 (스트리밍 응답)
- [ ] 대화 기록 저장 및 조회

---

## Git Worktree 설정 명령어

```bash
# 메인 프로젝트 디렉토리에서 실행

# 1. 브랜치 생성
git branch feature/db-and-auth
git branch feature/diary-api-ui
git branch feature/persona-service

# 2. Worktree 생성 (각각 다른 폴더에)
git worktree add ../dear_me_worker1 feature/db-and-auth
git worktree add ../dear_me_worker2 feature/diary-api-ui
git worktree add ../dear_me_worker3 feature/persona-service

# 3. 각 워커 폴더에서 Claude Code 실행
# 터미널 1: cd ../dear_me_worker1 && claude
# 터미널 2: cd ../dear_me_worker2 && claude
# 터미널 3: cd ../dear_me_worker3 && claude
```

---

## 병합 전략

### 병합 순서
1. **feature/db-and-auth** → master (먼저 병합)
   - 기초 구조와 DB 모델이 있어야 다른 브랜치 작업 가능

2. **feature/diary-api-ui** → master
   - 일기 API와 프론트엔드 기초

3. **feature/persona-service** → master
   - 페르소나 기능 추가

### 충돌 예상 지점
- `backend/app/main.py` - 라우터 등록 부분
- `backend/app/models/__init__.py` - 모델 export
- `frontend/src/App.tsx` - 라우트 정의
- `docker-compose.yml` - 서비스 정의

### 충돌 해결 가이드
```bash
# 병합 시 충돌이 발생하면
git checkout master
git merge feature/db-and-auth  # 첫 번째는 충돌 없음

git merge feature/diary-api-ui
# 충돌 시: main.py, App.tsx 등에서 라우터/라우트 추가
# 해결 방법: 두 브랜치의 코드를 모두 포함하도록 수정

git merge feature/persona-service
# 위와 동일하게 처리
```

---

## 의존성 관계

```
┌─────────────────────────────────────────────────────────────┐
│                    feature/db-and-auth                       │
│  (독립적으로 먼저 작업 가능)                                  │
│                                                              │
│  • DB 모델, 마이그레이션                                     │
│  • 인증 API                                                  │
│  • Docker 설정                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ 참조 (모델, 인증)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   feature/diary-api-ui                       │
│  (DB 모델 스키마를 알면 독립 작업 가능)                       │
│                                                              │
│  • Diary 모델은 브랜치1에서 정의됨                           │
│  • 이 브랜치에서는 Diary 모델이 있다고 가정하고 개발          │
│  • 인증은 get_current_user 의존성 사용                       │
└─────────────────────────────────────────────────────────────┘
         │
         │ 참조 (모델, Diary 데이터)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  feature/persona-service                     │
│  (DB 모델 스키마를 알면 독립 작업 가능)                       │
│                                                              │
│  • Persona, Chat 모델은 브랜치1에서 정의됨                   │
│  • Diary 데이터를 읽어서 페르소나 생성                        │
│  • LLM 통합은 이 브랜치에서 전담                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 각 브랜치별 Claude Code 프롬프트

### Worker 1 (feature/db-and-auth)
```
DearMe 프로젝트의 Phase 1 중 DB 및 인증 부분을 구현해줘.

docs/RPD.md와 docs/TECH_STACK.md, docs/DIRECTORY.md를 참고해서:
1. Backend 폴더 구조 생성
2. requirements.txt 작성
3. SQLAlchemy 모델 (users, diaries, personas, persona_chats, chat_messages)
4. Alembic 마이그레이션
5. JWT 인증 API (register, login)
6. Docker 설정 (PostgreSQL + Backend)

완료 후 docker-compose up으로 테스트 가능해야 함
```

### Worker 2 (feature/diary-api-ui)
```
DearMe 프로젝트의 Phase 1 중 일기 API와 UI를 구현해줘.

docs/RPD.md와 docs/TECH_STACK.md, docs/DIRECTORY.md를 참고해서:
1. Diary CRUD API (backend/app/api/v1/endpoints/diaries.py)
2. Frontend 초기 구조 (Vite + React + TypeScript + Tailwind)
3. 로그인/회원가입 페이지
4. 대시보드 페이지
5. 일기 작성/목록/상세 페이지
6. 캘린더 뷰 (react-calendar)

DB 모델은 다른 브랜치에서 작업 중이니, 모델이 있다고 가정하고 개발해줘.
모델 스키마: docs/RPD.md의 "6. 데이터 모델" 참고
```

### Worker 3 (feature/persona-service)
```
DearMe 프로젝트의 Phase 1 중 페르소나 생성 및 대화 기능을 구현해줘.

docs/RPD.md와 docs/AI_PROMPTS.md를 참고해서:
1. LangChain/OpenAI 클라이언트 설정
2. 페르소나 생성 서비스 (일기 분석 → JSON 추출)
3. 페르소나 API (generate, me)
4. 대화 서비스 (스트리밍 응답)
5. 대화 API (chats)
6. 페르소나 프로필 UI
7. 대화 페이지 UI (스트리밍)

DB 모델은 다른 브랜치에서 작업 중이니, 모델이 있다고 가정하고 개발해줘.
모델 스키마: docs/RPD.md의 "6. 데이터 모델" 참고
```

---

## 검증 체크리스트

### 병합 후 통합 테스트
- [ ] `docker-compose up`으로 전체 서비스 실행
- [ ] 회원가입 → 로그인 플로우
- [ ] 일기 7개 작성
- [ ] 페르소나 생성
- [ ] 페르소나와 대화
- [ ] 전체 시나리오 (docs/RPD.md 시나리오 1~3)

---

## 예상 작업량

| 브랜치 | 예상 작업량 | 비고 |
|--------|------------|------|
| feature/db-and-auth | 중간 | 기초 구조 설정이 많음 |
| feature/diary-api-ui | 큼 | UI 작업이 많음 |
| feature/persona-service | 중간 | LLM 프롬프트 튜닝 필요 |

세 작업을 병렬로 진행하면 전체 작업 시간을 약 1/2~1/3로 단축할 수 있습니다.
