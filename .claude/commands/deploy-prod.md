# Deploy Production

프로덕션 환경에서 프로젝트를 빌드하고 배포합니다.

## 실행할 작업

1. Docker Compose로 프로덕션 컨테이너를 빌드하고 실행
2. 데이터베이스 마이그레이션 적용
3. 컨테이너 상태 확인

## 명령어

### 1. 프로덕션 빌드 및 실행

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

### 2. 컨테이너가 준비될 때까지 대기 (약 10초)

```bash
sleep 10
```

### 3. 마이그레이션 적용

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 4. 상태 확인

```bash
docker-compose -f docker-compose.prod.yml ps
```

## 접속 URL

프로덕션 환경은 Cloudflare Tunnel을 통해 HTTPS로 접속합니다:

- Frontend: https://your-domain.com (또는 http://localhost:8080)
- Backend API: https://api.your-domain.com (또는 http://localhost:8001)

## 로그 확인

컨테이너 로그 확인:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

백엔드 로그만 확인:

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 컨테이너 중지

```bash
docker-compose -f docker-compose.prod.yml down
```
