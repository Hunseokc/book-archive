import { useEffect, useState } from "react"
import { getBook } from "../api/books"
import { listCards } from "../api/cards"
import { buildSegments } from "../utils/highlights"

function ReadingMode({ bookId, onBack }) {
  const [book, setBook] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) return <p className="p-6 text-sm text-gray-500">불러오는 중...</p>
  if (error || !book) {
    return <p className="p-6 text-sm text-red-600">{error ?? "책을 찾을 수 없습니다."}</p>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← 상세로
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mt-4">{book.title}</h1>
      {book.author && <p className="text-sm text-gray-500 mb-8">{book.author}</p>}

      {cards.length === 0 ? (
        <p className="text-sm text-gray-500 mt-4">모아볼 카드가 없어요.</p>
      ) : (
        <div className="space-y-6 mt-4">
          {cards.map((card) => (
            <section key={card.id} className="border-b border-gray-100 pb-6">
              {card.page_number != null && (
                <p className="text-xs text-gray-400 mb-1">p.{card.page_number}</p>
              )}
              <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                {buildSegments(card.content, card.highlights).map((seg, i) =>
                  seg.highlighted ? (
                    <mark key={i} className="bg-yellow-200">
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReadingMode
