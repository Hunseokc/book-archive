package com.bookarchive.web

import com.bookarchive.auth.AuthUser
import com.bookarchive.domain.Book
import com.bookarchive.domain.BookRepository
import com.bookarchive.service.GoogleBooksClient
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/books")
class BookController(
    private val books: BookRepository,
    private val googleBooks: GoogleBooksClient,
) {
    @GetMapping("/search")
    fun search(@RequestParam q: String): List<BookSearchResult> {
        if (q.isBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "검색어를 입력해주세요.")
        return googleBooks.search(q)
    }

    @GetMapping
    fun list(user: AuthUser): List<BookOut> =
        books.findAllByUserIdOrderByCreatedAtDesc(user.id).map(BookOut::of)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(user: AuthUser, @RequestBody payload: BookCreate): BookOut {
        val book = Book(
            userId = user.id,
            title = payload.title,
            author = payload.author,
            publisher = payload.publisher,
            isbn = payload.isbn,
            coverUrl = payload.coverUrl,
            description = payload.description,
        )
        return BookOut.of(books.save(book))
    }

    @GetMapping("/{bookId}")
    fun get(user: AuthUser, @PathVariable bookId: Long): BookOut = BookOut.of(findBook(user, bookId))

    @PatchMapping("/{bookId}/status")
    fun updateStatus(user: AuthUser, @PathVariable bookId: Long, @RequestBody payload: BookStatusUpdate): BookOut {
        val book = findBook(user, bookId)
        book.status = payload.status
        return BookOut.of(books.save(book))
    }

    // 다른 사용자의 책은 존재 여부도 드러내지 않도록 404 로 응답한다.
    private fun findBook(user: AuthUser, bookId: Long): Book =
        books.findByIdAndUserId(bookId, user.id)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다.")
}
