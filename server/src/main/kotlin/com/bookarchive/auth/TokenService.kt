package com.bookarchive.auth

import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Service
import java.time.Instant

data class IssuedToken(val value: String, val expiresIn: Long)

// 로컬 로그인용 액세스 토큰 발급. 클레임 구성(sub, email, role)은 Supabase 토큰과 맞춰둔다.
@Service
class TokenService(
    private val encoder: JwtEncoder,
    private val props: AuthProperties,
) {
    fun issue(user: User): IssuedToken {
        val now = Instant.now()
        val claims = JwtClaimsSet.builder()
            .issuer(props.issuer)
            .subject(user.id.toString())
            .issuedAt(now)
            .expiresAt(now.plus(props.tokenTtl))
            .claim("email", user.email)
            .claim("role", "authenticated")
            .build()
        val header = JwsHeader.with(MacAlgorithm.HS256).build()
        val token = encoder.encode(JwtEncoderParameters.from(header, claims)).tokenValue
        return IssuedToken(token, props.tokenTtl.seconds)
    }
}
