import { apiFetch } from "./client"

export function getSettings() {
  return apiFetch("/settings")
}

export function updateSettings(payload) {
  return apiFetch("/settings", { method: "PATCH", body: payload })
}

export function regenerateQuickCardToken() {
  return apiFetch("/settings/quick-card-token", { method: "POST" })
}

// 단축어가 호출하는 것과 같은 방식(단축어 토큰)으로 연결 상태를 확인한다.
export function checkQuickCardStatus(token) {
  return apiFetch("/quick-cards/status", {
    headers: { Authorization: `Bearer ${token}` },
  })
}
