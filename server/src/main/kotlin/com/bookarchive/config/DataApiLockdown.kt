package com.bookarchive.config

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Flyway 이력 테이블도 Supabase Data API 에서 막는다 (V3 마이그레이션 참고).
 * 마이그레이션 안에서는 Flyway 자신과 잠금이 충돌하므로, Flyway 가 끝난 뒤 기동 시점에 처리한다.
 * 이미 적용돼 있으면 아무것도 하지 않아 매 기동마다 배타 잠금을 잡지 않는다.
 */
@Component
class DataApiLockdown(private val jdbc: JdbcTemplate) : ApplicationRunner {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        val rlsEnabled = jdbc.queryForObject(
            "select relrowsecurity from pg_class where oid = to_regclass('public.flyway_schema_history')",
            Boolean::class.java,
        ) ?: return

        if (!rlsEnabled) {
            jdbc.execute("ALTER TABLE public.flyway_schema_history ENABLE ROW LEVEL SECURITY")
            log.info("flyway_schema_history: RLS enabled")
        }

        for (role in listOf("anon", "authenticated")) {
            val hasPrivilege = jdbc.queryForObject(
                // 역할이 없으면 has_table_privilege 가 에러를 내므로 CASE 로 평가 순서를 보장한다.
                """
                select case when exists (select 1 from pg_roles where rolname = ?)
                       then has_table_privilege(?, 'public.flyway_schema_history', 'SELECT,INSERT,UPDATE,DELETE')
                       else false end
                """.trimIndent(),
                Boolean::class.java,
                role,
                role,
            ) ?: false
            if (hasPrivilege) {
                jdbc.execute("REVOKE ALL ON public.flyway_schema_history FROM $role")
                log.info("flyway_schema_history: revoked privileges from {}", role)
            }
        }
    }
}
