# Phase 3 개발 계획 - 병렬 작업 가이드

## 1. 현재 개발 상태

### 완료된 기능

| Phase | 기능 | 상태 |
|-------|------|------|
| Phase 1 (MVP) | 프로젝트 초기 세팅 (Docker, DB) | ✅ 완료 |
| Phase 1 (MVP) | 사용자 인증 (회원가입/로그인) | ✅ 완료 |
| Phase 1 (MVP) | 일기 CRUD | ✅ 완료 |
| Phase 1 (MVP) | 페르소나 생성 (LLM) | ✅ 완료 |
| Phase 1 (MVP) | 페르소나 대화 | ✅ 완료 |
| Phase 2 (소셜) | 친구 요청/수락/거절 | ✅ 완료 |
| Phase 2 (소셜) | 친구 목록 관리 | ✅ 완료 |
| Phase 2 (소셜) | 친구 페르소나 대화 | ✅ 완료 |
| Phase 2 (소셜) | 사용자 검색 | ✅ 완료 |

---

## 2. 미개발 기능 (Phase 3)

| ID | 기능명 | 설명 | 복잡도 | 우선순위 |
|----|--------|------|--------|----------|
| F12 | 일기 통계/인사이트 | 감정 분석, 작성 패턴 통계 | 중 | 높음 |
| F13 | 페르소나 커스터마이징 | 말투, 성격 등 세부 조정 | 중 | 높음 |
| F14 | 알림 기능 | 일기 작성 리마인더, 친구 요청 알림 | 상 | 중간 |
| F15 | 일기 프롬프트 제안 | AI가 오늘의 일기 주제 제안 | 하 | 중간 |
| - | 일기 수정 기능 | 기존 일기 내용 수정 | 하 | 높음 |

### 추후 개발 (수익화)

| ID | 기능명 | 설명 |
|----|--------|------|
| F16 | 멀티모달 캐릭터 생성 | 일기 기반 AI 캐릭터 이미지 자동 생성 |
| F17 | 캐릭터 스타일 변경 | 수채화, 애니, 픽셀 등 다양한 화풍 (프리미엄) |
| F18 | 캐릭터 진화 | 일기 30개마다 캐릭터 자동 업데이트 |
| F19 | 친구 캐릭터 열람 | 친구의 캐릭터 확인 (무료 5명, 프리미엄 무제한) |
| F20 | 케미 분석 | 나와 친구의 성격 궁합 분석 (프리미엄) |
| F21 | 굿즈 제작 | 캐릭터로 실물 굿즈 주문 (단건 결제) |
| F22 | 시즌 스킨 | 계절별 한정 캐릭터 스킨 (단건 결제) |
| F23 | 프리미엄 구독 | 월정액 구독 시스템 |

---

## 3. 병렬 개발용 업무 분배

### Agent A: 일기 도메인 담당

```
┌─────────────────────────────────────────────────┐
│ 작업 범위                                        │
├─────────────────────────────────────────────────┤
│ Backend:                                        │
│   - backend/app/api/api_v1/endpoints/diary.py   │
│   - backend/app/services/diary_service.py       │
│   - backend/app/schemas/diary.py                │
│                                                 │
│ Frontend:                                       │
│   - frontend/src/pages/Diary*.tsx               │
│   - frontend/src/services/diaryService.ts       │
│   - frontend/src/components/diary/*             │
└─────────────────────────────────────────────────┘
```

| 순서 | 작업 ID | 작업명 | 상세 내용 |
|------|---------|--------|-----------|
| 1 | A1 | 일기 수정 API | PUT `/api/v1/diaries/{id}` 엔드포인트 구현 |
| 2 | A2 | 일기 수정 UI | DiaryDetail 페이지에 수정 모드 추가 |
| 3 | A3 | 일기 통계 API | GET `/api/v1/diaries/stats` - 감정 분포, 연속 작성일, 월별 통계 |
| 4 | A4 | 일기 통계 UI | 대시보드 또는 별도 페이지에 통계 시각화 |
| 5 | A5 | 일기 프롬프트 제안 | AI 기반 오늘의 일기 주제 제안 API + UI |

#### A1: 일기 수정 API 상세

```python
# PUT /api/v1/diaries/{id}
# Request Body
{
    "content": "수정된 일기 내용",
    "mood": "happy",
    "weather": "sunny",
    "is_private": false
}

# Response
{
    "id": 1,
    "content": "수정된 일기 내용",
    "mood": "happy",
    "weather": "sunny",
    "date": "2026-01-21",
    "is_private": false,
    "updated_at": "2026-01-21T10:30:00Z"
}
```

#### A3: 일기 통계 API 상세

```python
# GET /api/v1/diaries/stats
# Response
{
    "total_count": 45,
    "current_streak": 7,
    "longest_streak": 14,
    "mood_distribution": {
        "happy": 15,
        "calm": 12,
        "sad": 8,
        "anxious": 5,
        "angry": 3,
        "excited": 2
    },
    "monthly_count": {
        "2026-01": 21,
        "2025-12": 24
    },
    "weekly_average": 5.2
}
```

---

### Agent B: 페르소나 도메인 담당

```
┌─────────────────────────────────────────────────────┐
│ 작업 범위                                            │
├─────────────────────────────────────────────────────┤
│ Backend:                                            │
│   - backend/app/api/api_v1/endpoints/persona.py     │
│   - backend/app/services/persona_service.py         │
│   - backend/app/schemas/persona.py                  │
│   - backend/app/models/notification.py (신규)       │
│                                                     │
│ Frontend:                                           │
│   - frontend/src/pages/Persona*.tsx                 │
│   - frontend/src/services/personaService.ts         │
│   - frontend/src/components/persona/*               │
└─────────────────────────────────────────────────────┘
```

| 순서 | 작업 ID | 작업명 | 상세 내용 |
|------|---------|--------|-----------|
| 1 | B1 | 페르소나 설정 API | PUT `/api/v1/personas/me` - name, is_public 수정 |
| 2 | B2 | 페르소나 설정 UI | 페르소나 프로필 페이지에 설정 모달 추가 |
| 3 | B3 | 페르소나 커스터마이징 API | 말투/성격 직접 조정 기능 |
| 4 | B4 | 페르소나 커스터마이징 UI | 슬라이더/태그 선택 인터페이스 |
| 5 | B5 | 알림 시스템 기반 | 알림 테이블 설계 + 기본 CRUD API |

#### B1: 페르소나 설정 API 상세

```python
# PUT /api/v1/personas/me
# Request Body
{
    "name": "나의 새 페르소나",
    "is_public": true
}

# Response
{
    "id": 1,
    "user_id": 1,
    "name": "나의 새 페르소나",
    "personality": "...",
    "traits": ["외향적", "감성적"],
    "speaking_style": "...",
    "is_public": true,
    "updated_at": "2026-01-21T10:30:00Z"
}
```

#### B3: 페르소나 커스터마이징 API 상세

```python
# PUT /api/v1/personas/me/customize
# Request Body
{
    "speaking_style_tone": "formal",  # formal, casual, cute
    "speaking_style_emoji": true,
    "personality_traits_override": ["외향적", "유머러스"],
    "custom_greeting": "안녕! 오늘도 좋은 하루야~"
}

# Response
{
    "id": 1,
    "customization": {
        "speaking_style_tone": "formal",
        "speaking_style_emoji": true,
        "personality_traits_override": ["외향적", "유머러스"],
        "custom_greeting": "안녕! 오늘도 좋은 하루야~"
    },
    "updated_at": "2026-01-21T10:30:00Z"
}
```

#### B5: 알림 테이블 설계

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,        -- friend_request, diary_reminder, persona_updated
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,               -- 관련 엔티티 ID (친구 요청 ID 등)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
```

---

## 4. 의존성 다이어그램

```
Agent A (일기 도메인)              Agent B (페르소나 도메인)
════════════════════              ══════════════════════════

A1 일기 수정 API ──┐               B1 페르소나 설정 API
       │          │                       │
       ▼          │                       ▼
A2 일기 수정 UI   │   ◄── 독립 ──►  B2 페르소나 설정 UI
       │          │                       │
       ▼          │                       ▼
A3 일기 통계 API  │               B3 커스터마이징 API
       │          │                       │
       ▼          │                       ▼
A4 일기 통계 UI   │               B4 커스터마이징 UI
       │          │                       │
       ▼          │                       ▼
A5 프롬프트 제안  │               B5 알림 시스템
                  │
      ════════════════════════════════════
              충돌 없음 (서로 다른 파일)
```

---

## 5. 공통 작업 (마지막에 머지)

아래 파일들은 양쪽 Agent가 수정할 수 있으므로, 각자 작업 완료 후 마지막에 머지합니다.

| 파일 | Agent A 수정 내용 | Agent B 수정 내용 |
|------|-------------------|-------------------|
| `frontend/src/App.tsx` | 일기 통계 라우트 추가 | 페르소나 설정 라우트 추가 |
| `backend/app/api/api_v1/api.py` | (변경 없음) | 알림 라우터 등록 |
| `frontend/src/types/index.ts` | DiaryStats 타입 추가 | Notification 타입 추가 |

---

## 6. 작업 시 주의사항

### 공통
1. **커밋 메시지**: `feat(diary): 일기 수정 API 구현` 형식 사용
2. **브랜치 전략**: `feature/diary-edit`, `feature/persona-customize` 등 기능별 브랜치
3. **타입 안정성**: TypeScript strict 모드 준수, any 타입 사용 금지

### Agent A 전용
- 일기 수정 시 `date` 필드는 수정 불가 (하루에 하나의 일기 정책 유지)
- 통계 API는 캐싱 고려 (자주 호출될 수 있음)

### Agent B 전용
- 알림 테이블 마이그레이션 생성 시 Agent A와 시점 조율 필요
- 페르소나 커스터마이징은 기존 LLM 프롬프트에 영향을 줄 수 있음 → `docs/AI_PROMPTS.md` 참조

---

## 7. 예상 산출물

### Agent A 완료 후
- [ ] `PUT /api/v1/diaries/{id}` API
- [ ] `GET /api/v1/diaries/stats` API
- [ ] `GET /api/v1/diaries/prompt-suggestion` API
- [ ] 일기 수정 UI (DiaryDetail 페이지)
- [ ] 일기 통계 UI (Dashboard 또는 별도 페이지)
- [ ] 일기 프롬프트 제안 UI (일기 작성 페이지)

### Agent B 완료 후
- [ ] `PUT /api/v1/personas/me` API
- [ ] `PUT /api/v1/personas/me/customize` API
- [ ] `notifications` 테이블 및 마이그레이션
- [ ] `GET/POST /api/v1/notifications` API
- [ ] 페르소나 설정 모달 UI
- [ ] 페르소나 커스터마이징 UI
- [ ] 알림 목록 UI (헤더 또는 별도 페이지)

---

## 8. 참고 문서

| 문서 | 용도 |
|------|------|
| [RPD.md](./RPD.md) | 전체 요구사항 및 설계 |
| [API_SPEC.md](./API_SPEC.md) | API 엔드포인트 명세 |
| [AI_PROMPTS.md](./AI_PROMPTS.md) | LLM 프롬프트 설계 |
| [DIRECTORY.md](./DIRECTORY.md) | 디렉토리 구조 |
