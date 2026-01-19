# 디렉토리 구조 가이드

## 전체 프로젝트 구조

```
dear-me/
├── backend/                          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── api_v1/
│   │   │       ├── endpoints/        # API 엔드포인트
│   │   │       │   ├── auth.py       # 인증 (로그인/회원가입)
│   │   │       │   ├── diary.py      # 일기 CRUD
│   │   │       │   ├── persona.py    # 페르소나 관리
│   │   │       │   ├── friend.py     # 친구 관리
│   │   │       │   ├── chat.py       # 페르소나 대화
│   │   │       │   └── user.py       # 사용자 정보
│   │   │       └── api.py            # API 라우터 통합
│   │   ├── core/
│   │   │   ├── config.py             # 환경 설정 (Settings)
│   │   │   ├── database.py           # DB 연결 설정
│   │   │   ├── security.py           # JWT 토큰 처리
│   │   │   └── deps.py               # 의존성 주입 (get_db, get_current_user)
│   │   ├── models/
│   │   │   ├── user.py               # User 모델
│   │   │   ├── diary.py              # Diary 모델
│   │   │   ├── persona.py            # Persona 모델
│   │   │   ├── friendship.py         # Friendship 모델
│   │   │   └── chat.py               # PersonaChat, ChatMessage 모델
│   │   ├── schemas/
│   │   │   ├── user.py               # User 스키마 (요청/응답)
│   │   │   ├── diary.py              # Diary 스키마
│   │   │   ├── persona.py            # Persona 스키마
│   │   │   ├── friendship.py         # Friendship 스키마
│   │   │   └── chat.py               # Chat 스키마
│   │   ├── services/
│   │   │   ├── auth_service.py       # 인증 로직
│   │   │   ├── diary_service.py      # 일기 비즈니스 로직
│   │   │   ├── persona_service.py    # 페르소나 생성/대화 (LLM)
│   │   │   ├── friend_service.py     # 친구 관리 로직
│   │   │   └── chat_service.py       # 채팅 로직
│   │   ├── constants/
│   │   │   ├── moods.py              # 기분 상수 (happy, sad, ...)
│   │   │   ├── weather.py            # 날씨 상수 (sunny, rainy, ...)
│   │   │   └── prompts.py            # LLM 프롬프트 상수
│   │   └── main.py                   # FastAPI 앱 진입점
│   ├── alembic/
│   │   ├── versions/                 # 마이그레이션 파일들
│   │   │   ├── 001_create_users.py
│   │   │   ├── 002_create_diaries.py
│   │   │   ├── 003_create_personas.py
│   │   │   ├── 004_create_friendships.py
│   │   │   └── 005_create_chats.py
│   │   └── env.py                    # Alembic 환경 설정
│   ├── tests/
│   │   ├── conftest.py               # pytest 설정
│   │   ├── test_auth.py
│   │   ├── test_diary.py
│   │   ├── test_persona.py
│   │   └── test_friend.py
│   ├── Dockerfile                    # DEV용
│   ├── Dockerfile.prod               # PROD용
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # 공통 컴포넌트
│   │   │   │   ├── Layout.tsx        # 레이아웃 (Header, Footer)
│   │   │   │   ├── Header.tsx        # 헤더 네비게이션
│   │   │   │   ├── ProtectedRoute.tsx # 인증 라우트 가드
│   │   │   │   ├── Loading.tsx       # 로딩 스피너
│   │   │   │   └── Avatar.tsx        # 아바타 컴포넌트
│   │   │   ├── diary/                # 일기 관련 컴포넌트
│   │   │   │   ├── DiaryForm.tsx     # 일기 작성/수정 폼
│   │   │   │   ├── DiaryCard.tsx     # 일기 카드
│   │   │   │   ├── DiaryCalendar.tsx # 캘린더 뷰
│   │   │   │   ├── MoodSelector.tsx  # 기분 선택
│   │   │   │   └── WeatherSelector.tsx # 날씨 선택
│   │   │   ├── persona/              # 페르소나 관련 컴포넌트
│   │   │   │   ├── PersonaCard.tsx   # 페르소나 프로필 카드
│   │   │   │   ├── PersonaStatus.tsx # 생성 상태/진행률
│   │   │   │   └── TraitBadge.tsx    # 특성 태그
│   │   │   ├── chat/                 # 채팅 관련 컴포넌트
│   │   │   │   ├── ChatRoom.tsx      # 채팅방
│   │   │   │   ├── ChatMessage.tsx   # 메시지 버블
│   │   │   │   ├── ChatInput.tsx     # 메시지 입력
│   │   │   │   └── ChatList.tsx      # 대화 목록
│   │   │   ├── friend/               # 친구 관련 컴포넌트
│   │   │   │   ├── FriendCard.tsx    # 친구 카드
│   │   │   │   ├── FriendList.tsx    # 친구 목록
│   │   │   │   ├── FriendRequest.tsx # 친구 요청 아이템
│   │   │   │   └── FriendSearch.tsx  # 친구 검색
│   │   │   └── ui/                   # 기본 UI 컴포넌트
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          # 대시보드 (메인)
│   │   │   ├── LoginPage.tsx         # 로그인
│   │   │   ├── RegisterPage.tsx      # 회원가입
│   │   │   ├── diary/
│   │   │   │   ├── DiaryListPage.tsx # 일기 목록
│   │   │   │   ├── DiaryNewPage.tsx  # 일기 작성
│   │   │   │   └── DiaryDetailPage.tsx # 일기 상세/수정
│   │   │   ├── persona/
│   │   │   │   ├── PersonaPage.tsx   # 내 페르소나
│   │   │   │   └── PersonaChatPage.tsx # 페르소나 대화
│   │   │   ├── friend/
│   │   │   │   ├── FriendListPage.tsx # 친구 목록
│   │   │   │   ├── FriendSearchPage.tsx # 친구 검색
│   │   │   │   ├── FriendRequestPage.tsx # 친구 요청 관리
│   │   │   │   ├── FriendProfilePage.tsx # 친구 프로필
│   │   │   │   └── FriendChatPage.tsx # 친구 페르소나 대화
│   │   │   └── SettingsPage.tsx      # 설정
│   │   ├── services/
│   │   │   ├── authService.ts        # 인증 API
│   │   │   ├── diaryService.ts       # 일기 API
│   │   │   ├── personaService.ts     # 페르소나 API
│   │   │   ├── friendService.ts      # 친구 API
│   │   │   └── chatService.ts        # 채팅 API
│   │   ├── store/
│   │   │   ├── authStore.ts          # 인증 상태 (Zustand)
│   │   │   ├── diaryStore.ts         # 일기 상태
│   │   │   └── personaStore.ts       # 페르소나 상태
│   │   ├── types/
│   │   │   ├── auth.ts               # 인증 타입
│   │   │   ├── diary.ts              # 일기 타입
│   │   │   ├── persona.ts            # 페르소나 타입
│   │   │   ├── friend.ts             # 친구 타입
│   │   │   └── chat.ts               # 채팅 타입
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios 인스턴스 설정
│   │   │   ├── utils.ts              # 유틸리티 함수 (cn, formatDate)
│   │   │   └── constants.ts          # 상수 (API_BASE_URL)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # 인증 훅
│   │   │   ├── useDiaries.ts         # 일기 쿼리 훅
│   │   │   └── usePersona.ts         # 페르소나 쿼리 훅
│   │   ├── App.tsx                   # React Router 설정
│   │   ├── main.tsx                  # 진입점
│   │   └── index.css                 # 글로벌 스타일
│   ├── public/
│   │   └── favicon.ico
│   ├── Dockerfile                    # DEV용
│   ├── Dockerfile.prod               # PROD용 (multi-stage)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
│
├── nginx/                            # PROD 웹서버 설정
│   ├── nginx.conf                    # 메인 설정
│   └── conf.d/
│       └── default.conf              # 서버 블록 설정
│
├── docs/                             # 프로젝트 문서
│   ├── RPD.md
│   ├── TECH_STACK.md
│   ├── DIRECTORY.md
│   ├── INFRASTRUCTURE.md
│   ├── API_SPEC.md
│   └── AI_PROMPTS.md
│
├── docker-compose.yml                # DEV 환경
├── docker-compose.prod.yml           # PROD 환경
├── .env.example                      # 환경변수 템플릿
├── .env                              # 실제 환경변수 (Git 제외)
├── .gitignore
└── README.md
```

---

## 파일 생성 가이드

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

### DB 스키마 변경 시

```bash
# 마이그레이션 파일 생성
docker-compose exec backend alembic revision --autogenerate -m "description"

# 마이그레이션 적용
docker-compose exec backend alembic upgrade head

# 마이그레이션 롤백
docker-compose exec backend alembic downgrade -1
```

---

## 네이밍 컨벤션

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
| 파일명 (컴포넌트) | PascalCase | `DiaryCard.tsx` |
| 파일명 (유틸리티) | camelCase | `authService.ts` |
| 컴포넌트 | PascalCase | `DiaryCard` |
| 함수/변수 | camelCase | `getDiaryById` |
| 타입/인터페이스 | PascalCase | `DiaryResponse` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## 모듈 import 순서

### Backend

```python
# 1. 표준 라이브러리
from datetime import datetime
from typing import List, Optional

# 2. 서드파티 라이브러리
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# 3. 로컬 모듈
from app.core.deps import get_db, get_current_user
from app.models.diary import Diary
from app.schemas.diary import DiaryCreate, DiaryResponse
```

### Frontend

```typescript
// 1. React 관련
import { useState, useEffect } from 'react'

// 2. 서드파티 라이브러리
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

// 3. 로컬 컴포넌트
import { Button } from '@/components/ui/Button'
import { DiaryCard } from '@/components/diary/DiaryCard'

// 4. 유틸리티/타입
import { diaryService } from '@/services/diaryService'
import type { Diary } from '@/types/diary'
```
