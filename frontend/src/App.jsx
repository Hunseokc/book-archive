import { useEffect, useState } from "react"
import BookDetail from "./pages/BookDetail"
import Bookshelf from "./pages/Bookshelf"
import Login from "./pages/Login"
import QuickCapture from "./pages/QuickCapture"
import ReadingMode from "./pages/ReadingMode"
import Settings from "./pages/Settings"
import { getSession, onSessionChange } from "./utils/auth"
import { prefs } from "./utils/prefs"

function App() {
  const [session, setSession] = useState(getSession)

  // 로그인·로그아웃·토큰 만료(401) 시 갱신
  useEffect(() => onSessionChange(setSession), [])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Login />
      </div>
    )
  }

  // 사용자가 바뀌면 화면 상태를 새로 시작
  return <MainApp key={session.user.id} user={session.user} />
}

function MainApp({ user }) {
  // { type: "shelf" } | { type: "detail", bookId } | { type: "reading", bookId }
  // | { type: "capture" } | { type: "settings", from }
  const [view, setView] = useState(() =>
    prefs.getStartOnCapture() ? { type: "capture" } : { type: "shelf" },
  )

  const openSettings = (from) => setView({ type: "settings", from })

  return (
    <div className="min-h-screen bg-gray-50">
      {view.type === "shelf" && (
        <Bookshelf
          onSelectBook={(book) => setView({ type: "detail", bookId: book.id })}
          onOpenCapture={() => setView({ type: "capture" })}
          onOpenSettings={() => openSettings("shelf")}
        />
      )}
      {view.type === "detail" && (
        <BookDetail
          bookId={view.bookId}
          onBack={() => setView({ type: "shelf" })}
          onOpenReadingMode={(bookId) => setView({ type: "reading", bookId })}
        />
      )}
      {view.type === "reading" && (
        <ReadingMode
          bookId={view.bookId}
          onBack={() => setView({ type: "detail", bookId: view.bookId })}
        />
      )}
      {view.type === "capture" && (
        <QuickCapture
          onBack={() => setView({ type: "shelf" })}
          onOpenSettings={() => openSettings("capture")}
        />
      )}
      {view.type === "settings" && (
        <Settings user={user} onBack={() => setView({ type: view.from ?? "shelf" })} />
      )}
    </div>
  )
}

export default App
