-- Supabase 는 public 스키마 테이블을 Data API(PostgREST)로 노출한다.
-- 이 앱은 API 를 쓰지 않고 서버가 직접 접속하므로, API 경로(anon / authenticated 역할)는 모두 막는다.
-- 서버는 테이블 소유자(postgres)로 접속하므로 RLS 의 영향을 받지 않는다.
--
-- flyway_schema_history 는 여기서 건드리면 안 된다: 마이그레이션 중 Flyway 의 다른 연결이
-- 그 테이블을 읽고 있어 ALTER 가 잠금을 기다리며 멈춘다. → DataApiLockdown 이 기동 후 처리.

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 로컬 Postgres 에는 Supabase 역할이 없으므로 있을 때만 권한을 회수한다.
DO $$
DECLARE
    r TEXT;
BEGIN
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('REVOKE ALL ON books, cards, users, user_settings FROM %I', r);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
        END IF;
    END LOOP;
END $$;
