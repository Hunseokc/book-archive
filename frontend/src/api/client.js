import { clearSession, getAccessToken } from "../utils/auth"

const API_BASE = "/api"

// 모든 API 호출의 공통 처리: 토큰 첨부, JSON 변환, 에러 메시지, 만료 시 로그아웃.
export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const finalHeaders = { ...headers }
  const token = getAccessToken()
  if (token && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${token}`
  }
  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json"
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return null
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    // 직접 넣은 Authorization(단축어 토큰 확인 등)이 아니라 로그인 토큰이 거부된 경우만 로그아웃
    if (res.status === 401 && token && !headers.Authorization) {
      clearSession()
    }
    throw new Error(data?.detail || `요청 실패 (${res.status})`)
  }
  return res.json()
}
