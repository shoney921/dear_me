# Docker Build

Docker 환경에서 프로젝트를 빌드합니다.

## 실행할 작업

1. Docker Compose로 컨테이너를 빌드하고 실행합니다.
2. 빌드 완료 후 상태를 확인합니다.

## 명령어

```bash
cd /Volumes/shoney_SSD/dev/01_dear_me && docker-compose up --build -d
```

빌드 완료 후 컨테이너 상태를 확인합니다:

```bash
docker-compose ps
```

## 접속 URL

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs
