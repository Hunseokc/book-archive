// 로그인 세션(액세스 토큰) 보관.
// Supabase 로 옮기면 supabase.auth 세션의 access_token 을 setSession 에 넘기기만 하면
// 나머지 API 호출 코드는 그대로 쓸 수 있다.
const KEY = "book-archive:session"
const listeners = new Set()

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAccessToken() {
  return getSession()?.access_token ?? null
}

// session: { access_token, user: { id, email } }
export function setSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // 저장이 막힌 환경이면 새로고침 시 다시 로그인해야 한다.
  }
  listeners.forEach((fn) => fn(session))
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
  listeners.forEach((fn) => fn(null))
}

export function onSessionChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
