'use client'

// Store session token with 1 day validity in localStorage
const KEY = 'qr_session_v1'

type Session = {
  token: string
  expiresAt: number // epoch ms
}

export function setSessionToken(token: string) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000
  const session: Session = { token, expiresAt }
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(session))
  }
}

export function getValidSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(KEY)
      return null
    }
    return s.token
  } catch {
    localStorage.removeItem(KEY)
    return null
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEY)
  }
}

// SHA-256 then base64url encode
export async function hashPasswordBase64Url(password: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  // Convert to base64url
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
