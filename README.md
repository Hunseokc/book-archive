# book-archive

읽은 책의 문장을 카드로 모아두는 개인용 웹앱. iPhone "홈 화면에 추가"로 앱처럼 쓰고,
iOS 라이브 텍스트(텍스트 스캔)로 책 문장을 바로 카드로 담는다.

## 구성

| 경로 | 내용 |
|---|---|
| `server/` | Kotlin · Spring Boot 3 · JPA · Flyway. JWT 인증, 포트 8000 |
| `frontend/` | React · Vite · Tailwind. PWA. 운영 시 nginx 가 `/api` 를 server 로 프록시 |
| `db/legacy/` | 예전 SQLite 데이터 → Postgres 시드 변환 (수동 실행용) |
| `docker-compose.yml` | 로컬 실행: Postgres · server · frontend |

주요 기능
- 책 검색(Google Books)·등록, 상태 관리, 카드 작성·하이라이트, 완독 후 모아보기
- **빠른 캡처**: 지금 읽는 책에 텍스트 스캔/클립보드로 바로 카드 저장, 줄바꿈 정리, 페이지 기억
- **iOS 단축어 연동**(설정에서 켜기): `POST /api/quick-cards` 를 사용자별 토큰으로 호출 → 뒷면 탭으로 카드 생성
- **로그인**: 이메일·비밀번호 + HS256 JWT. 첫 가입자만 자동 허용(`SIGNUP_ENABLED`), 이후 Supabase OAuth 로 교체 가능하게 설계
  (`sub` = 사용자 UUID, 처음 보는 `sub` 는 자동 등록)

## 로컬 실행

```bash
cp .env.example .env          # JWT_SECRET 채우기: openssl rand -base64 48
docker compose up -d --build
```

- 웹: http://localhost:8080 · API: http://localhost:8000 · DB: localhost:5433 (book/book)
- 프론트 개발 서버: `cd frontend && npm install && npm run dev` (5173, `/api` → 8000 프록시)
- 스키마는 서버 기동 시 Flyway(`server/src/main/resources/db/migration`)가 적용한다.

## 배포 (Google Cloud Run + Supabase Postgres)

- 리전 `asia-northeast3`, 서비스 `book-archive-server` / `book-archive-web`, 이미지는 Artifact Registry `book-archive`
- 비밀 값은 Secret Manager: `SUPABASE_PW`, `JWT_SECRET`, `GOOGLE_BOOKS_API_KEY`
- DB 는 Supabase **Session pooler**(5432, IPv4)로 접속. 연결 최소화: `DB_POOL_MAX=2`, Cloud Run 최대 1 인스턴스
- 새 Supabase DB 첫 배포 시에는 `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`, `SPRING_FLYWAY_BASELINE_VERSION=0`
  (Supabase 기본 객체 때문에 public 스키마가 비어있지 않은 것으로 판단되므로)
- V3 마이그레이션이 Supabase Data API(anon/authenticated)에서 모든 테이블을 막는다 — 서버만 DB 에 접근

```bash
REG=asia-northeast3-docker.pkg.dev/<project>/book-archive; TAG=$(date +%Y%m%d-%H%M%S)
docker build -t $REG/server:$TAG ./server && docker push $REG/server:$TAG
docker build -t $REG/web:$TAG ./frontend && docker push $REG/web:$TAG
gcloud run deploy book-archive-server --image $REG/server:$TAG --region asia-northeast3 --project <project>
gcloud run deploy book-archive-web    --image $REG/web:$TAG    --region asia-northeast3 --project <project>
```

(최초 배포 시 포트·시크릿·환경변수 지정은 서비스에 저장돼 있어 이후에는 이미지만 바꾸면 된다.)
