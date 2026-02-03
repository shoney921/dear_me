# Docker Build

Docker 환경에서 프로젝트를 빌드하고 마이그레이션을 적용합니다.

## 실행할 작업

1. Docker Compose로 컨테이너를 빌드하고 실행
2. pgvector 확장 활성화 (RAG용)
3. 데이터베이스 마이그레이션 적용
4. 기존 일기 임베딩 생성 (RAG용, 최초 1회)
5. 컨테이너 상태 확인

## 명령어

### 1. Docker 빌드 및 실행

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose up --build -d
```

### 2. 컨테이너가 준비될 때까지 대기 (약 15초)

```bash
sleep 15
```

### 3. pgvector 확장 활성화 (RAG 벡터 검색용)

```bash
docker-compose exec postgres psql -U dearme -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 4. 마이그레이션 적용

```bash
docker-compose exec backend alembic upgrade head
```

### 5. 기존 일기 임베딩 생성 (최초 1회)

```bash
docker-compose exec backend python -m scripts.embed_diaries
```

### 6. 상태 확인

```bash
docker-compose ps
```

## 접속 URL

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 로그 확인

```bash
docker-compose logs -f
```
