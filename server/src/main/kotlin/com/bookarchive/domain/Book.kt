package com.bookarchive.domain

import com.fasterxml.jackson.annotation.JsonValue
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

// DB에는 enum 이름(TO_READ)을, API에는 소문자 값(to_read)을 사용한다. (기존 SQLAlchemy 동작과 동일)
enum class BookStatus(@get:JsonValue val value: String) {
    TO_READ("to_read"),
    READING("reading"),
    FINISHED("finished"),
}

@Entity
@Table(name = "books")
class Book(
    // 소유자 (users.id). 로그인 도입 전 데이터만 첫 가입 전까지 NULL.
    var userId: UUID?,
    @Column(nullable = false)
    var title: String,
    var author: String? = null,
    var publisher: String? = null,
    var isbn: String? = null,
    var coverUrl: String? = null,
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: BookStatus = BookStatus.TO_READ,

    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(ZoneOffset.UTC),
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}

interface BookRepository : JpaRepository<Book, Long> {
    fun findAllByUserIdOrderByCreatedAtDesc(userId: UUID): List<Book>

    fun findByIdAndUserId(id: Long, userId: UUID): Book?

    fun existsByIdAndUserId(id: Long, userId: UUID): Boolean

    fun findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId: UUID, status: BookStatus): Book?

    @Modifying
    @Query("update Book b set b.userId = :userId where b.userId is null")
    fun claimUnowned(userId: UUID): Int
}
