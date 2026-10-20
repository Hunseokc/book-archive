package com.bookarchive.auth

import com.bookarchive.web.ErrorResponse
import com.fasterxml.jackson.databind.ObjectMapper
import com.nimbusds.jose.jwk.source.ImmutableSecret
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import java.time.Duration
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

@ConfigurationProperties("app.auth")
data class AuthProperties(
    val jwtSecret: String,
    val tokenTtl: Duration = Duration.ofDays(7),
    val signupEnabled: Boolean = false,
    val issuer: String = "book-archive",
)

/**
 * 모든 /api 요청은 Authorization: Bearer <JWT> 로 인증한다.
 *
 * 지금은 이 서버가 직접 발급한 HS256 토큰을 검증한다. Supabase 로 옮길 때는
 * - 레거시 JWT secret(HS256)을 쓰는 프로젝트: JWT_SECRET 만 Supabase 값으로 바꾸면 된다.
 * - 비대칭 키(JWKS) 프로젝트: jwtDecoder() 를 NimbusJwtDecoder.withJwkSetUri(...) 로 바꾼다.
 * 나머지(사용자 식별·자동 등록)는 JWT 의 sub / email 클레임만 쓰므로 그대로 동작한다.
 */
@Configuration
@EnableConfigurationProperties(AuthProperties::class)
class SecurityConfig(
    private val props: AuthProperties,
    private val objectMapper: ObjectMapper,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val unauthorized = AuthenticationEntryPoint { _, response, _ ->
            response.status = HttpStatus.UNAUTHORIZED.value()
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = Charsets.UTF_8.name()
            objectMapper.writeValue(response.writer, ErrorResponse("로그인이 필요합니다."))
        }

        http {
            csrf { disable() }
            cors { }
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }
            authorizeHttpRequests {
                authorize("/health", permitAll)
                authorize("/error", permitAll)
                authorize("/api/auth/signup", permitAll)
                authorize("/api/auth/login", permitAll)
                // 단축어는 JWT 대신 자체 토큰으로 인증한다 (QuickCardController)
                authorize("/api/quick-cards/**", permitAll)
                authorize(anyRequest, authenticated)
            }
            oauth2ResourceServer {
                jwt { }
                bearerTokenResolver = quickCardAwareTokenResolver()
                authenticationEntryPoint = unauthorized
            }
            exceptionHandling { authenticationEntryPoint = unauthorized }
        }
        return http.build()
    }

    // 단축어 토큰은 JWT 가 아니므로 해당 경로에서는 Bearer 값을 JWT 로 해석하지 않는다.
    private fun quickCardAwareTokenResolver(): BearerTokenResolver {
        val default = DefaultBearerTokenResolver()
        return BearerTokenResolver { request ->
            if (request.requestURI.startsWith("/api/quick-cards")) null else default.resolve(request)
        }
    }

    @Bean
    fun jwtDecoder(): JwtDecoder =
        NimbusJwtDecoder.withSecretKey(secretKey()).macAlgorithm(MacAlgorithm.HS256).build()

    @Bean
    fun jwtEncoder(): JwtEncoder = NimbusJwtEncoder(ImmutableSecret(secretKey()))

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    private fun secretKey(): SecretKey {
        val bytes = props.jwtSecret.toByteArray()
        require(bytes.size >= 32) { "JWT_SECRET 은 32바이트 이상이어야 합니다." }
        return SecretKeySpec(bytes, "HmacSHA256")
    }
}
