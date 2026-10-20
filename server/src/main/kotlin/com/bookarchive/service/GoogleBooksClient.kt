package com.bookarchive.service

import com.bookarchive.web.ApiException
import com.bookarchive.web.BookSearchResult
import com.fasterxml.jackson.databind.JsonNode
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException
import org.springframework.web.client.body
import java.time.Duration

@Component
class GoogleBooksClient(
    @Value("\${app.google-books-api-key}") private val apiKey: String,
) {
    private val restClient = RestClient.builder()
        .baseUrl("https://www.googleapis.com/books/v1/volumes")
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(Duration.ofSeconds(10))
                setReadTimeout(Duration.ofSeconds(10))
            },
        )
        .build()

    fun search(query: String, maxResults: Int = 10): List<BookSearchResult> {
        val data = try {
            restClient.get()
                .uri { b ->
                    b.queryParam("q", "{q}").queryParam("maxResults", maxResults)
                    if (apiKey.isNotBlank()) b.queryParam("key", "{key}")
                    b.build(mapOf("q" to query, "key" to apiKey))
                }
                .retrieve()
                .body<JsonNode>()
        } catch (e: RestClientResponseException) {
            throw ApiException(HttpStatus.BAD_GATEWAY, "도서 검색 API 오류: ${e.statusCode.value()}")
        } catch (e: ResourceAccessException) {
            throw ApiException(HttpStatus.BAD_GATEWAY, "도서 검색 API에 연결할 수 없습니다.")
        }

        return data?.path("items")?.map(::mapVolume).orEmpty()
    }

    private fun mapVolume(volume: JsonNode): BookSearchResult {
        val info = volume.path("volumeInfo")
        val imageLinks = info.path("imageLinks")
        val coverUrl = (imageLinks.textOrNull("thumbnail") ?: imageLinks.textOrNull("smallThumbnail"))
            ?.replace("http://", "https://")

        return BookSearchResult(
            title = info.textOrNull("title") ?: "제목 없음",
            author = info.path("authors").map { it.asText() }.joinToString(", ").ifEmpty { null },
            publisher = info.textOrNull("publisher"),
            isbn = extractIsbn(info.path("industryIdentifiers")),
            coverUrl = coverUrl,
            description = info.textOrNull("description"),
        )
    }

    private fun extractIsbn(identifiers: JsonNode): String? =
        listOf("ISBN_13", "ISBN_10").firstNotNullOfOrNull { type ->
            identifiers.firstOrNull { it.textOrNull("type") == type }?.textOrNull("identifier")
        }

    private fun JsonNode.textOrNull(field: String): String? =
        get(field)?.takeUnless { it.isNull }?.asText()
}
