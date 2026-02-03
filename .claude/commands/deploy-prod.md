# Deploy Production

프로덕션 환경에서 프로젝트를 빌드하고 배포합니다.

## 실행할 작업

1. Docker Compose로 프로덕션 컨테이너를 빌드하고 실행
2. pgvector 확장 활성화 (RAG용)
3. 데이터베이스 마이그레이션 적용
4. 기존 일기 임베딩 생성 (RAG용, 최초 1회)
5. 컨테이너 상태 확인

## 명령어

### 1. 프로덕션 빌드 및 실행

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

### 2. 컨테이너가 준비될 때까지 대기 (약 15초)

```bash
sleep 15
```

### 3. pgvector 확장 활성화 (RAG 벡터 검색용)

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 4. 마이그레이션 적용

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. 기존 일기 임베딩 생성 (최초 1회 또는 RAG 업데이트 시)

```bash
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.embed_diaries
```

> **참고:** 임베딩 모델 최초 로드 시 다운로드가 필요하여 시간이 걸릴 수 있습니다.
> 이후 일기 작성/수정 시에는 자동으로 임베딩이 생성됩니다.

### 6. 상태 확인

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
