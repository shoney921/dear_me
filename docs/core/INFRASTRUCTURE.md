# 인프라 및 Docker 설정 가이드

## Docker Compose 설정

### 개발 환경 (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL 데이터베이스 (pgvector 확장 포함)
  postgres:
    image: pgvector/pgvector:pg15
    container_name: dearme-postgres
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-dearme_db}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI 백엔드
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dearme-backend
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_NAME:-dearme_db}
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SMTP_USER=${SMTP_USER:-}
      - SMTP_PASSWORD=${SMTP_PASSWORD:-}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # React 프론트엔드 (개발 서버)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dearme-frontend
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev -- --host

volumes:
  postgres_data:
```

### 프로덕션 환경 (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL 데이터베이스 (pgvector 확장 포함, 내부 네트워크만)
  postgres:
    image: pgvector/pgvector:pg15
    container_name: dearme-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI 백엔드 (4 워커)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: dearme-backend
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - FRONTEND_URL=${FRONTEND_URL:-https://dearme.shoneylife.com}
    networks:
      - internal
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Nginx 리버스 프록시 + 정적 파일 서빙
  nginx:
    image: nginx:alpine
    container_name: dearme-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - frontend_build:/usr/share/nginx/html:ro
    networks:
      - internal
    depends_on:
      - backend
      - frontend-builder
    restart: unless-stopped

  # 프론트엔드 빌드 (one-shot)
  frontend-builder:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    container_name: dearme-frontend-builder
    volumes:
      - frontend_build:/app/dist

  # Cloudflare Tunnel (HTTPS)
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: dearme-cloudflared
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - internal
    depends_on:
      - nginx
    restart: unless-stopped

networks:
  internal:
    driver: bridge

volumes:
  postgres_data:
  frontend_build:
```

---

## Dockerfile 설정

### Backend Dockerfile (개발용)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 개발 서버 실행 (--reload 활성화)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Backend Dockerfile (프로덕션용)

```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# 프로덕션: 4 워커, reload 없음
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Frontend Dockerfile (개발용)

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

EXPOSE 5173

# Vite 개발 서버
CMD ["npm", "run", "dev", "--", "--host"]
```

### Frontend Dockerfile (프로덕션용 - Multi-stage)

```dockerfile
# frontend/Dockerfile.prod
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# 빌드된 파일을 Nginx로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Nginx 설정

### nginx/nginx.conf

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

### nginx/conf.d/default.conf

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name localhost;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API 프록시
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 지원
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 타임아웃 (AI 응답 대기)
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # 스트리밍 지원
        proxy_buffering off;
    }

    # API 문서
    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 헬스 체크
    location /health {
        proxy_pass http://backend/health;
    }

    # React SPA
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 개발 환경 명령어

### 시작

```bash
# 전체 서비스 시작
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build

# 특정 서비스만 시작
docker-compose up backend postgres
```

### 로그 확인

```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
```

### DB 마이그레이션

```bash
# pgvector 확장 활성화 (최초 1회)
docker-compose exec postgres psql -U dearme -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 마이그레이션 생성
docker-compose exec backend alembic revision --autogenerate -m "Add diaries table"

# 마이그레이션 적용
docker-compose exec backend alembic upgrade head

# 마이그레이션 롤백
docker-compose exec backend alembic downgrade -1
```

### RAG 임베딩 관리

```bash
# 기존 일기 임베딩 생성 (최초 1회)
docker-compose exec backend python -m scripts.embed_diaries

# 모든 일기 임베딩 강제 재생성
docker-compose exec backend python -m scripts.embed_diaries --force

# 특정 사용자의 일기만 임베딩
docker-compose exec backend python -m scripts.embed_diaries --user-id 1
```

### 테스트

```bash
# 백엔드 테스트
docker-compose exec backend pytest

# 특정 테스트 파일
docker-compose exec backend pytest tests/test_diary.py -v
```

### 종료

```bash
# 종료 (볼륨 유지)
docker-compose down

# 종료 + 볼륨 삭제
docker-compose down -v
```

---

## 프로덕션 배포

### ⚠️ 배포 전 필수 체크리스트

**중요: 배포 시 반드시 프론트엔드 버전을 업데이트해야 합니다!**

#### 1. 버전 업데이트 (필수)

```bash
# frontend/src/lib/version.ts 파일 수정
vim frontend/src/lib/version.ts

# APP_VERSION 업데이트
export const APP_VERSION = '1.0.1'  # 이전 버전에서 증가
```

**왜 필요한가?**
- 배포 후 기존 사용자의 localStorage에 저장된 토큰/상태가 새 코드와 충돌 방지
- 버전 변경 시 앱이 자동으로 localStorage를 초기화하여 깨끗한 상태로 시작
- 무한 리로드, 401 에러 루프 등의 문제를 사전에 방지

#### 2. 버전 관리 규칙

```
Semantic Versioning: major.minor.patch

- major: 대규모 변경 (API 구조 변경, 전체 리팩토링)
  예: 1.5.3 -> 2.0.0

- minor: 새 기능 추가, 중간 규모 변경
  예: 1.5.3 -> 1.6.0

- patch: 버그 수정, 작은 개선
  예: 1.5.3 -> 1.5.4
```

#### 3. 배포 전 테스트

```bash
# 타입 체크
cd frontend && npx tsc --noEmit

# 백엔드 테스트
docker-compose exec backend pytest

# 빌드 테스트 (로컬)
docker-compose -f docker-compose.prod.yml build
```

---

### 프로덕션 배포 전체 절차

#### Step 1: 환경 설정

```bash
# 환경 파일 준비
cp .env.example .env.production

# .env.production 편집
vim .env.production

# 필수 환경 변수:
# - DB_USER, DB_PASSWORD, DB_NAME
# - SECRET_KEY (강력한 랜덤 문자열)
# - OPENAI_API_KEY
# - SMTP_USER (Gmail 주소)
# - SMTP_PASSWORD (Gmail 앱 비밀번호)
# - FRONTEND_URL (프론트엔드 URL, 이메일 링크용)
# - CLOUDFLARE_TUNNEL_TOKEN (옵션)
```

#### Step 2: 버전 업데이트 및 커밋

```bash
# 1. 버전 업데이트
vim frontend/src/lib/version.ts
# APP_VERSION을 증가 (예: 1.0.0 -> 1.0.1)

# 2. 변경사항 스테이징
git add .

# 3. 변경사항 커밋
git commit -m "chore: 버전 1.0.1로 업데이트 및 배포 준비"

# 4. (옵션) 원격 저장소에 푸시
git push origin master
```

#### Step 3: 프로덕션 빌드 및 배포

```bash
# 전체 서비스 빌드 및 실행
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# 컨테이너 준비 대기 (약 15초)
sleep 15

# pgvector 확장 활성화 (최초 1회만 필요)
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -c "CREATE EXTENSION IF NOT EXISTS vector;"

# DB 마이그레이션 적용
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# 일기 임베딩 생성 (최초 1회 또는 필요 시)
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.embed_diaries

# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

#### Step 4: 배포 확인

```bash
# 전체 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 백엔드만 확인
docker-compose -f docker-compose.prod.yml logs -f backend

# 프론트엔드만 확인
docker-compose -f docker-compose.prod.yml logs -f frontend

# 헬스 체크
curl http://localhost:8001/health
curl http://localhost:8080
```

---

### 배포 후 자동 처리 과정

사용자가 배포 후 처음 접속하면:

1. ✅ 앱이 버전 체크 실행 (`initVersion()`)
2. ✅ 버전 변경 감지 → localStorage 자동 초기화
3. ✅ 로그인 페이지로 자동 리다이렉트
4. ✅ 사용자 재로그인 → 정상 작동

**사용자는 수동으로 캐시를 지울 필요 없이 자동으로 깨끗한 상태로 시작!**

---

### 긴급 배포 (핫픽스)

버그 긴급 수정 시:

```bash
# 1. 버전 패치 업데이트 (예: 1.0.1 -> 1.0.2)
vim frontend/src/lib/version.ts

# 2. 변경사항 커밋
git add .
git commit -m "fix: 긴급 버그 수정 (v1.0.2)"

# 3. 프론트엔드만 재빌드 (빠른 배포)
docker-compose -f docker-compose.prod.yml up --build -d frontend

# 또는 백엔드만 재빌드
docker-compose -f docker-compose.prod.yml up --build -d backend

# 또는 전체 재빌드
docker-compose -f docker-compose.prod.yml up --build -d
```

---

### 배포 롤백

문제 발생 시 이전 버전으로 롤백:

```bash
# 1. Git 이력 확인
git log --oneline -5

# 2. 이전 커밋으로 되돌리기
git revert <commit-hash>

# 또는 하드 리셋 (주의!)
git reset --hard <commit-hash>

# 3. 재배포
docker-compose -f docker-compose.prod.yml up --build -d

# 4. 확인
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

### 컨테이너 관리

#### 재시작

```bash
# 전체 재시작
docker-compose -f docker-compose.prod.yml restart

# 특정 서비스만 재시작
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

#### 중지 및 제거

```bash
# 컨테이너 중지 (볼륨 유지)
docker-compose -f docker-compose.prod.yml stop

# 컨테이너 중지 및 제거 (볼륨 유지)
docker-compose -f docker-compose.prod.yml down

# 볼륨까지 제거 (⚠️ 데이터 삭제 주의!)
docker-compose -f docker-compose.prod.yml down -v
```

#### 로그 관리

```bash
# 로그 실시간 확인
docker-compose -f docker-compose.prod.yml logs -f

# 마지막 100줄만 확인
docker-compose -f docker-compose.prod.yml logs --tail=100

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend

# 로그 파일 크기 확인
docker inspect --format='{{.LogPath}}' dearme-prod-backend
```

---

### 배포 트러블슈팅

#### 문제 1: 무한 리로드 발생

**증상**: 사용자가 로그인 후 페이지가 계속 새로고침됨

**원인**:
- 버전 업데이트를 깜빡했거나
- localStorage와 새 코드 간 충돌

**해결**:
```bash
# 1. 현재 버전 확인
cat frontend/src/lib/version.ts

# 2. 버전이 이전과 동일하면 업데이트
vim frontend/src/lib/version.ts  # 버전 증가

# 3. 재배포
docker-compose -f docker-compose.prod.yml up --build -d frontend

# 4. 사용자에게 브라우저 새로고침 요청
```

**브라우저 측 임시 해결 (사용자 안내용)**:
1. 개발자 도구 → Application → Local Storage → 전체 삭제
2. 페이지 새로고침 → 재로그인

---

#### 문제 2: 401 Unauthorized 에러

**증상**: API 요청마다 401 에러 발생

**원인**:
- 토큰 만료 또는 불일치
- 백엔드 SECRET_KEY 변경

**해결**:
```bash
# 1. 백엔드 로그 확인
docker-compose -f docker-compose.prod.yml logs backend | grep "401"

# 2. SECRET_KEY 확인
cat .env.production | grep SECRET_KEY

# 3. 토큰 관련 로그 확인
docker-compose -f docker-compose.prod.yml logs backend | grep "Auth"

# 4. 필요시 사용자 재로그인 유도
```

---

#### 문제 3: 스트리밍 응답 작동 안함

**증상**: 채팅 시 응답이 한 번에 나타남 (타이핑 효과 없음)

**원인**: Nginx 버퍼링 설정 문제

**확인**:
```bash
# 1. Nginx 설정 확인
docker-compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf

# 2. proxy_buffering off 설정 확인
# /api/ location에 다음 설정이 있어야 함:
# proxy_buffering off;
# proxy_cache off;
# chunked_transfer_encoding on;
```

**해결**:
```bash
# 1. nginx.conf 수정
vim frontend/nginx.conf

# 2. 프론트엔드 재빌드
docker-compose -f docker-compose.prod.yml up --build -d frontend
```

---

#### 문제 4: 컨테이너 시작 실패

**증상**: `docker-compose ps`에서 컨테이너가 Exit 상태

**원인**:
- 환경 변수 누락
- DB 연결 실패
- 포트 충돌

**해결**:
```bash
# 1. 컨테이너 로그 확인
docker-compose -f docker-compose.prod.yml logs <service-name>

# 2. 환경 변수 확인
docker-compose -f docker-compose.prod.yml config

# 3. 포트 사용 확인
lsof -i :8080  # 프론트엔드
lsof -i :8001  # 백엔드
lsof -i :5433  # PostgreSQL

# 4. DB 연결 테스트
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME}

# 5. 컨테이너 재생성
docker-compose -f docker-compose.prod.yml up -d --force-recreate <service-name>
```

---

#### 문제 5: 디스크 공간 부족

**증상**: 빌드 실패 또는 "No space left on device" 에러

**원인**: Docker 이미지/컨테이너/볼륨 누적

**해결**:
```bash
# 1. 디스크 사용량 확인
docker system df

# 2. 사용하지 않는 이미지 제거
docker image prune -a

# 3. 사용하지 않는 컨테이너 제거
docker container prune

# 4. 사용하지 않는 볼륨 제거 (⚠️ 주의)
docker volume prune

# 5. 전체 클린업 (⚠️ 주의)
docker system prune -a --volumes

# 6. 빌드 캐시 확인
docker builder prune
```

---

### Cloudflare Tunnel 설정

#### 초기 설정

1. Cloudflare 대시보드에서 Zero Trust > Tunnels 접속
2. 새 터널 생성
3. 터널 토큰을 `.env.production`의 `CLOUDFLARE_TUNNEL_TOKEN`에 설정
4. Public hostname 설정:
   - Subdomain: `dearme` (또는 원하는 이름)
   - Domain: 등록된 도메인
   - Service: `http://frontend:80`

#### 터널 상태 확인

```bash
# 터널 컨테이너 로그 확인
docker-compose -f docker-compose.prod.yml logs -f cloudflared

# 터널 상태 확인
docker-compose -f docker-compose.prod.yml ps cloudflared
```

---

### 모니터링 및 성능

#### 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너만
docker stats dearme-prod-backend

# 디스크 사용량
docker system df
```

#### 성능 최적화

```bash
# 백엔드 워커 수 조정
# backend/Dockerfile.prod에서 --workers 값 변경
# 권장: CPU 코어 수 * 2 + 1

# 로그 로테이션 확인
# docker-compose.prod.yml의 logging 설정 확인
# max-size: 10m
# max-file: 3
```

---

## DEV vs PROD 비교

| 항목 | DEV | PROD |
|------|-----|------|
| **Compose 파일** | docker-compose.yml | docker-compose.prod.yml |
| **환경 파일** | .env | .env.production |
| **DB 접근성** | 5432 외부 노출 | 내부 네트워크만 |
| **백엔드 워커** | 1개 (--reload) | 4개 |
| **프론트엔드** | Vite dev server | Nginx + 빌드 파일 |
| **HTTPS** | 없음 | Cloudflare Tunnel |
| **로깅** | 콘솔 | JSON 파일 |
| **자동 재시작** | 없음 | unless-stopped |
| **코드 변경 반영** | 즉시 | 재빌드 필요 |
