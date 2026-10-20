import { useEffect, useState } from "react"
import BookCard from "../components/BookCard"
import BookSearchForm from "../components/BookSearchForm"
import { listBooks } from "../api/books"

function Bookshelf({ onSelectBook, onOpenCapture, onOpenSettings }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleBookRegistered(book) {
    setBooks((prev) => [book, ...prev])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900 mr-auto">내 책장</h1>
        <button
          type="button"
          onClick={onOpenCapture}
          className="px-3 py-1.5 text-sm rounded bg-gray-900 text-white"
        >
          빠른 캡처
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white text-gray-700"
        >
          설정
        </button>
      </div>

      <BookSearchForm onBookRegistered={handleBookRegistered} />

      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && books.length === 0 && (
        <p className="text-sm text-gray-500">
          아직 등록된 책이 없어요. 위에서 검색해 등록해보세요.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onClick={onSelectBook} />
        ))}
      </div>
    </div>
  )
}

export default Bookshelf
