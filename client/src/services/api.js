const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('pms_token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text()

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Request failed'
    throw new Error(message)
  }

  return payload
}

export { API_BASE_URL }
