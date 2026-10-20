import { apiFetch } from "./client"

export function searchBooks(query) {
  return apiFetch(`/books/search?q=${encodeURIComponent(query)}`)
}

export function listBooks() {
  return apiFetch("/books")
}

export function getBook(bookId) {
  return apiFetch(`/books/${bookId}`)
}

export function createBook(payload) {
  return apiFetch("/books", { method: "POST", body: payload })
}

export function updateBookStatus(bookId, status) {
  return apiFetch(`/books/${bookId}/status`, { method: "PATCH", body: { status } })
}
