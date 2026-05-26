import type { User } from '@/types'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function getUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

export function logout(): void {
  clearAuth()
  window.location.href = '/login'
}
