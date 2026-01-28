# Deploy Local

Docker 환경에서 프로젝트를 빌드하고 마이그레이션까지 한 번에 실행합니다.

## 실행할 작업

1. Docker Compose로 컨테이너를 빌드하고 실행
2. 데이터베이스 마이그레이션 적용
3. 상태 확인

## 명령어

### 1. Docker 빌드 및 실행

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose up --build -d
```

### 2. 컨테이너가 준비될 때까지 대기 (약 10초)

```bash
sleep 10
```

### 3. 마이그레이션 적용

```bash
docker-compose exec backend alembic upgrade head
```

### 4. 상태 확인

```bash
docker-compose ps
```

## 접속 URL

빌드 완료 후 아래 URL로 접속할 수 있습니다:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

## 로그 확인

컨테이너 로그 확인:

```bash
docker-compose logs -f
```

백엔드 로그만 확인:

```bash
docker-compose logs -f backend
```
