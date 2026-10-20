import { useState } from "react"
import { deleteCard, updateCard } from "../api/cards"
import HighlightableText from "./HighlightableText"

const TITLE_MAX_LENGTH = 30

function deriveTitle(content) {
  const firstLine = content.split("\n")[0].trim()
  if (!firstLine) return "(빈 카드)"
  if (firstLine.length <= TITLE_MAX_LENGTH) return firstLine
  return `${firstLine.slice(0, TITLE_MAX_LENGTH)}...`
}

function CardItem({ card, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.content)
  const [selecting, setSelecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateCard(card.id, { content: draft })
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("이 카드를 삭제할까요?")) return
    try {
      await deleteCard(card.id)
      onDeleted(card.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function persistHighlights(nextHighlights) {
    setError(null)
    try {
      const updated = await updateCard(card.id, { highlights: nextHighlights })
      onUpdated(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAddHighlight(start, end) {
    persistHighlights([...(card.highlights ?? []), { start, end }])
  }

  function handleRemoveHighlight(range) {
    persistHighlights(
      (card.highlights ?? []).filter(
        (h) => !(h.start === range.start && h.end === range.end),
      ),
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 flex flex-col gap-2">
      {card.image_url && (
        <img
          src={card.image_url}
          alt={`page ${card.page_number ?? ""}`}
          className="w-full h-28 object-cover rounded"
        />
      )}

      <h3 className="text-sm font-semibold text-gray-900 truncate" title={card.content}>
        {deriveTitle(card.content)}
      </h3>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="w-full text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      ) : (
        <HighlightableText
          content={card.content}
          highlights={card.highlights}
          selecting={selecting}
          onAddHighlight={handleAddHighlight}
          onRemoveHighlight={handleRemoveHighlight}
          className={`text-sm text-gray-600${selecting ? "" : " line-clamp-4"}`}
        />
      )}

      {selecting && (
        <p className="text-xs text-amber-600">
          형광펜으로 칠할 부분을 드래그해서 선택하세요.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-between mt-auto pt-2">
        {card.page_number != null && (
          <span className="text-xs text-gray-400">p.{card.page_number}</span>
        )}
        <div className="flex gap-2 ml-auto">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(card.content)
                  setEditing(false)
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-2 py-1 rounded bg-gray-900 text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelecting((s) => !s)}
                className={`text-xs ${selecting ? "text-amber-700 font-medium" : "text-gray-500 hover:text-gray-900"}`}
              >
                {selecting ? "하이라이트 완료" : "하이라이트"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardItem
