# 이메일 인증 링크 구현 설계서

## 개요

회원가입 시 Gmail SMTP를 통해 인증 링크 이메일을 발송하고, 인증 완료 전까지 로그인을 차단하는 기능.

### 목적
- 유효한 이메일 주소 확인
- 스팸/봇 가입 방지
- 사용자 계정 보안 강화

---

## 사전 준비 (관리자)

1. Gmail 계정에서 **2단계 인증** 활성화
2. Google 계정 > 보안 > **앱 비밀번호** 생성
3. `.env` / `.env.production`에 아래 변수 추가:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173        # 개발
# FRONTEND_URL=https://dearme.shoneylife.com  # 운영
```

---

## 사용자 흐름

```
1. 회원가입 폼 제출
2. 서버: 사용자 생성 (email_verified=False) + 인증 토큰 생성
3. 서버: Gmail SMTP로 인증 링크 이메일 발송
4. 사용자: 이메일 수신 → 인증 링크 클릭
5. 프론트: /verify-email?token=xxx 페이지에서 API 호출
6. 서버: 토큰 검증 → email_verified=True 처리
7. 사용자: 로그인 페이지에서 정상 로그인
```

### 미인증 시 로그인 시도
```
1. 사용자: 이메일/비밀번호 입력 → 로그인 시도
2. 서버: HTTP 403 "Email not verified" 반환
3. 프론트: "이메일 인증이 필요합니다" 배너 표시 + 재발송 버튼
4. 사용자: 재발송 버튼 클릭 → 새 인증 이메일 수신
```

---

## 기술 설계

### 1. DB 스키마 변경

**테이블:** `users`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `email_verified` | Boolean (default=False) | 이메일 인증 여부 |
| `verification_token` | String(255), nullable, indexed | 인증 토큰 |
| `verification_token_expires_at` | DateTime, nullable | 토큰 만료 시각 |

> 기존 사용자는 마이그레이션 시 `server_default='true'`로 email_verified=True 설정 (하위 호환)

### 2. 백엔드 설정 추가

**파일:** `backend/app/core/config.py`

```python
SMTP_HOST: str = "smtp.gmail.com"
SMTP_PORT: int = 587
SMTP_USER: str = ""
SMTP_PASSWORD: str = ""
SMTP_FROM_NAME: str = "DearMe"
FRONTEND_URL: str = "http://localhost:5173"
VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
```

### 3. 이메일 서비스

**파일:** `backend/app/services/email_service.py` (신규)

| 함수 | 설명 |
|------|------|
| `generate_verification_token()` | `uuid.uuid4().hex` (128bit 토큰) |
| `create_verification_token(user, db)` | 토큰 생성 + DB 저장 + 만료시간 설정 |
| `send_verification_email(user, token)` | HTML 이메일 발송 (한국어, DearMe 브랜드) |
| `verify_token(token, db)` | 토큰 검증 + email_verified=True + 토큰 무효화 |

- Python 내장 `smtplib` + `email.mime` 사용 (추가 패키지 불필요)
- 토큰은 1회용 (검증 후 삭제)
- 만료 시간: 24시간

### 4. API 엔드포인트 변경

#### 수정
| Method | Endpoint | 변경 내용 |
|--------|----------|----------|
| POST | `/api/v1/auth/register` | response_model → RegisterResponse, 이메일 발송 추가 |
| POST | `/api/v1/auth/login/json` | email_verified 미인증 시 HTTP 403 |
| POST | `/api/v1/auth/login` | email_verified 미인증 시 HTTP 403 |

#### 신규
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/auth/verify-email?token=xxx` | 토큰 검증 + 인증 완료 |
| POST | `/api/v1/auth/resend-verification` | 인증 메일 재발송 |

#### 보안 고려사항
- `resend-verification`: 사용자 존재 여부 미노출 (항상 동일 응답)
- Rate limit: 1분 이내 재요청 차단 (토큰 만료시간 역산)
- 이메일 발송 실패 시 가입은 성공 처리 (로그 경고만)

### 5. Pydantic 스키마

**auth.py 추가:**
```python
class RegisterResponse(BaseModel):
    id: int
    email: str
    username: str
    message: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr
```

**user.py 수정:**
```python
class UserResponse(UserBase):
    # 기존 필드...
    email_verified: bool  # 추가
```

### 6. 프론트엔드 변경

#### 타입 (`frontend/src/types/auth.ts`)
```typescript
interface User {
  // 기존 필드...
  email_verified: boolean  // 추가
}

interface RegisterResponse {
  id: number
  email: string
  username: string
  message: string
}
```

#### API 서비스 (`frontend/src/services/authService.ts`)
- `register()` 반환타입 → `RegisterResponse`
- `verifyEmail(token)` 추가
- `resendVerification(email)` 추가

#### 에러 번역 (`frontend/src/lib/error.ts`)
- `'Email not verified'` → `'이메일 인증이 필요합니다. 이메일을 확인해주세요.'`
- `'Invalid or expired verification token'` → `'인증 링크가 만료되었거나 유효하지 않습니다.'`
- `'Please wait before requesting another verification email'` → `'잠시 후 다시 시도해주세요.'`
- 403 상태 코드 처리 개선 (translateErrorDetail 우선 체크)

#### 페이지 변경
| 페이지 | 변경 내용 |
|--------|----------|
| `RegisterPage.tsx` | 가입 성공 시 navigate state에 `verificationSent: true`, `email` 추가 |
| `LoginPage.tsx` | 인증 안내 배너, 403 감지, 재발송 버튼 추가 |
| `VerifyEmailPage.tsx` (신규) | 토큰 검증 결과 표시 (성공/실패/로딩) |
| `App.tsx` | `/verify-email` 퍼블릭 라우트 추가 |

### 7. Docker Compose 환경변수

**docker-compose.yml (개발):**
```yaml
- SMTP_USER=${SMTP_USER:-}
- SMTP_PASSWORD=${SMTP_PASSWORD:-}
- FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
```

**docker-compose.prod.yml (운영):**
```yaml
- SMTP_USER=${SMTP_USER}
- SMTP_PASSWORD=${SMTP_PASSWORD}
- FRONTEND_URL=${FRONTEND_URL:-https://dearme.shoneylife.com}
```

---

## 수정 파일 목록

| 구분 | 파일 |
|------|------|
| **신규** | `backend/app/services/email_service.py` |
| **신규** | `frontend/src/pages/VerifyEmailPage.tsx` |
| **신규** | `backend/alembic/versions/` (마이그레이션) |
| 수정 | `backend/app/models/user.py` |
| 수정 | `backend/app/core/config.py` |
| 수정 | `backend/app/schemas/auth.py` |
| 수정 | `backend/app/schemas/user.py` |
| 수정 | `backend/app/api/api_v1/endpoints/auth.py` |
| 수정 | `frontend/src/types/auth.ts` |
| 수정 | `frontend/src/services/authService.ts` |
| 수정 | `frontend/src/lib/error.ts` |
| 수정 | `frontend/src/pages/RegisterPage.tsx` |
| 수정 | `frontend/src/pages/LoginPage.tsx` |
| 수정 | `frontend/src/App.tsx` |
| 수정 | `docker-compose.yml` |
| 수정 | `docker-compose.prod.yml` |

---

## 검증 방법

### 개발 환경 테스트
1. `.env`에 Gmail SMTP 정보 입력
2. `docker-compose up --build`
3. 회원가입 → 이메일 수신 확인 → 링크 클릭 → 인증 완료 → 로그인 성공
4. 미인증 상태로 로그인 시도 → "이메일 인증 필요" 메시지 + 재발송 버튼
5. 재발송 1분 rate limit 확인
6. 만료된 토큰 사용 시 에러 메시지 확인

### 기존 사용자 호환성
- 마이그레이션 후 기존 사용자 `email_verified` = True 확인
- 기존 사용자 정상 로그인 확인

### 프로덕션 배포
1. `.env.production`에 SMTP 변수 추가
2. 버전 업데이트 (`frontend/src/lib/version.ts`)
3. `docker-compose.prod.yml` 빌드 + 마이그레이션

---

## 관련 기능

- **비밀번호 초기화**: 동일한 SMTP 인프라를 활용하여 비밀번호 초기화 이메일 발송 기능도 구현되어 있음
  - `POST /api/v1/auth/forgot-password` — 초기화 이메일 발송
  - `POST /api/v1/auth/reset-password` — 토큰 검증 + 비밀번호 변경
  - 토큰 만료: 1시간 (이메일 인증 24시간보다 짧게)
  - Rate limit: 1분 쿨다운 (이메일 인증과 동일)
