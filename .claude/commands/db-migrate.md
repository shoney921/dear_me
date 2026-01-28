# Database Migration

데이터베이스 마이그레이션을 실행합니다.

## 실행할 작업

Alembic을 사용하여 데이터베이스 마이그레이션을 적용합니다.

## 명령어

마이그레이션 적용:

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose exec backend alembic upgrade head
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
