-- 로그인 도입: 사용자 테이블, 책 소유자, 사용자별 설정

-- id 는 JWT 의 sub 와 같은 값. Supabase 를 붙이면 auth.users.id(UUID)가 그대로 들어온다.
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(320) NOT NULL UNIQUE,
    -- 로컬 로그인 사용자만 값이 있다. 외부(OAuth) 사용자는 NULL.
    password_hash VARCHAR(100),
    provider      VARCHAR(20)  NOT NULL DEFAULT 'local',
    created_at    TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- 기존 데이터는 소유자 없이(NULL) 남겨두고, 첫 가입자가 가져간다 (UserService.signup).
ALTER TABLE books ADD COLUMN user_id UUID REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX idx_books_user_created ON books (user_id, created_at DESC);

DROP TABLE app_settings;

CREATE TABLE user_settings (
    user_id            UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    current_book_id    BIGINT REFERENCES books (id) ON DELETE SET NULL,
    quick_card_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- 단축어 토큰으로 사용자를 찾으므로 유일해야 한다.
    quick_card_token   VARCHAR(64) UNIQUE
);
