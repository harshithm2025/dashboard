export const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  setToken(data.session.access_token)
  return data
}

export async function signup(email, password) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Signup failed')
  setToken(data.session.access_token)
  return data
}

export async function getSession() {
  const token = getToken()
  if (!token) return { data: { session: null } }
  
  // Decoding a JWT superficially to check expiration (not secure check, server does it securely)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (Date.now() >= payload.exp * 1000) {
      clearToken()
      return { data: { session: null } }
    }
    return { data: { session: { access_token: token, user: { id: payload.sub, email: payload.email } } } }
  } catch(e) {
    clearToken()
    return { data: { session: null } }
  }
}
