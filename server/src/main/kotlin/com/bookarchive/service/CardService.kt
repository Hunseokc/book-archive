package com.bookarchive.service

import com.bookarchive.domain.Card
import com.bookarchive.domain.CardRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CardService(private val cards: CardRepository) {
    // 호출 측에서 책 존재 여부를 확인한 뒤 호출한다.
    @Transactional
    fun create(bookId: Long, content: String, pageNumber: Int?): Card {
        val nextOrder = (cards.findMaxOrderIndex(bookId) ?: 0) + 1
        return cards.save(
            Card(
                bookId = bookId,
                originalText = content,
                content = content,
                pageNumber = pageNumber,
                orderIndex = nextOrder,
            ),
        )
    }
}
