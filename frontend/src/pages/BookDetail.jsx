import { useEffect, useState } from "react"
import { getBook, updateBookStatus } from "../api/books"
import { listCards } from "../api/cards"
import CardItem from "../components/CardItem"
import CardTextForm from "../components/CardTextForm"

const STATUS_LABEL = {
  to_read: "읽기 전",
  reading: "읽는 중",
  finished: "완독",
}

function BookDetail({ bookId, onBack, onOpenReadingMode }) {
  const [book, setBook] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([getBook(bookId), listCards(bookId)])
      .then(([bookData, cardData]) => {
        setBook(bookData)
        setCards(cardData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [bookId])

  function handleCardCreated(card) {
    setCards((prev) => [...prev, card])
  }

  function handleCardUpdated(updated) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleCardDeleted(cardId) {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
  }

  async function handleStatusChange(e) {
    const nextStatus = e.target.value
    setStatusSaving(true)
    setStatusError(null)
    try {
      const updated = await updateBookStatus(bookId, nextStatus)
      setBook(updated)
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">불러오는 중...</p>
  }

  if (error || !book) {
    return <p className="p-6 text-sm text-red-600">{error ?? "책을 찾을 수 없습니다."}</p>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← 책장으로
      </button>

      <div className="border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="w-40 aspect-[2/3] bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">표지 없음</span>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
          <p className="text-sm text-gray-600">{book.author ?? "저자 미상"}</p>
          {book.publisher && (
            <p className="text-sm text-gray-500">{book.publisher}</p>
          )}
          {book.isbn && <p className="text-xs text-gray-400">ISBN {book.isbn}</p>}

          <div className="flex items-center gap-2 mt-2">
            <select
              value={book.status}
              onChange={handleStatusChange}
              disabled={statusSaving}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {book.status === "finished" && (
              <button
                type="button"
                onClick={() => onOpenReadingMode(bookId)}
                className="text-xs px-2 py-1 rounded bg-gray-900 text-white"
              >
                모아보기
              </button>
            )}
          </div>
          {statusError && <p className="text-xs text-red-600">{statusError}</p>}

          {book.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-4">
              {book.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-gray-900">
            카드 ({cards.length})
          </h2>
        </div>

        <CardTextForm bookId={bookId} onCardCreated={handleCardCreated} />

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            아직 카드가 없어요. OCR로 인식한 문장을 붙여넣어 첫 카드를 만들어보세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onUpdated={handleCardUpdated}
                onDeleted={handleCardDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookDetail
