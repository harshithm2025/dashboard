import { getSession } from '@/lib/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API = `${BASE_URL}/api/brands`

async function getAuthHeaders() {
  const { data: { session } } = await getSession()
  if (!session) throw new Error("No active session found")
  return {
    'Authorization': `Bearer ${session.access_token}`
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getBrands() {
  const headers = await getAuthHeaders()
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to load brands: ${res.statusText}`)
  return res.json()
}

export async function getBrand(id, isPublic = false) {
  if (isPublic) {
    const res = await fetch(`${BASE_URL}/api/public/brands/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Failed to load public brand "${id}": ${res.statusText}`)
    return res.json()
  }

  const headers = await getAuthHeaders()
  const res = await fetch(`${API}/${id}`, { headers })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to load brand "${id}": ${res.statusText}`)
  return res.json()
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function addBrand({ bundle, logo, heroBg, label }) {
  const headers = await getAuthHeaders()
  const form = new FormData()
  form.append('bundle', JSON.stringify(bundle))
  form.append('label',  label)
  if (logo)   form.append('logo',       logo)
  if (heroBg) form.append('background', heroBg)

  const res = await fetch(API, { method: 'POST', body: form, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ─── Update ───────────────────────────────────────────────────────────────────



export async function updateBrand(id, changes) {
  const headers = await getAuthHeaders()
  const form = new FormData()

  if (changes.label)   form.append('label',   changes.label)
  if (changes.tokens)  form.append('tokens',  JSON.stringify(changes.tokens))
  if (changes.bundle)  form.append('bundle',  JSON.stringify(changes.bundle))
  if (changes.logo)    form.append('logo',    changes.logo)
  if (changes.heroBg)  form.append('background', changes.heroBg)

  const res = await fetch(`${API}/${id}`, { method: 'PUT', body: form, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBrand(id) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
}

// ─── Share ────────────────────────────────────────────────────────────────────

export async function shareBrand(id, isShared) {
  const headers = await getAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API}/${id}/share`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_shared: isShared })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ─── Emailer ──────────────────────────────────────────────────────────────────

export async function getEmailer(id) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API}/${id}/emailer`, { headers })
  if (!res.ok) return {}
  return res.json()
}

export async function saveEmailer(id, settings) {
  const headers = await getAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API}/${id}/emailer`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(settings),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Failed to save emailer settings')
  }
  return res.json()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hexToNavBg(hex, alpha = 0.08) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
