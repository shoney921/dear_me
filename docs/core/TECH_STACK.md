# 기술 스택 및 의존성

## Backend (Python/FastAPI)

### requirements.txt

```txt
# Web Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Authentication
python-jose[cryptography]==3.3.0
bcrypt==4.1.2

# Data Validation
pydantic==2.12.5
pydantic-settings==2.1.0
python-dotenv==1.0.0

# AI/LLM
openai==1.109.1
langchain==0.3.0
langchain-openai==0.2.0
langchain-core==0.3.0

# RAG / Vector Search
pgvector==0.2.4
sentence-transformers==2.2.2
torch==2.1.2

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### 핵심 라이브러리 설명

| 패키지 | 버전 | 용도 |
|--------|------|------|
| fastapi | 0.104.1 | 비동기 웹 프레임워크 |
| uvicorn | 0.24.0 | ASGI 서버 |
| sqlalchemy | 2.0.23 | ORM (Object-Relational Mapping) |
| psycopg2-binary | 2.9.9 | PostgreSQL 드라이버 |
| alembic | 1.12.1 | DB 마이그레이션 도구 |
| python-jose | 3.3.0 | JWT 토큰 생성/검증 |
| bcrypt | 4.1.2 | 비밀번호 해싱 |
| pydantic | 2.12.5 | 데이터 검증 및 직렬화 |
| openai | 1.109.1 | OpenAI API 클라이언트 |
| langchain | 0.3.0 | LLM 통합 프레임워크 |
| pgvector | 0.2.4 | PostgreSQL 벡터 검색 확장 |
| sentence-transformers | 2.2.2 | 한국어 임베딩 모델 (RAG) |
| torch | 2.1.2 | 딥러닝 프레임워크 |

---

## Frontend (React/TypeScript)

### package.json dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.2",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "lucide-react": "^0.562.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "react-calendar": "^4.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.53.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

### 핵심 라이브러리 설명

| 패키지 | 버전 | 용도 |
|--------|------|------|
| react | 18.2.0 | UI 프레임워크 |
| react-router-dom | 6.20.0 | 클라이언트 사이드 라우팅 |
| @tanstack/react-query | 5.12.2 | 서버 상태 관리, 데이터 페칭/캐싱 |
| zustand | 4.4.7 | 클라이언트 상태 관리 |
| axios | 1.6.2 | HTTP 클라이언트 |
| lucide-react | 0.562.0 | 아이콘 라이브러리 |
| react-markdown | 9.0.1 | Markdown 렌더링 |
| react-calendar | 4.8.0 | 캘린더 컴포넌트 |
| typescript | 5.2.2 | 타입 안정성 |
| vite | 5.0.0 | 빌드 도구 (HMR 지원) |
| tailwindcss | 3.3.5 | 유틸리티 CSS 프레임워크 |

---

## Infrastructure

### Docker 이미지

| 서비스 | 이미지 | 용도 |
|--------|--------|------|
| PostgreSQL | pgvector/pgvector:pg15 | 데이터베이스 (벡터 검색 지원) |
| Backend | python:3.11-slim | FastAPI 서버 |
| Frontend (DEV) | node:20-alpine | Vite 개발 서버 |
| Frontend (PROD) | nginx:alpine | 정적 파일 서빙 |
| Nginx | nginx:alpine | 리버스 프록시 |
| Cloudflare Tunnel | cloudflare/cloudflared:latest | HTTPS 터널 |

### 버전 요구사항

- **Python**: 3.11+
- **Node.js**: 20+
- **Docker**: 24+
- **Docker Compose**: 2.0+
- **PostgreSQL**: 15+

---

## 설정 파일 템플릿

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,  // Docker 환경 지원
    },
  },
})
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### alembic.ini (핵심 설정)

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql://%(DB_USER)s:%(DB_PASSWORD)s@postgres:5432/%(DB_NAME)s

[loggers]
keys = root,sqlalchemy,alembic

[logger_alembic]
level = INFO
handlers =
qualname = alembic
```

---

## 추천 VSCode 확장

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```
