# DearMe (디어미)

일기 기반 AI 페르소나 서비스

## 프로젝트 개요

사용자가 일기를 꾸준히 작성하면 LLM이 일기를 분석하여 **"나만의 AI 캐릭터(페르소나)"**를 생성하고, 친구의 페르소나와 대화할 수 있는 소셜 일기 플랫폼입니다.

### 핵심 기능

1. **일기 작성** - 매일 일기를 작성하고 기분/날씨 태그 추가
2. **페르소나 생성** - 일기 7개 이상 작성 시 AI가 나만의 페르소나 생성
3. **자기 성찰 대화** - 내 페르소나와 대화하며 자기 이해
4. **친구 페르소나 대화** - 친구의 일기 기반 페르소나와 대화 (일기는 비공개)

### 핵심 가치

| 가치 | 설명 |
|------|------|
| 자기 이해 | 일기 작성과 페르소나를 통한 자기 성찰 |
| 프라이버시 보호 | 친구 일기는 비공개, AI 페르소나로만 간접 소통 |
| 관계 강화 | 직접 묻기 어려운 질문을 페르소나에게 |

---

## 기술 스택

### Backend
- **FastAPI** - Python 비동기 웹 프레임워크
- **PostgreSQL** - 관계형 데이터베이스
- **SQLAlchemy** - ORM
- **Alembic** - DB 마이그레이션
- **LangChain + OpenAI** - AI/LLM 통합

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **TanStack Query** - 서버 상태 관리

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

### 2. 개발 환경 실행
```bash
docker-compose up --build
```

### 3. 접속
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

## 프로젝트 구조

```
02.DEAR_ME/
├── docs/                    # 프로젝트 문서
│   ├── RPD.md              # 요구사항 및 설계 문서
│   ├── TECH_STACK.md       # 기술 스택 상세
│   ├── DIRECTORY.md        # 디렉토리 구조 가이드
│   ├── INFRASTRUCTURE.md   # 인프라 및 배포 가이드
│   ├── API_SPEC.md         # API 명세서
│   └── AI_PROMPTS.md       # AI 프롬프트 설계
├── .env.example            # 환경 변수 템플릿
└── README.md               # 프로젝트 소개
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

### Phase 1: MVP
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

## 라이선스

Private Project
