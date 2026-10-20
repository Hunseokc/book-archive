package com.bookarchive.web

import com.bookarchive.auth.AuthUser
import com.bookarchive.domain.BookRepository
import com.bookarchive.domain.UserSettings
import com.bookarchive.service.SettingsService
import com.fasterxml.jackson.databind.JsonNode
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class SettingsOut(
    // 실제로 카드가 저장될 책 (명시 선택이 없으면 '읽는 중' 책으로 대체된 값)
    val currentBookId: Long?,
    val quickCardEnabled: Boolean,
    val quickCardToken: String?,
)

@RestController
@RequestMapping("/api/settings")
class SettingsController(
    private val settingsService: SettingsService,
    private val books: BookRepository,
) {
    @GetMapping
    fun get(user: AuthUser): SettingsOut = toOut(settingsService.get(user.id))

    // 부분 수정: 본문에 포함된 필드만 반영한다.
    @PatchMapping
    fun update(user: AuthUser, @RequestBody payload: JsonNode): SettingsOut {
        val settings = settingsService.get(user.id)

        if (payload.has("current_book_id")) {
            val node = payload.get("current_book_id")
            settings.currentBookId = if (node.isNull) {
                null
            } else {
                require(node.canConvertToLong()) { "current_book_id 는 숫자여야 합니다." }
                node.longValue().also {
                    if (!books.existsByIdAndUserId(it, user.id)) {
                        throw ApiException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다.")
                    }
                }
            }
        }

        if (payload.has("quick_card_enabled")) {
            val node = payload.get("quick_card_enabled")
            require(node.isBoolean) { "quick_card_enabled 는 true/false 여야 합니다." }
            settings.quickCardEnabled = node.booleanValue()
            if (settings.quickCardEnabled && settings.quickCardToken == null) {
                settings.quickCardToken = settingsService.newToken()
            }
        }

        return toOut(settingsService.save(settings))
    }

    @PostMapping("/quick-card-token")
    fun regenerateToken(user: AuthUser): SettingsOut {
        val settings = settingsService.get(user.id)
        settings.quickCardToken = settingsService.newToken()
        return toOut(settingsService.save(settings))
    }

    private fun toOut(settings: UserSettings) = SettingsOut(
        currentBookId = settingsService.currentBook(settings)?.id,
        quickCardEnabled = settings.quickCardEnabled,
        quickCardToken = settings.quickCardToken,
    )
}
