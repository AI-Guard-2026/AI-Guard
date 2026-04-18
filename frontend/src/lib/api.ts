// src/lib/api.ts
// Central API client — all backend calls go through here
// Automatically attaches Clerk auth token to every request

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-guard-production.up.railway.app/api/v1'

async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `API error ${res.status}`)
  }

  if (res.status === 204) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

// ─── Users ───────────────────────────────────────────────
export async function registerUser(token: string, payload: {
  email: string
  full_name: string
  clerk_user_id: string
  role?: string
}) {
  return apiFetch('/users/register', token, {
    method: 'POST',
    body: JSON.stringify({ role: 'admin', ...payload }),
  })
}

export async function getMe(token: string) {
  return apiFetch('/users/me', token)
}

// ─── AI Systems ──────────────────────────────────────────
export async function listSystems(token: string, orgId: string, params?: {
  search?: string
  risk_tier?: string
  system_status?: string
  page?: number
  size?: number
}) {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.risk_tier && params.risk_tier !== 'All') query.set('risk_tier', params.risk_tier)
  if (params?.system_status) query.set('system_status', params.system_status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.size) query.set('size', String(params.size))

  const qs = query.toString()
  return apiFetch(`/organisations/${orgId}/ai-systems/${qs ? `?${qs}` : ''}`, token)
}

export async function createSystem(token: string, orgId: string, payload: {
  name: string
  vendor?: string
  purpose: string
  sector?: string
  is_in_eu_market?: boolean
}) {
  return apiFetch(`/organisations/${orgId}/ai-systems`, token, {
    method: 'POST',
    body: JSON.stringify({ is_in_eu_market: true, ...payload }),
  })
}

export async function deleteSystem(token: string, orgId: string, systemId: string) {
  return apiFetch(`/organisations/${orgId}/ai-systems/${systemId}`, token, {
    method: 'DELETE',
  })
}

// ─── CSV Import ──────────────────────────────────────────
export async function importCSV(token: string, orgId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/organisations/${orgId}/ai-systems/import-csv`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Import failed' }))
    throw new Error(error.detail || 'Import failed')
  }
  return res.json()
}

// ─── Classifications ─────────────────────────────────────
export async function classifySystem(token: string, orgId: string, systemId: string, answers: Record<string, string>) {
  return apiFetch(`/organisations/${orgId}/ai-systems/${systemId}/classify`, token, {
    method: 'POST',
    body: JSON.stringify({ questionnaire_answers: answers }),
  })
}

// ─── Documents ───────────────────────────────────────────
export async function generateDocument(token: string, orgId: string, systemId: string, answers: Record<string, string>) {
  return apiFetch(`/organisations/${orgId}/ai-systems/${systemId}/documents/generate`, token, {
    method: 'POST',
    body: JSON.stringify({ interview_answers: answers }),
  })
}

export async function exportPDF(token: string, orgId: string, systemId: string, documentId: string) {
  const res = await fetch(
    `${BASE_URL}/organisations/${orgId}/ai-systems/${systemId}/documents/${documentId}/export-pdf`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    }
  )
  if (!res.ok) throw new Error('PDF export failed')
  return res.blob()
}
