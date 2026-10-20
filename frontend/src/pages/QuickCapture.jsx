import { useEffect, useState } from "react"
import { listBooks } from "../api/books"
import { createCard, deleteCard } from "../api/cards"
import { getSettings, updateSettings } from "../api/settings"
import { prefs } from "../utils/prefs"
import { joinLines } from "../utils/text"

// 책을 읽다가 문장을 바로 카드로 담는 화면.
// 카메라 입력은 iOS 기본 "텍스트 스캔"(라이브 텍스트)을 그대로 사용한다.
function QuickCapture({ onBack, onOpenSettings }) {
  const [books, setBooks] = useState([])
  const [bookId, setBookId] = useState(null)
  const [content, setContent] = useState("")
  const [pageNumber, setPageNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [saved, setSaved] = useState([])
  const [helpDismissed, setHelpDismissed] = useState(prefs.getCaptureHelpDismissed)

  useEffect(() => {
    Promise.all([listBooks(), getSettings()])
      .then(([bookList, settings]) => {
        setBooks(bookList)
        const initial = settings.current_book_id ?? bookList[0]?.id ?? null
        setBookId(initial)
        if (initial) setPageNumber(prefs.getLastPage(initial))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const currentBook = books.find((b) => b.id === bookId)

  function handleBookChange(e) {
    const id = Number(e.target.value)
    setBookId(id)
    setPageNumber(prefs.getLastPage(id))
    setSaved([])
    // 단축어 카드도 같은 책으로 가도록 서버의 "지금 읽는 책"을 함께 바꾼다.
    updateSettings({ current_book_id: id }).catch(() => {})
  }

  async function save(rawText) {
    const text = prefs.getAutoJoinLines() ? joinLines(rawText) : rawText.trim()
    if (!text || !bookId) return

    setSaving(true)
    setError(null)
    try {
      const card = await createCard(bookId, { content: text, pageNumber })
      prefs.setLastPage(bookId, pageNumber)
      setSaved((prev) => [card, ...prev])
      setContent("")
      setNotice(`${card.order_index}번째 카드로 저장했어요.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePasteFromClipboard() {
    setError(null)
    setNotice(null)
    if (!navigator.clipboard?.readText) {
      setError(
        "이 접속 환경(HTTPS가 아닌 주소)에서는 클립보드를 읽을 수 없어요. 입력창을 길게 눌러 '붙여넣기' 해주세요.",
      )
      return
    }
    let text
    try {
      text = await navigator.clipboard.readText()
    } catch {
      setError("클립보드 접근이 거부됐어요. 입력창을 길게 눌러 '붙여넣기' 해주세요.")
      return
    }
    if (!text.trim()) {
      setError("클립보드가 비어 있어요.")
      return
    }
    if (prefs.getAutoSaveOnPaste()) {
      await save(text)
    } else {
      setContent(prefs.getAutoJoinLines() ? joinLines(text) : text)
    }
  }

  async function handleUndo(card) {
    try {
      await deleteCard(card.id)
      setSaved((prev) => prev.filter((c) => c.id !== card.id))
      setNotice("카드를 삭제했어요.")
    } catch (err) {
      setError(err.message)
    }
  }

  function dismissHelp() {
    prefs.setCaptureHelpDismissed(true)
    setHelpDismissed(true)
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">불러오는 중...</p>
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← 책장
        </button>
        <h1 className="text-base font-semibold text-gray-900">빠른 캡처</h1>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          설정
        </button>
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-gray-500">먼저 책장에서 책을 등록해주세요.</p>
      ) : (
        <>
          <label className="block">
            <span className="text-xs text-gray-500">지금 읽는 책</span>
            <select
              value={bookId ?? ""}
              onChange={handleBookChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                  {b.author ? ` · ${b.author}` : ""}
                </option>
              ))}
            </select>
          </label>

          {!helpDismissed && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 space-y-1">
              <p className="font-medium">카메라로 바로 입력하기 (iPhone)</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
                <li>아래 입력창을 탭하고, 커서를 한 번 더 탭</li>
                <li>
                  메뉴의 <b>텍스트 스캔</b>(또는 키보드 위 스캔 아이콘) 선택
                </li>
                <li>책에 비추고 원하는 부분만 드래그 → <b>삽입</b></li>
                <li>
                  <b>저장</b>을 누르면 카드 완성
                </li>
              </ol>
              <button
                type="button"
                onClick={dismissHelp}
                className="text-xs text-amber-700 underline"
              >
                다시 보지 않기
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              save(content)
            }}
            className="space-y-3"
          >
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setNotice(null)
              }}
              placeholder="탭 → '텍스트 스캔'으로 책 문장을 바로 입력하세요"
              rows={8}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="페이지"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
              {content && (
                <button
                  type="button"
                  onClick={() => setContent(joinLines(content))}
                  className="text-xs text-gray-500 underline"
                >
                  줄바꿈 합치기
                </button>
              )}
              {content && (
                <button
                  type="button"
                  onClick={() => setContent("")}
                  className="ml-auto text-xs text-gray-500 underline"
                >
                  지우기
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={saving}
                className="py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 disabled:opacity-50"
              >
                클립보드에서 가져오기
              </button>
              <button
                type="submit"
                disabled={saving || !content.trim()}
                className="py-3 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40"
              >
                {saving ? "저장 중..." : "카드 저장"}
              </button>
            </div>
          </form>

          {notice && <p className="text-sm text-green-700">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {saved.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-medium text-gray-500">
                방금 담은 카드 · {currentBook?.title}
              </h2>
              {saved.map((card) => (
                <div
                  key={card.id}
                  className="flex gap-3 items-start border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <p className="flex-1 text-sm text-gray-700 line-clamp-3 whitespace-pre-line">
                    {card.content}
                  </p>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {card.page_number && (
                      <span className="text-xs text-gray-400">p.{card.page_number}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUndo(card)}
                      className="text-xs text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default QuickCapture
