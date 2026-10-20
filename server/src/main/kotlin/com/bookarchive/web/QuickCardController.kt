package com.bookarchive.web

import com.bookarchive.domain.Book
import com.bookarchive.service.CardService
import com.bookarchive.service.SettingsService
import com.fasterxml.jackson.databind.JsonNode
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

data class QuickCardStatus(val bookId: Long, val bookTitle: String, val message: String)

data class QuickCardOut(val message: String, val bookTitle: String, val card: CardOut)

/**
 * iOS 단축어 전용 엔드포인트. 설정에서 켠 경우에만 동작하며, JWT 대신 사용자별 단축어 토큰으로 인증한다.
 * "지금 읽는 책"에 카드를 추가하고, 단축어 알림에 바로 띄울 수 있는 message 를 돌려준다.
 */
@RestController
@RequestMapping("/api/quick-cards")
class QuickCardController(
    private val settingsService: SettingsService,
    private val cardService: CardService,
) {
    @GetMapping("/status")
    fun status(@RequestHeader(HttpHeaders.AUTHORIZATION, required = false) auth: String?): QuickCardStatus {
        val book = authorize(auth)
        return QuickCardStatus(book.id!!, book.title, "연결됨: 『${book.title}』에 카드가 저장됩니다.")
    }

    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createFromJson(
        @RequestHeader(HttpHeaders.AUTHORIZATION, required = false) auth: String?,
        @RequestBody payload: JsonNode,
    ): QuickCardOut {
        val pageNode = payload.get("page_number")
        // 단축어는 숫자를 문자열로 보내는 경우가 많아 둘 다 받는다.
        val pageNumber = when {
            pageNode == null || pageNode.isNull -> null
            pageNode.canConvertToInt() -> pageNode.intValue()
            else -> pageNode.asText().trim().toIntOrNull()
        }
        return create(auth, payload.path("content").asText(""), pageNumber)
    }

    @PostMapping(consumes = [MediaType.TEXT_PLAIN_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createFromText(
        @RequestHeader(HttpHeaders.AUTHORIZATION, required = false) auth: String?,
        @RequestBody content: String,
    ): QuickCardOut = create(auth, content, null)

    private fun create(auth: String?, rawContent: String, pageNumber: Int?): QuickCardOut {
        val book = authorize(auth)
        val content = joinOcrLines(rawContent)
        if (content.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "카드 내용이 비어 있습니다.")

        val card = cardService.create(book.id!!, content, pageNumber)
        return QuickCardOut(
            message = "『${book.title}』에 ${card.orderIndex}번째 카드를 추가했습니다.",
            bookTitle = book.title,
            card = CardOut.of(card),
        )
    }

    // 단축어 토큰으로 사용자를 찾는다. (토큰은 사용자별로 유일)
    private fun authorize(auth: String?): Book {
        val given = auth?.removePrefix("Bearer ")?.trim().orEmpty()
        val settings = given.takeIf { it.isNotEmpty() }?.let(settingsService::findByQuickCardToken)
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "단축어 토큰이 올바르지 않습니다.")
        if (!settings.quickCardEnabled) {
            throw ApiException(HttpStatus.FORBIDDEN, "단축어 연동이 꺼져 있습니다. 앱 설정에서 켜주세요.")
        }
        return settingsService.currentBook(settings)
            ?: throw ApiException(HttpStatus.CONFLICT, "지금 읽는 책이 없습니다. 앱에서 책을 선택해주세요.")
    }

    // 라이브 텍스트는 인쇄된 줄마다 줄바꿈을 넣으므로, 빈 줄(문단 구분)만 남기고 한 문단으로 합친다.
    // 프런트엔드 utils/text.js 의 joinLines 와 같은 규칙.
    private fun joinOcrLines(text: String): String =
        text.replace("\r\n", "\n")
            .split(Regex("\n\\s*\n"))
            .map { it.split("\n").joinToString(" ") { line -> line.trim() }.replace(Regex(" {2,}"), " ").trim() }
            .filter { it.isNotEmpty() }
            .joinToString("\n\n")
}
