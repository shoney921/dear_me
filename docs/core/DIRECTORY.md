# 디렉토리 구조 가이드

## 전체 프로젝트 구조

```
dear-me/
├── backend/                          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── api_v1/
│   │   │       ├── endpoints/        # API 엔드포인트
│   │   │       │   ├── auth.py       # 인증 (로그인/회원가입/이메일인증/비밀번호초기화)
│   │   │       │   ├── diary.py      # 일기 CRUD + 통계
│   │   │       │   ├── persona.py    # 페르소나 관리
│   │   │       │   ├── friend.py     # 친구 관리
│   │   │       │   ├── chat.py       # 페르소나 대화
│   │   │       │   ├── user.py       # 사용자 정보
│   │   │       │   ├── notification.py # 알림
│   │   │       │   ├── mental.py     # 심리 케어
│   │   │       │   ├── quiz.py       # 성격 퀴즈
│   │   │       │   └── subscription.py # 구독 관리
│   │   │       └── api.py            # API 라우터 통합
│   │   ├── core/
│   │   │   ├── config.py             # 환경 설정 (Settings, SMTP, JWT 등)
│   │   │   ├── database.py           # DB 연결 설정
│   │   │   ├── security.py           # JWT 토큰 처리, 비밀번호 해싱
│   │   │   ├── deps.py               # 의존성 주입 (get_db, get_current_user)
│   │   │   └── business_logger.py    # 비즈니스 이벤트 로깅
│   │   ├── models/
│   │   │   ├── user.py               # User 모델 (이메일인증, 비밀번호초기화 필드 포함)
│   │   │   ├── diary.py              # Diary 모델
│   │   │   ├── diary_embedding.py    # DiaryEmbedding 모델 (RAG용)
│   │   │   ├── persona.py            # Persona 모델
│   │   │   ├── friendship.py         # Friendship 모델
│   │   │   ├── chat.py               # PersonaChat, ChatMessage 모델
│   │   │   ├── notification.py       # Notification 모델
│   │   │   ├── mental_analysis.py    # MentalAnalysis 모델
│   │   │   ├── mental_report.py      # MentalReport 모델
│   │   │   ├── subscription.py       # Subscription 모델
│   │   │   └── usage.py              # DailyUsage 모델
│   │   ├── schemas/
│   │   │   ├── auth.py               # Auth 스키마 (로그인/회원가입/비밀번호초기화)
│   │   │   ├── user.py               # User 스키마
│   │   │   ├── diary.py              # Diary 스키마
│   │   │   ├── persona.py            # Persona 스키마
│   │   │   ├── friendship.py         # Friendship 스키마
│   │   │   ├── chat.py               # Chat 스키마
│   │   │   ├── notification.py       # Notification 스키마
│   │   │   ├── mental.py             # Mental 스키마
│   │   │   ├── quiz.py               # Quiz 스키마
│   │   │   └── subscription.py       # Subscription 스키마
│   │   ├── services/
│   │   │   ├── chat_service.py       # 채팅 로직 (RAG 통합)
│   │   │   ├── email_service.py      # 이메일 발송 (인증/비밀번호초기화)
│   │   │   ├── embedding_service.py  # 임베딩 서비스 (RAG용)
│   │   │   ├── mental_service.py     # 심리 분석 로직
│   │   │   ├── milestone_service.py  # 마일스톤 추적
│   │   │   ├── persona_service.py    # 페르소나 생성/대화 (LLM)
│   │   │   └── subscription_service.py # 구독 관리 로직
│   │   ├── constants/
│   │   │   ├── moods.py              # 기분 상수
│   │   │   ├── weather.py            # 날씨 상수
│   │   │   ├── prompts.py            # LLM 프롬프트 상수
│   │   │   ├── books.py              # 책 추천 데이터
│   │   │   ├── quiz.py               # 퀴즈 질문 데이터
│   │   │   └── subscription.py       # 구독 플랜 정의
│   │   └── main.py                   # FastAPI 앱 진입점
│   ├── alembic/
│   │   ├── versions/                 # 마이그레이션 파일들
│   │   └── env.py                    # Alembic 환경 설정
│   ├── scripts/
│   │   ├── seed_data.py              # 시드 데이터 생성
│   │   ├── seed_contents.py          # 시드 데이터 내용
│   │   └── embed_diaries.py          # 일기 임베딩 배치 스크립트 (RAG)
│   ├── Dockerfile                    # DEV용
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # 공통 컴포넌트
│   │   │   │   ├── Layout.tsx        # 레이아웃 (Header + BottomTabBar)
│   │   │   │   ├── Header.tsx        # 데스크탑 헤더
│   │   │   │   ├── MobileHeader.tsx  # 모바일 헤더
│   │   │   │   ├── BottomTabBar.tsx  # 모바일 하단 탭
│   │   │   │   ├── ProtectedRoute.tsx # 인증 라우트 가드
│   │   │   │   ├── ProfileDropdown.tsx # 프로필 드롭다운
│   │   │   │   └── MoreMenu.tsx      # 추가 메뉴
│   │   │   ├── diary/                # 일기 관련 컴포넌트
│   │   │   │   └── StreakCard.tsx    # 일기 연속 기록 카드
│   │   │   ├── home/                 # 홈 대시보드 컴포넌트
│   │   │   │   ├── EmotionCalendar.tsx # 감정 캘린더
│   │   │   │   ├── PersonaGreeting.tsx # 페르소나 인사말
│   │   │   │   └── WeeklyInsightCard.tsx # 주간 인사이트
│   │   │   ├── mental/               # 심리 케어 컴포넌트
│   │   │   │   ├── RadarChart.tsx    # 6축 레이더 차트
│   │   │   │   ├── MentalStatusCard.tsx # 멘탈 상태 카드
│   │   │   │   ├── FeedbackCard.tsx  # 피드백 카드
│   │   │   │   ├── MentalHistoryChart.tsx # 이력 차트
│   │   │   │   ├── BookCard.tsx      # 책 추천 카드
│   │   │   │   └── ReportCard.tsx    # 리포트 카드
│   │   │   ├── persona/              # 페르소나 관련 컴포넌트
│   │   │   │   └── PersonaCustomizeModal.tsx # 커스터마이징 모달
│   │   │   └── ui/                   # 기본 UI 컴포넌트
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Loading.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       └── Switch.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          # 대시보드 (메인)
│   │   │   ├── LoginPage.tsx         # 로그인
│   │   │   ├── RegisterPage.tsx      # 회원가입
│   │   │   ├── VerifyEmailPage.tsx   # 이메일 인증
│   │   │   ├── ForgotPasswordPage.tsx # 비밀번호 찾기
│   │   │   ├── ResetPasswordPage.tsx # 비밀번호 재설정
│   │   │   ├── diary/
│   │   │   │   ├── DiaryListPage.tsx # 일기 목록
│   │   │   │   ├── DiaryNewPage.tsx  # 일기 작성
│   │   │   │   ├── DiaryDetailPage.tsx # 일기 상세/수정
│   │   │   │   └── DiaryStatsPage.tsx # 일기 통계
│   │   │   ├── persona/
│   │   │   │   ├── PersonaPage.tsx   # 내 페르소나
│   │   │   │   └── PersonaChatPage.tsx # 페르소나 대화
│   │   │   ├── friend/
│   │   │   │   └── FriendListPage.tsx # 친구 목록/검색/요청
│   │   │   ├── notification/
│   │   │   │   └── NotificationListPage.tsx # 알림 목록
│   │   │   ├── mental/
│   │   │   │   ├── MentalDashboardPage.tsx # 심리 대시보드
│   │   │   │   ├── MentalReportPage.tsx # 주간/월간 리포트
│   │   │   │   └── BookRecommendationPage.tsx # 책 추천
│   │   │   ├── premium/
│   │   │   │   └── PremiumPage.tsx   # 프리미엄 구독
│   │   │   ├── quiz/
│   │   │   │   └── QuizPage.tsx      # 성격 퀴즈
│   │   │   └── legal/
│   │   │       ├── PrivacyPolicyPage.tsx # 개인정보처리방침
│   │   │       └── TermsOfServicePage.tsx # 이용약관
│   │   ├── services/
│   │   │   ├── authService.ts        # 인증 API (로그인/회원가입/비밀번호초기화)
│   │   │   ├── diaryService.ts       # 일기 API
│   │   │   ├── personaService.ts     # 페르소나 API
│   │   │   ├── friendService.ts      # 친구 API
│   │   │   ├── chatService.ts        # 채팅 API
│   │   │   ├── notificationService.ts # 알림 API
│   │   │   ├── mentalService.ts      # 심리 케어 API
│   │   │   ├── quizService.ts        # 퀴즈 API
│   │   │   └── subscriptionService.ts # 구독 API
│   │   ├── store/
│   │   │   └── authStore.ts          # 인증 상태 (Zustand + persist)
│   │   ├── types/
│   │   │   ├── auth.ts               # 인증 타입
│   │   │   ├── diary.ts              # 일기 타입
│   │   │   ├── persona.ts            # 페르소나 타입
│   │   │   ├── friend.ts             # 친구 타입
│   │   │   ├── chat.ts               # 채팅 타입
│   │   │   ├── notification.ts       # 알림 타입
│   │   │   ├── mental.ts             # 심리 케어 타입
│   │   │   ├── quiz.ts               # 퀴즈 타입
│   │   │   └── subscription.ts       # 구독 타입
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios 인스턴스 설정
│   │   │   ├── utils.ts              # 유틸리티 함수 (cn, formatDate)
│   │   │   ├── constants.ts          # 상수 (API_BASE_URL)
│   │   │   ├── error.ts              # API 에러 → 한국어 변환
│   │   │   ├── queryClient.ts        # TanStack Query 설정
│   │   │   └── version.ts            # 앱 버전 관리 (배포 시 캐시 초기화)
│   │   ├── App.tsx                   # React Router 설정
│   │   ├── main.tsx                  # 진입점
│   │   └── App.css                   # 글로벌 스타일
│   ├── public/                       # 정적 파일 (로고, 배경 등)
│   ├── Dockerfile                    # DEV용
│   ├── Dockerfile.prod               # PROD용 (multi-stage)
│   ├── nginx.conf                    # 프로덕션 Nginx 설정
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
│
├── docs/                             # 프로젝트 문서
│   ├── RPD.md                        # 요구사항 및 설계
│   ├── EMAIL_VERIFICATION.md         # 이메일 인증 설계서
│   ├── DEPLOYMENT_CHECKLIST.md       # 배포 체크리스트
│   ├── PRODUCTION_CHECKLIST.md       # 프로덕션 준비 체크리스트
│   ├── SECURITY_CHECKLIST.md         # 보안 체크리스트
│   ├── MENTAL_AXES_MIGRATION.md      # 심리 분석 축 마이그레이션
│   ├── core/
│   │   ├── TECH_STACK.md             # 기술 스택 상세
│   │   ├── DIRECTORY.md              # 디렉토리 구조 (이 파일)
│   │   ├── INFRASTRUCTURE.md         # Docker/배포 설정
│   │   ├── SCALING_STRATEGY.md       # 스케일링 전략
│   │   └── AI_PROMPTS.md             # LLM 프롬프트 설계
│   ├── future/
│   │   ├── FEATURE_IDEAS.md          # 기능 아이디어
│   │   ├── MONETIZATION_ROADMAP.md   # 수익화 로드맵
│   │   └── UX_UI_IMPROVEMENTS.md     # UX/UI 개선안
│   └── archive/
│       └── PHASE3_TODO.md            # Phase 3 완료 기록
│
├── scripts/                          # 운영 스크립트
│   ├── backup_db.sh                  # DB 백업
│   └── restore_db.sh                # DB 복원
│
├── docker-compose.yml                # DEV 환경
├── docker-compose.prod.yml           # PROD 환경
├── .env.example                      # 환경변수 템플릿
├── .env                              # 실제 환경변수 (Git 제외)
├── .env.production                   # 프로덕션 환경변수 (Git 제외)
├── CLAUDE.md                         # Claude Code 프로젝트 컨텍스트
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
