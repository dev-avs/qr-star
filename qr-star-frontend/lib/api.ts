'use client'

import { BASE_URL } from './constants'
import { hashPasswordBase64Url } from './auth-client'

type APIResponse = { error: boolean; message: any }

async function request(path: string, init: RequestInit = {}): Promise<APIResponse> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
    })
    const data = (await res.json()) as APIResponse
    return data
  } catch (e: any) {
    return { error: true, message: e?.message || 'Network error' }
  }
}

// Auth
export async function authenticate({ username, password }: { username: string; password: string }): Promise<APIResponse> {
  const hashed = await hashPasswordBase64Url(password)
  return request('/api/users/auth', {
    method: 'GET',
    headers: {
      username,
      password: hashed,
    },
  })
}

export async function getCurrentUser(token: string): Promise<APIResponse> {
  return request('/api/users/me', {
    method: 'GET',
    headers: {
      login: token,
    },
  })
}

// Users (admin)
export async function createUser(token: string, body: { username: string; password: string; level?: number }): Promise<APIResponse> {
  const hashed = await hashPasswordBase64Url(body.password)
  return request('/api/users/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify({ username: body.username, password: hashed, level: body.level }),
  })
}

export async function deleteUser(token: string, username: string): Promise<APIResponse> {
  return request('/api/users/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify({ username }),
  })
}

export async function changePassword(token: string, body: { password: string; username?: string }): Promise<APIResponse> {
  const hashed = await hashPasswordBase64Url(body.password)
  return request('/api/users/changepassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify({ password: hashed, username: body.username }),
  })
}

// Links
export async function createLink(
  token: string,
  body: {
    linkid?: string
    content: string
    qrinfo: any
  }
): Promise<APIResponse> {
  return request('/api/links/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify({ linkid: body.linkid, content: body.content, qrinfo: body.qrinfo }),
  })
}

export async function deleteLink(token: string, linkid: string): Promise<APIResponse> {
  return request('/api/links/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify({ linkid }),
  })
}

export async function editLink(
  token: string,
  body: { linkid: string; content?: string; newlinkid?: string; qrinfo?: any }
): Promise<APIResponse> {
  // Send qrinfo alongside other editable fields
  return request('/api/links/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      login: token,
    },
    body: JSON.stringify(body),
  })
}

export async function listLinks(token: string): Promise<APIResponse> {
  return request('/api/links/list', {
    method: 'GET',
    headers: {
      login: token,
    },
  })
}

/* ========= Site Admin (level 2) ========= */

// GET /api/siteadmin/links/list
export async function adminListAllLinks(token: string): Promise<APIResponse> {
  return request('/api/siteadmin/links/list', {
    method: 'GET',
    headers: {
      login: token,
    },
  })
}

// GET /api/siteadmin/users/list
export async function adminListAllUsers(token: string): Promise<APIResponse> {
  return request('/api/siteadmin/users/list', {
    method: 'GET',
    headers: {
      login: token,
    },
  })
}
