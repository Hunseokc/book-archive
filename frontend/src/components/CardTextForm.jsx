import { useState } from "react"
import { createCard } from "../api/cards"

function CardTextForm({ bookId, onCardCreated }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [pageNumber, setPageNumber] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function reset() {
    setContent("")
    setPageNumber("")
    setError(null)
    setOpen(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return

    setSaving(true)
    setError(null)
    try {
      const card = await createCard(bookId, { content: content.trim(), pageNumber })
      onCardCreated(card)
      reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm rounded bg-gray-900 text-white"
      >
        텍스트로 카드 추가
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full border border-gray-200 rounded-lg p-3 bg-white space-y-2"
    >
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="OCR로 인식한 문장을 여기에 붙여넣거나 입력하세요"
        rows={5}
        className="w-full text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          placeholder="페이지(선택)"
          className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="px-3 py-1.5 text-sm rounded bg-gray-900 text-white disabled:opacity-50"
          >
            {saving ? "추가 중..." : "카드 추가"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}

export default CardTextForm
