import { useState } from "react"
import { createBook, searchBooks } from "../api/books"

function BookSearchForm({ onBookRegistered }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [registeringIndex, setRegisteringIndex] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    try {
      const data = await searchBooks(query.trim())
      setResults(data)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(candidate, index) {
    setRegisteringIndex(index)
    setError(null)
    try {
      const book = await createBook(candidate)
      onBookRegistered?.(book)
      setResults((prev) => prev.filter((_, i) => i !== index))
    } catch (err) {
      setError(err.message)
    } finally {
      setRegisteringIndex(null)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="책 제목이나 저자를 입력하세요"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded bg-gray-900 text-white disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {results.map((candidate, index) => (
            <li
              key={`${candidate.title}-${candidate.isbn ?? index}`}
              className="flex items-center gap-3 py-3"
            >
              <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {candidate.cover_url && (
                  <img
                    src={candidate.cover_url}
                    alt={candidate.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {candidate.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {candidate.author ?? "저자 미상"}
                  {candidate.publisher ? ` · ${candidate.publisher}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRegister(candidate, index)}
                disabled={registeringIndex === index}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {registeringIndex === index ? "등록 중..." : "등록"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BookSearchForm
