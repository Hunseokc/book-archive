package com.bookarchive.web

import com.bookarchive.auth.AuthUser
import com.bookarchive.domain.BookRepository
import com.bookarchive.domain.Card
import com.bookarchive.domain.CardRepository
import com.bookarchive.domain.Highlight
import com.bookarchive.service.CardService
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class CardController(
    private val books: BookRepository,
    private val cards: CardRepository,
    private val cardService: CardService,
    private val objectMapper: ObjectMapper,
) {
    @PostMapping("/books/{bookId}/cards")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(user: AuthUser, @PathVariable bookId: Long, @RequestBody payload: CardCreate): CardOut {
        requireBook(user, bookId)
        return CardOut.of(cardService.create(bookId, payload.content, payload.pageNumber))
    }

    @GetMapping("/books/{bookId}/cards")
    fun list(user: AuthUser, @PathVariable bookId: Long): List<CardOut> {
        requireBook(user, bookId)
        return cards.findAllByBookIdOrderByOrderIndex(bookId).map(CardOut::of)
    }

    // 부분 수정: 요청 본문에 "포함된" 필드만 반영한다. (null 을 명시하면 null 로 지움)
    @PatchMapping("/cards/{cardId}")
    fun update(user: AuthUser, @PathVariable cardId: Long, @RequestBody payload: JsonNode): CardOut {
        val card = findCard(user, cardId)
        payload.field("content")?.let { card.content = it.asTextOrNull() ?: "" }
        payload.field("highlights")?.let {
            card.highlights = if (it.isNull) null else objectMapper.convertValue<List<Highlight>>(it)
        }
        payload.field("page_number")?.let { card.pageNumber = if (it.isNull) null else it.requireInt() }
        payload.field("order_index")?.let { card.orderIndex = it.requireInt() }
        return CardOut.of(cards.saveAndFlush(card))
    }

    @DeleteMapping("/cards/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(user: AuthUser, @PathVariable cardId: Long) {
        cards.delete(findCard(user, cardId))
    }

    private fun requireBook(user: AuthUser, bookId: Long) {
        if (!books.existsByIdAndUserId(bookId, user.id)) {
            throw ApiException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다.")
        }
    }

    private fun findCard(user: AuthUser, cardId: Long): Card =
        cards.findOwned(cardId, user.id) ?: throw ApiException(HttpStatus.NOT_FOUND, "카드를 찾을 수 없습니다.")

    private fun JsonNode.field(name: String): JsonNode? = if (has(name)) get(name) else null

    private fun JsonNode.asTextOrNull(): String? = if (isNull) null else asText()

    private fun JsonNode.requireInt(): Int {
        require(isInt) { "정수가 필요합니다." }
        return intValue()
    }
}
