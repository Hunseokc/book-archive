package com.bookarchive.service

import com.bookarchive.domain.Book
import com.bookarchive.domain.BookRepository
import com.bookarchive.domain.BookStatus
import com.bookarchive.domain.UserSettings
import com.bookarchive.domain.UserSettingsRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.Base64
import java.util.UUID

@Service
class SettingsService(
    private val settings: UserSettingsRepository,
    private val books: BookRepository,
) {
    private val random = SecureRandom()

    fun get(userId: UUID): UserSettings =
        settings.findByIdOrNull(userId) ?: settings.save(UserSettings(userId))

    fun findByQuickCardToken(token: String): UserSettings? = settings.findByQuickCardToken(token)

    fun save(value: UserSettings): UserSettings = settings.save(value)

    // 명시적으로 고른 책이 없으면 가장 최근에 등록한 '읽는 중' 책을 쓴다.
    fun currentBook(value: UserSettings): Book? =
        value.currentBookId?.let { books.findByIdAndUserId(it, value.userId) }
            ?: books.findFirstByUserIdAndStatusOrderByCreatedAtDesc(value.userId, BookStatus.READING)

    fun newToken(): String {
        val bytes = ByteArray(24).also(random::nextBytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}
