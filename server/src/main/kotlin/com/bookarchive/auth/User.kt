package com.bookarchive.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

@Entity
@Table(name = "users")
class User(
    // JWT 의 sub. 외부 IdP 사용자는 IdP 가 준 UUID 를 그대로 쓴다.
    @Id
    var id: UUID = UUID.randomUUID(),
    @Column(nullable = false, unique = true)
    var email: String,
    var passwordHash: String? = null,
    @Column(nullable = false)
    var provider: String = PROVIDER_LOCAL,
    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(ZoneOffset.UTC),
) {
    companion object {
        const val PROVIDER_LOCAL = "local"
        const val PROVIDER_EXTERNAL = "external"
    }
}

interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?

    fun existsByEmail(email: String): Boolean
}

// 컨트롤러에서 현재 로그인한 사용자를 받는 타입 (CurrentUserArgumentResolver 가 채운다)
data class AuthUser(val id: UUID, val email: String)
