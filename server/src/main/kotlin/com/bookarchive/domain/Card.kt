package com.bookarchive.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

data class Highlight(val start: Int, val end: Int)

@Entity
@Table(name = "cards")
class Card(
    @Column(nullable = false)
    var bookId: Long,

    // 업로드된 원본 사진 (OCR 대상)
    var imageUrl: String? = null,
    // OCR이 처음 추출한 원문 (수정 이력 비교용으로 보존)
    var originalText: String? = null,
    // 사용자가 수정 가능한 카드 본문
    @Column(nullable = false)
    var content: String = "",
    // 하이라이트된 구간 목록: [{"start": int, "end": int}, ...]
    @JdbcTypeCode(SqlTypes.JSON)
    var highlights: List<Highlight>? = null,

    var pageNumber: Int? = null,
    // Reading Mode에서 카드 순서를 결정
    @Column(nullable = false)
    var orderIndex: Int = 0,

    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(ZoneOffset.UTC),
    @Column(nullable = false)
    var updatedAt: LocalDateTime = createdAt,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @PreUpdate
    fun touch() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC)
    }
}

interface CardRepository : JpaRepository<Card, Long> {
    fun findAllByBookIdOrderByOrderIndex(bookId: Long): List<Card>

    @Query("select max(c.orderIndex) from Card c where c.bookId = :bookId")
    fun findMaxOrderIndex(bookId: Long): Int?

    // 카드가 해당 사용자의 책에 속할 때만 반환한다.
    @Query("select c from Card c where c.id = :cardId and c.bookId in (select b.id from Book b where b.userId = :userId)")
    fun findOwned(cardId: Long, userId: UUID): Card?
}
