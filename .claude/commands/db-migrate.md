# Database Migration

데이터베이스 마이그레이션을 실행합니다.

## 실행할 작업

Alembic을 사용하여 데이터베이스 마이그레이션을 적용합니다.

## 명령어

### pgvector 확장 활성화 (RAG용, 최초 1회)

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose exec postgres psql -U dearme -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 마이그레이션 적용

```bash
docker-compose exec backend alembic upgrade head
```

## 추가 명령어 (필요시)

마이그레이션 상태 확인:

```bash
docker-compose exec backend alembic current
```

마이그레이션 히스토리 확인:

```bash
docker-compose exec backend alembic history
```

마이그레이션 롤백 (1단계):

```bash
docker-compose exec backend alembic downgrade -1
```

새 마이그레이션 생성:

```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

## RAG 관련 명령어

기존 일기 임베딩 생성 (마이그레이션 후 최초 1회):

```bash
docker-compose exec backend python -m scripts.embed_diaries
```

특정 사용자의 일기만 임베딩:

```bash
docker-compose exec backend python -m scripts.embed_diaries --user-id 1
```

모든 일기 임베딩 강제 재생성:

```bash
docker-compose exec backend python -m scripts.embed_diaries --force
```
