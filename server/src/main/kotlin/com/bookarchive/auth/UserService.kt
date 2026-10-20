package com.bookarchive.auth

import com.bookarchive.domain.BookRepository
import com.bookarchive.web.ApiException
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class UserService(
    private val users: UserRepository,
    private val books: BookRepository,
    private val passwordEncoder: PasswordEncoder,
    private val props: AuthProperties,
) {
    @Transactional
    fun signup(rawEmail: String, password: String): User {
        val email = normalizeEmail(rawEmail)
        if (!email.matches(Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))) {
            throw ApiException(HttpStatus.BAD_REQUEST, "이메일 형식이 올바르지 않습니다.")
        }
        if (password.length < 8) {
            throw ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상이어야 합니다.")
        }

        val isFirstUser = users.count() == 0L
        if (!isFirstUser && !props.signupEnabled) {
            throw ApiException(HttpStatus.FORBIDDEN, "회원가입이 닫혀 있습니다.")
        }
        if (users.existsByEmail(email)) {
            throw ApiException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.")
        }

        // 아래 bulk update 가 FK 로 이 행을 참조하므로 바로 flush 한다.
        val user = users.saveAndFlush(User(email = email, passwordHash = passwordEncoder.encode(password)))
        // 로그인 도입 전에 쌓인 책·카드는 첫 가입자의 것으로 넘긴다.
        if (isFirstUser) books.claimUnowned(user.id)
        return user
    }

    fun login(rawEmail: String, password: String): User {
        val user = users.findByEmail(normalizeEmail(rawEmail))
        val hash = user?.passwordHash
        if (hash == null || !passwordEncoder.matches(password, hash)) {
            throw ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.")
        }
        return user
    }

    /**
     * 검증된 JWT 의 sub 로 사용자를 찾는다.
     * 처음 보는 sub 라면(= Supabase 등 외부 IdP 로 처음 로그인) 사용자를 자동 등록한다.
     */
    @Transactional
    fun resolve(jwt: Jwt): User {
        val id = runCatching { UUID.fromString(jwt.subject) }.getOrNull()
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.")
        return users.findByIdOrNull(id) ?: users.save(
            User(
                id = id,
                email = jwt.getClaimAsString("email")?.let(::normalizeEmail) ?: "$id@external",
                provider = User.PROVIDER_EXTERNAL,
            ),
        )
    }

    private fun normalizeEmail(email: String) = email.trim().lowercase()
}
