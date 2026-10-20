import { useEffect, useState } from "react"
import { listBooks } from "../api/books"
import {
  checkQuickCardStatus,
  getSettings,
  regenerateQuickCardToken,
  updateSettings,
} from "../api/settings"
import { clearSession } from "../utils/auth"
import { prefs } from "../utils/prefs"

function Toggle({ checked, onChange, disabled, label, description }) {
  return (
    <label className="flex items-start gap-3 py-3 cursor-pointer">
      <span className="flex-1">
        <span className="block text-sm text-gray-900">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-gray-900"
      />
    </label>
  )
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // HTTPS가 아니면 클립보드 쓰기가 막힌다. 입력창을 선택해 직접 복사하도록 둔다.
    }
  }

  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="mt-1 flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50"
        />
        {navigator.clipboard?.writeText && (
          <button
            type="button"
            onClick={copy}
            className="px-3 rounded-lg border border-gray-300 bg-white text-xs"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        )}
      </div>
    </div>
  )
}

function Settings({ user, onBack }) {
  const [settings, setSettings] = useState(null)
  const [books, setBooks] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [check, setCheck] = useState(null)

  const [startOnCapture, setStartOnCapture] = useState(prefs.getStartOnCapture)
  const [autoSaveOnPaste, setAutoSaveOnPaste] = useState(prefs.getAutoSaveOnPaste)
  const [autoJoinLines, setAutoJoinLines] = useState(prefs.getAutoJoinLines)

  useEffect(() => {
    Promise.all([getSettings(), listBooks()])
      .then(([s, b]) => {
        setSettings(s)
        setBooks(b)
      })
      .catch((err) => setError(err.message))
  }, [])

  async function run(action) {
    setBusy(true)
    setError(null)
    setCheck(null)
    try {
      setSettings(await action())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleRegenerate() {
    if (!window.confirm("토큰을 새로 만들면 기존 단축어는 동작하지 않아요. 계속할까요?")) return
    run(regenerateQuickCardToken)
  }

  async function handleCheck() {
    setCheck(null)
    try {
      const res = await checkQuickCardStatus(settings.quick_card_token)
      setCheck({ ok: true, message: res.message })
    } catch (err) {
      setCheck({ ok: false, message: err.message })
    }
  }

  const endpoint = `${window.location.origin}/api/quick-cards`

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← 뒤로
        </button>
        <h1 className="text-base font-semibold text-gray-900">설정</h1>
        <span className="w-10" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-xs font-medium text-gray-500 mb-1">계정</h2>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-sm text-gray-900 truncate">{user.email}</span>
          <button
            type="button"
            onClick={clearSession}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium text-gray-500 mb-1">이 기기</h2>
        <div className="bg-white border border-gray-200 rounded-lg px-4 divide-y divide-gray-100">
          <Toggle
            label="앱을 열면 빠른 캡처로 시작"
            description="홈 화면 아이콘을 누르면 바로 문장을 담을 수 있어요."
            checked={startOnCapture}
            onChange={(v) => {
              prefs.setStartOnCapture(v)
              setStartOnCapture(v)
            }}
          />
          <Toggle
            label="줄바꿈 자동 합치기"
            description="OCR이 넣은 줄바꿈을 한 문단으로 합쳐 저장해요. 빈 줄은 문단 구분으로 남아요."
            checked={autoJoinLines}
            onChange={(v) => {
              prefs.setAutoJoinLines(v)
              setAutoJoinLines(v)
            }}
          />
          <Toggle
            label="클립보드에서 가져오면 바로 저장"
            description="카메라 앱에서 복사 → '클립보드에서 가져오기' 한 번으로 카드가 만들어져요."
            checked={autoSaveOnPaste}
            onChange={(v) => {
              prefs.setAutoSaveOnPaste(v)
              setAutoSaveOnPaste(v)
            }}
          />
        </div>
      </section>

      {settings && (
        <>
          <section>
            <h2 className="text-xs font-medium text-gray-500 mb-1">지금 읽는 책</h2>
            <select
              value={settings.current_book_id ?? ""}
              disabled={busy}
              onChange={(e) =>
                run(() => updateSettings({ current_book_id: Number(e.target.value) }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            >
              {settings.current_book_id == null && <option value="">선택 안 됨</option>}
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              빠른 캡처와 단축어로 만든 카드가 이 책에 저장돼요.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium text-gray-500 mb-1">추가 기능</h2>
            <div className="bg-white border border-gray-200 rounded-lg px-4">
              <Toggle
                label="iOS 단축어 연동"
                description="앱을 열지 않고 뒷면 탭·동작 버튼으로 카드를 만들어요."
                checked={settings.quick_card_enabled}
                disabled={busy}
                onChange={(v) => run(() => updateSettings({ quick_card_enabled: v }))}
              />

              {settings.quick_card_enabled && settings.quick_card_token && (
                <div className="pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <CopyField label="요청 URL" value={endpoint} />
                  <CopyField label="토큰" value={settings.quick_card_token} />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCheck}
                      className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs"
                    >
                      연결 확인
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs disabled:opacity-50"
                    >
                      토큰 재발급
                    </button>
                  </div>
                  {check && (
                    <p className={`text-xs ${check.ok ? "text-green-700" : "text-red-600"}`}>
                      {check.message}
                    </p>
                  )}

                  <ShortcutGuide />
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ShortcutGuide() {
  return (
    <details className="text-sm text-gray-700">
      <summary className="cursor-pointer text-gray-900 font-medium">단축어 만드는 방법</summary>
      <div className="mt-2 space-y-3 text-xs leading-relaxed">
        <div>
          <p className="font-medium text-gray-900">① 복사한 문장 → 카드 (추천)</p>
          <p className="text-gray-500 mb-1">
            카메라 앱에서 라이브 텍스트로 문장을 복사한 뒤 실행해요.
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>단축어 앱 → + → <b>클립보드 가져오기</b> 추가</li>
            <li>
              <b>URL의 콘텐츠 가져오기</b> 추가 → URL에 위 <b>요청 URL</b> 입력
            </li>
            <li>
              방법 <b>POST</b> · 헤더 <code>Authorization</code> ={" "}
              <code>Bearer 토큰</code>
            </li>
            <li>
              요청 본문 <b>JSON</b> → 키 <code>content</code>, 값은 <b>클립보드</b>
            </li>
            <li>
              <b>사전 값 가져오기</b>(키 <code>message</code>) → <b>알림 표시</b>
            </li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-gray-900">② 촬영 → 카드</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              <b>사진 찍기</b> → <b>이미지에서 텍스트 추출</b>
            </li>
            <li>
              <b>입력 요청</b>(기본 답변 = 추출된 텍스트) — 필요한 부분만 남기기
            </li>
            <li>
              이후는 ①의 2~5단계와 같고, <code>content</code> 값을 <b>입력 결과</b>로
            </li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-gray-900">③ 바로 실행하게 만들기</p>
          <p>
            설정 → 손쉬운 사용 → 터치 → <b>뒷면 탭</b> → 두 번 탭 → 만든 단축어 선택. (iPhone
            15 Pro 이상은 <b>동작 버튼</b>에도 지정 가능)
          </p>
        </div>
        <p className="text-gray-500">
          휴대폰이 이 서버 주소에 접속할 수 있어야 해요 (같은 Wi‑Fi 등). 페이지 번호도 보내려면
          JSON에 <code>page_number</code> 키를 추가하세요.
        </p>
      </div>
    </details>
  )
}

export default Settings
