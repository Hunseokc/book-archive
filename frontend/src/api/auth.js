import { apiFetch } from "./client"

export function login(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: { email, password } })
}

export function signup(email, password) {
  return apiFetch("/auth/signup", { method: "POST", body: { email, password } })
}

export function getMe() {
  return apiFetch("/auth/me")
}
