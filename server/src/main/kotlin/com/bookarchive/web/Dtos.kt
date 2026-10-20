package com.bookarchive.web

import com.bookarchive.domain.Book
import com.bookarchive.domain.BookStatus
import com.bookarchive.domain.Card
import com.bookarchive.domain.Highlight
import java.time.LocalDateTime

data class BookSearchResult(
    val title: String,
    val author: String? = null,
    val publisher: String? = null,
    val isbn: String? = null,
    val coverUrl: String? = null,
    val description: String? = null,
)

data class BookCreate(
    val title: String,
    val author: String? = null,
    val publisher: String? = null,
    val isbn: String? = null,
    val coverUrl: String? = null,
    val description: String? = null,
)

data class BookOut(
    val id: Long,
    val title: String,
    val author: String?,
    val publisher: String?,
    val isbn: String?,
    val coverUrl: String?,
    val description: String?,
    val status: BookStatus,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun of(book: Book) = BookOut(
            id = book.id!!,
            title = book.title,
            author = book.author,
            publisher = book.publisher,
            isbn = book.isbn,
            coverUrl = book.coverUrl,
            description = book.description,
            status = book.status,
            createdAt = book.createdAt,
        )
    }
}

data class BookStatusUpdate(val status: BookStatus)

data class CardOut(
    val id: Long,
    val bookId: Long,
    val imageUrl: String?,
    val originalText: String?,
    val content: String,
    val highlights: List<Highlight>?,
    val pageNumber: Int?,
    val orderIndex: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun of(card: Card) = CardOut(
            id = card.id!!,
            bookId = card.bookId,
            imageUrl = card.imageUrl,
            originalText = card.originalText,
            content = card.content,
            highlights = card.highlights,
            pageNumber = card.pageNumber,
            orderIndex = card.orderIndex,
            createdAt = card.createdAt,
            updatedAt = card.updatedAt,
        )
    }
}

data class CardCreate(
    val content: String,
    val pageNumber: Int? = null,
)
