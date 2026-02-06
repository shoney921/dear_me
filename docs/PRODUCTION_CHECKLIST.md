# DearMe 프로덕션 운영 준비 체크리스트

## 현재 상태 요약

| 카테고리 | 완료 | 부분 | 미완료 |
|----------|------|------|--------|
| 보안 | 3 | 2 | 3 |
| 인프라 | 2 | 2 | 0 |
| 모니터링 | 0 | 2 | 2 |
| 프론트엔드 | 0 | 2 | 2 |
| 법적 요구사항 | 2 | 0 | 1 |

---

## P0: 즉시 조치 필요 (운영 전 필수)

### 1. API 키 보안 조치
**문제**: `.env.production`에 민감정보가 노출되어 Git 히스토리에 남아있을 수 있음

**작업 내용**:
- [ ] OpenAI API 키 재발급 (https://platform.openai.com/api-keys)
- [ ] Cloudflare Tunnel 토큰 재발급 (https://one.dash.cloudflare.com/)
- [ ] DB 비밀번호 강화 (`dearme123` → 강력한 비밀번호)
  ```bash
  openssl rand -base64 32  # 비밀번호 생성
  ```
- [ ] JWT Secret Key 강화
  ```bash
  openssl rand -hex 64  # 시크릿 키 생성
  ```
- [ ] `.gitignore`에 `.env.production` 추가 확인 ✅ (이미 추가됨)
- [ ] (선택) Git 히스토리에서 민감정보 제거 (BFG Repo Cleaner)

---

### 2. 데이터베이스 백업 시스템
**문제**: 자동 백업 없음 → 데이터 손실 위험

**작업 내용**:
- [ ] `scripts/backup_db.sh` 스크립트 작성
  ```bash
  #!/bin/bash
  BACKUP_DIR="./backups"
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  mkdir -p "$BACKUP_DIR"
  docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U dearme dearme | gzip > "$BACKUP_DIR/dearme_$TIMESTAMP.sql.gz"
  # 30일 이상 된 백업 삭제
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
  ```
- [ ] `scripts/restore_db.sh` 스크립트 작성
- [ ] cron 작업 설정 (매일 새벽 3시)
  ```bash
  crontab -e
  # 추가:
  0 3 * * * /path/to/scripts/backup_db.sh >> /var/log/dearme_backup.log 2>&1
  ```
- [ ] 복구 테스트 1회 실행

---

### 3. CORS 프로덕션 설정
**문제**: 개발 환경 도메인만 허용됨

**수정 파일**: `backend/app/core/config.py`

```python
# 현재
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# 변경 (프로덕션 도메인 추가)
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://your-production-domain.com",  # 실제 도메인으로 변경
]
```

- [ ] 프로덕션 도메인 추가
- [ ] `allow_methods` 필요한 것만 명시 (선택)

---

## P1: 높은 우선순위 (1주 내 조치)

### 4. Rate Limiting 구현
**문제**: 브루트포스 공격에 취약

**수정 파일**:
- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/api/api_v1/endpoints/auth.py`

```python
# requirements.txt에 추가
slowapi==0.1.9

# main.py에 추가
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# auth.py 엔드포인트에 적용
@router.post("/login")
@limiter.limit("5/minute")
def login(...):
    ...
```

- [ ] `slowapi` 라이브러리 설치
- [ ] 로그인 API: 분당 5회 제한
- [ ] 회원가입 API: 시간당 3회 제한
- [ ] 일반 API: 분당 60회 제한

---

### 5. Nginx 보안 헤더 추가
**문제**: 클릭재킹, XSS 등 공격에 취약

**수정 파일**: `frontend/nginx.conf`

```nginx
# server 블록 내에 추가
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

- [ ] 보안 헤더 5개 추가

---

### 6. JWT 토큰 유효기간 조정
**문제**: 7일은 너무 김 (탈취 시 위험)

**수정 파일**: `backend/app/core/config.py`

```python
# 현재
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

# 변경
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
```

- [ ] Access Token: 7일 → 1일로 단축
- [ ] (선택) Refresh Token 시스템 구현

---

### 7. 헬스체크 고도화
**문제**: DB 연결 상태 확인 안 함

**수정 파일**: `backend/app/main.py`

```python
from app.core.database import SessionLocal

@app.get("/health/live")
def liveness():
    """기본 생존 확인"""
    return {"status": "alive"}

@app.get("/health/ready")
def readiness():
    """DB 연결 포함 준비 상태 확인"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")
```

- [ ] `/health/live` 엔드포인트 추가
- [ ] `/health/ready` 엔드포인트 추가 (DB 연결 확인)

---

## P2: 중간 우선순위 (2주 내 조치)

### 8. Sentry 에러 모니터링 연동

**작업 내용**:
- [ ] Sentry 계정 생성 (https://sentry.io)
- [ ] Backend 연동
  ```python
  # requirements.txt
  sentry-sdk[fastapi]==1.39.1

  # main.py
  import sentry_sdk
  sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)
  ```
- [ ] Frontend 연동
  ```bash
  npm install @sentry/react
  ```
- [ ] 환경변수에 `SENTRY_DSN` 추가

---

### 9. 에러 페이지 구현

**생성 파일**:
- `frontend/src/pages/errors/NotFoundPage.tsx`
- `frontend/src/pages/errors/ServerErrorPage.tsx`

**수정 파일**: `frontend/src/App.tsx`

- [ ] 404 Not Found 페이지
- [ ] 500 Server Error 페이지
- [ ] 라우터에 에러 페이지 등록

---

### 10. SEO 메타 태그 추가

**수정 파일**: `frontend/index.html`

```html
<head>
  <!-- 기본 메타 -->
  <meta name="description" content="일기를 쓰면 나만의 AI 페르소나가 생성됩니다. 친구의 페르소나와 대화해보세요." />
  <meta name="keywords" content="일기, AI, 페르소나, 감정분석, 멘탈케어" />

  <!-- Open Graph -->
  <meta property="og:title" content="DearMe - 일기 기반 AI 페르소나" />
  <meta property="og:description" content="일기를 쓰면 나만의 AI 페르소나가 생성됩니다." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="DearMe - 일기 기반 AI 페르소나" />
  <meta name="twitter:description" content="일기를 쓰면 나만의 AI 페르소나가 생성됩니다." />
</head>
```

- [ ] 기본 메타 태그 추가
- [ ] Open Graph 태그 추가
- [ ] Twitter Card 태그 추가
- [ ] OG 이미지 제작 (1200x630px)

---

### 11. 쿠키 동의 배너

**생성 파일**:
- `frontend/src/components/common/CookieConsent.tsx`
- `frontend/src/pages/legal/CookiePolicyPage.tsx`

- [ ] 쿠키 동의 배너 컴포넌트
- [ ] 쿠키 정책 페이지
- [ ] 동의 상태 localStorage 저장

---

### 12. 구조화된 로깅 시스템

**수정 파일**: `backend/app/main.py`

```python
# requirements.txt
python-json-logger==2.0.7

# main.py
import logging
from pythonjsonlogger import jsonlogger

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
handler.setFormatter(formatter)
logging.root.addHandler(handler)
```

- [ ] JSON 형식 로깅 설정
- [ ] 로그 파일 저장 및 회전
- [ ] 로그 레벨 환경별 분리

---

## P3: 낮은 우선순위 (운영 후 개선)

### 13. PWA 지원
- [ ] `manifest.json` 생성
- [ ] Service Worker 구현
- [ ] 오프라인 캐싱 전략

### 14. 접근성 개선
- [ ] ARIA 라벨 추가
- [ ] 키보드 네비게이션 개선
- [ ] 색상 대비 검증

### 15. Redis 캐싱 도입
- [ ] Redis 컨테이너 추가
- [ ] 자주 조회되는 API 캐싱
- [ ] 세션 관리 개선

### 16. CI/CD 파이프라인
- [ ] GitHub Actions 설정
- [ ] 자동 테스트
- [ ] 자동 배포

---

## 권장 진행 순서

### Week 0 (운영 전)
1. ✅ API 키 보안 조치 (P0)
2. ✅ DB 백업 시스템 (P0)
3. ✅ CORS 프로덕션 설정 (P0)

### Week 1
4. Rate Limiting (P1)
5. Nginx 보안 헤더 (P1)
6. JWT 토큰 조정 (P1)
7. 헬스체크 고도화 (P1)

### Week 2
8. Sentry 연동 (P2)
9. 에러 페이지 (P2)
10. SEO 메타 태그 (P2)

### Week 3+
11. 쿠키 동의 (P2)
12. 로깅 시스템 (P2)
13~16. P3 항목들
