import { useState } from "react"
import { login, signup } from "../api/auth"
import { setSession } from "../utils/auth"

function Login() {
  const [mode, setMode] = useState("login") // "login" | "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === "signup"

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = isSignup ? await signup(email, password) : await login(email, password)
      setSession({ access_token: res.access_token, user: res.user })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 space-y-4"
      >
        <div className="text-center space-y-1">
          <img src="/icon.svg" alt="" className="w-12 h-12 rounded-xl mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">북 아카이브</h1>
          <p className="text-xs text-gray-500">{isSignup ? "새 계정 만들기" : "로그인"}</p>
        </div>

        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignup ? "비밀번호 (8자 이상)" : "비밀번호"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "잠시만요..." : isSignup ? "가입하기" : "로그인"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "login" : "signup")
            setError(null)
          }}
          className="w-full text-xs text-gray-500 underline"
        >
          {isSignup ? "이미 계정이 있어요" : "계정 만들기"}
        </button>
      </form>
    </div>
  )
}

export default Login
