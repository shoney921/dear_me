# 프로덕션 배포 체크리스트

> **빠른 참조 가이드** - 프로덕션 배포 시 필수 단계 및 체크리스트

## 📋 배포 전 체크리스트

### 1. ✅ 버전 업데이트 (필수!)

```bash
# frontend/src/lib/version.ts
export const APP_VERSION = '1.0.1'  # ← 이전 버전에서 증가
```

- [ ] 버전 번호 업데이트 완료
- [ ] 버전 규칙 확인 (major.minor.patch)
  - `patch`: 버그 수정 (1.0.0 → 1.0.1)
  - `minor`: 새 기능 추가 (1.0.0 → 1.1.0)
  - `major`: 대규모 변경 (1.0.0 → 2.0.0)

### 2. ✅ 코드 품질 검증

```bash
# 타입 체크
cd frontend && npx tsc --noEmit

# 테스트 실행
docker-compose exec backend pytest
```

- [ ] TypeScript 타입 에러 없음
- [ ] 테스트 전체 통과
- [ ] 빌드 에러 없음

### 3. ✅ 환경 설정 확인

```bash
# .env.production 파일 확인
cat .env.production
```

- [ ] `DB_USER`, `DB_PASSWORD`, `DB_NAME` 설정됨
- [ ] `SECRET_KEY` 강력한 랜덤 문자열로 설정
- [ ] `OPENAI_API_KEY` 설정됨
- [ ] `CLOUDFLARE_TUNNEL_TOKEN` 설정됨 (옵션)

### 4. ✅ Git 커밋

```bash
git add .
git commit -m "chore: 버전 1.0.1로 업데이트"
git push origin master  # 옵션
```

- [ ] 변경사항 커밋 완료
- [ ] 원격 저장소 푸시 완료 (옵션)

---

## 🚀 배포 실행

### Step 1: 빌드 및 시작

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

**예상 소요 시간**: 3-5분 (첫 빌드 시 더 오래 걸릴 수 있음)

### Step 2: 컨테이너 준비 대기

```bash
sleep 15
```

### Step 3: DB 설정

```bash
# pgvector 확장 활성화 (최초 1회)
docker-compose -f docker-compose.prod.yml exec postgres psql -U dearme -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 마이그레이션 적용
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 4: RAG 임베딩 생성 (최초 1회 또는 필요 시)

```bash
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.embed_diaries
```

**예상 소요 시간**: 임베딩 모델 다운로드 포함 약 30초

---

## ✔️ 배포 확인

### 1. 컨테이너 상태 확인

```bash
docker-compose -f docker-compose.prod.yml ps
```

**예상 출력**:
```
NAME                      STATUS
dearme-prod-backend       Up X seconds
dearme-prod-frontend      Up X seconds
dearme-prod-postgres      Up X minutes (healthy)
dearme-prod-cloudflared   Up X seconds
```

- [ ] 모든 컨테이너 `Up` 상태
- [ ] postgres가 `healthy` 상태

### 2. 로그 확인

```bash
# 전체 로그
docker-compose -f docker-compose.prod.yml logs --tail=50

# 에러 확인
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

- [ ] 치명적인 에러 없음
- [ ] 백엔드 정상 시작 로그 확인
- [ ] 프론트엔드 정상 서빙 확인

### 3. 접속 테스트

```bash
# 헬스 체크
curl http://localhost:8001/health

# 프론트엔드 접속
curl http://localhost:8080
```

**접속 URL**:
- 프론트엔드: http://localhost:8080
- 백엔드 API: http://localhost:8001
- API 문서: http://localhost:8001/docs

- [ ] 백엔드 헬스 체크 응답 정상
- [ ] 프론트엔드 페이지 로드 정상
- [ ] 로그인 기능 정상 작동
- [ ] API 요청 정상 응답

### 4. 기능 테스트

- [ ] 회원가입/로그인 정상 작동
- [ ] 일기 작성 정상 작동
- [ ] 페르소나 대화 정상 작동 (스트리밍 포함)
- [ ] 친구 기능 정상 작동

---

## 🔧 긴급 대응 (문제 발생 시)

### 무한 리로드 발생

```bash
# 버전 확인
cat frontend/src/lib/version.ts

# 버전 증가
vim frontend/src/lib/version.ts

# 프론트엔드만 재배포
docker-compose -f docker-compose.prod.yml up --build -d frontend
```

### 401 Unauthorized 에러

```bash
# 백엔드 로그 확인
docker-compose -f docker-compose.prod.yml logs backend | grep "401"

# SECRET_KEY 확인
cat .env.production | grep SECRET_KEY

# 필요시 재시작
docker-compose -f docker-compose.prod.yml restart backend
```

### 스트리밍 작동 안함

```bash
# Nginx 설정 확인
docker-compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf | grep buffering

# proxy_buffering off 설정 확인 후 재배포
docker-compose -f docker-compose.prod.yml up --build -d frontend
```

### 컨테이너 시작 실패

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs <service-name>

# 강제 재생성
docker-compose -f docker-compose.prod.yml up -d --force-recreate <service-name>
```

---

## 🔄 배포 롤백

문제 해결 불가 시 이전 버전으로 롤백:

```bash
# 1. Git 로그 확인
git log --oneline -5

# 2. 이전 커밋으로 되돌리기
git revert <commit-hash>

# 3. 재배포
docker-compose -f docker-compose.prod.yml up --build -d

# 4. 확인
docker-compose -f docker-compose.prod.yml ps
```

---

## 📊 배포 후 모니터링

### 리소스 모니터링

```bash
# 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
docker system df
```

### 로그 모니터링

```bash
# 실시간 로그
docker-compose -f docker-compose.prod.yml logs -f

# 에러 로그만
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

### 성능 체크

- [ ] 페이지 로딩 속도 정상
- [ ] API 응답 시간 정상 (< 1초)
- [ ] 채팅 스트리밍 정상 작동
- [ ] CPU/메모리 사용률 정상 범위

---

## 📝 배포 기록

배포할 때마다 기록을 남기세요:

```
날짜: 2026-02-04
버전: 1.0.1
배포자: shoney
변경사항:
  - 페르소나 채팅 스트리밍 기능 추가
  - 토큰 인증 문제 수정
  - Optimistic UI 업데이트 구현
문제사항: 없음
다운타임: 없음 (배포 중 서비스 중단 없음)
```

---

## 🔗 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 전체 개발 가이드
- [INFRASTRUCTURE.md](./core/INFRASTRUCTURE.md) - 인프라 상세 가이드
- [version.ts](../frontend/src/lib/version.ts) - 버전 관리 파일

---

## 💡 팁

1. **배포는 항상 버전 업데이트와 함께!**
   - 버전을 업데이트하지 않으면 사용자가 무한 리로드를 경험할 수 있습니다.

2. **작은 단위로 자주 배포**
   - 큰 변경사항을 한 번에 배포하면 롤백이 어렵습니다.
   - 작은 기능 단위로 배포하여 문제를 빠르게 파악하세요.

3. **배포 시간 고려**
   - 사용자가 적은 시간대에 배포 (새벽 또는 점심시간)
   - 긴급 배포가 아니면 금요일 저녁은 피하세요.

4. **로그 모니터링**
   - 배포 후 최소 10분간 로그를 모니터링하세요.
   - 에러가 없는지 확인하세요.

5. **백업**
   - 중요한 변경사항 배포 전 DB 백업을 고려하세요.
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U dearme dearme > backup_$(date +%Y%m%d).sql
   ```

---

## ⚠️ 주의사항

1. **절대로 프로덕션 DB를 직접 수정하지 마세요**
   - 항상 마이그레이션을 통해 스키마를 변경하세요.

2. **SECRET_KEY를 변경하면 모든 사용자가 로그아웃됩니다**
   - 토큰 재발급이 필요하므로 신중하게 결정하세요.

3. **볼륨 삭제는 신중하게**
   - `docker-compose down -v`는 모든 데이터를 삭제합니다!
   - 프로덕션에서는 절대 사용하지 마세요.

4. **버전 롤백 시 DB 마이그레이션도 고려**
   - 코드만 롤백하면 스키마 불일치가 발생할 수 있습니다.
