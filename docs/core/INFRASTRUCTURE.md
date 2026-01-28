# 인프라 및 Docker 설정 가이드

## Docker Compose 설정

### 개발 환경 (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:15
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
  # PostgreSQL 데이터베이스 (내부 네트워크만)
  postgres:
    image: postgres:15
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
# 마이그레이션 생성
docker-compose exec backend alembic revision --autogenerate -m "Add diaries table"

# 마이그레이션 적용
docker-compose exec backend alembic upgrade head

# 마이그레이션 롤백
docker-compose exec backend alembic downgrade -1
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

### 배포 명령어

```bash
# 환경 파일 설정
cp .env.example .env.production
# .env.production 편집

# 프로덕션 빌드 및 실행
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 종료
docker-compose -f docker-compose.prod.yml down
```

### Cloudflare Tunnel 설정

1. Cloudflare 대시보드에서 Zero Trust > Tunnels 접속
2. 새 터널 생성
3. 터널 토큰을 `.env.production`의 `CLOUDFLARE_TUNNEL_TOKEN`에 설정
4. Public hostname 설정:
   - Subdomain: `dearme` (또는 원하는 이름)
   - Domain: 등록된 도메인
   - Service: `http://nginx:80`

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
