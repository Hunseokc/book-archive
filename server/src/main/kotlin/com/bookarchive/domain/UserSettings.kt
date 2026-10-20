package com.bookarchive.domain

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

@Entity
@Table(name = "user_settings")
class UserSettings(
    @Id
    var userId: UUID,
    // 빠른 캡처·단축어 카드가 저장될 "지금 읽는 책"
    var currentBookId: Long? = null,
    // iOS 단축어 연동 (설정에서 켜야 /api/quick-cards 가 동작)
    var quickCardEnabled: Boolean = false,
    var quickCardToken: String? = null,
)

interface UserSettingsRepository : JpaRepository<UserSettings, UUID> {
    fun findByQuickCardToken(token: String): UserSettings?
}
