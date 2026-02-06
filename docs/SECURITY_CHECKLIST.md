# DearMe 보안 체크리스트

이 문서는 프로덕션 배포 전 필수 보안 조치 사항을 정리합니다.

## API 키 및 비밀번호 재발급 (필수)

### 1. OpenAI API 키 재발급
```bash
# 1. OpenAI 대시보드 접속
#    https://platform.openai.com/api-keys

# 2. 기존 키 삭제 후 새 키 생성

# 3. .env.production 파일 업데이트
OPENAI_API_KEY=sk-새로운키값
```

### 2. Cloudflare Tunnel 토큰 재발급
```bash
# 1. Cloudflare Zero Trust 대시보드 접속
#    https://one.dash.cloudflare.com/

# 2. Access > Tunnels > 해당 터널 선택

# 3. Configure > 토큰 재생성

# 4. .env.production 파일 업데이트
CLOUDFLARE_TUNNEL_TOKEN=새로운토큰값
```

### 3. 데이터베이스 비밀번호 강화
```bash
# 1. 강력한 비밀번호 생성 (최소 20자, 특수문자 포함)
openssl rand -base64 32

# 2. .env.production 파일 업데이트
DATABASE_URL=postgresql://dearme:새로운비밀번호@postgres:5432/dearme
POSTGRES_PASSWORD=새로운비밀번호

# 3. PostgreSQL 컨테이너에서 비밀번호 변경
docker-compose -f docker-compose.prod.yml exec postgres psql -U dearme -c "ALTER USER dearme PASSWORD '새로운비밀번호';"
```

### 4. JWT Secret Key 강화
```bash
# 1. 강력한 시크릿 키 생성
openssl rand -hex 64

# 2. .env.production 파일 업데이트
SECRET_KEY=생성된시크릿키
```

## Git 히스토리에서 민감정보 제거 (선택)

Git 히스토리에 민감정보가 남아있다면 BFG Repo Cleaner를 사용하여 제거합니다.

```bash
# 1. BFG 설치
brew install bfg

# 2. 민감정보가 포함된 파일 목록 생성
echo ".env.production" > files-to-remove.txt

# 3. 히스토리 클리닝 (주의: 모든 브랜치에 영향)
bfg --delete-files .env.production

# 4. 강제 가비지 컬렉션
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 5. 강제 푸시 (협업 중이라면 팀원에게 알림)
git push --force
```

## 환경변수 파일 보안

### .env.production 파일 권한 설정
```bash
chmod 600 .env.production
```

### .gitignore 확인
`.gitignore`에 다음 항목이 포함되어 있는지 확인:
```
.env
.env.local
.env.*.local
.env.production
```

## 완료 후 체크리스트

- [ ] OpenAI API 키 재발급 완료
- [ ] Cloudflare Tunnel 토큰 재발급 완료
- [ ] DB 비밀번호 강화 완료
- [ ] JWT Secret Key 강화 완료
- [ ] .env.production 파일 권한 설정 완료
- [ ] (선택) Git 히스토리 클리닝 완료
