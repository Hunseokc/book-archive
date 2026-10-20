import { apiFetch } from "./client"

export function listCards(bookId) {
  return apiFetch(`/books/${bookId}/cards`)
}

export function createCard(bookId, { content, pageNumber }) {
  return apiFetch(`/books/${bookId}/cards`, {
    method: "POST",
    body: {
      content,
      page_number: pageNumber ? Number(pageNumber) : null,
    },
  })
}

export function updateCard(cardId, payload) {
  return apiFetch(`/cards/${cardId}`, { method: "PATCH", body: payload })
}

export function deleteCard(cardId) {
  return apiFetch(`/cards/${cardId}`, { method: "DELETE" })
}
