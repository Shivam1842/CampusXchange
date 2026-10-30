const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
const TOKEN_KEY = 'campusxchange.token'
const SESSION_EXPIRED_EVENT = 'campusxchange:session-expired'

export class ApiError extends Error {
  constructor(message, errors = [], status = 500) {
    const validation = errors.map((error) => error?.field ? `${error.field}: ${error.message}` : error?.message).filter(Boolean)
    super(validation.length ? `${message} ${validation.join(' ')}` : message)
    this.name = 'ApiError'
    this.errors = errors
    this.status = status
  }
}

export async function api(path, { body, ...options } = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new ApiError('The service could not be reached. Check your connection and try again.', [], 0)
  }

  const result = await response.json().catch(() => ({}))
  if (response.status === 401 && token) {
    clearSession()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
  if (!response.ok || result.success === false) {
    throw new ApiError(result.message || 'The request failed.', result.errors || [], response.status)
  }
  return result
}

export const auth = {
  login: (body) => api('/auth/login', { method: 'POST', body }),
  register: (body) => api('/auth/register', { method: 'POST', body }),
  me: () => api('/auth/me'),
  logout: () => api('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => api('/auth/reset-password', { method: 'POST', body: { token, password } }),
  verifyEmail: (token) => api('/auth/verify-email', { method: 'POST', body: { token } }),
  google: (credential, role) => api('/auth/google', { method: 'POST', body: { credential, role } }),
}

export async function uploadToCloudinary(endpoint, file) {
  const signed = await api(endpoint)
  const { url, apiKey, params, signature } = signed.data
  const form = new FormData()
  Object.entries(params).forEach(([key, value]) => form.append(key, value))
  form.append('api_key', apiKey)
  form.append('signature', signature)
  form.append('file', file)
  const response = await fetch(url, { method: 'POST', body: form })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.secure_url || !result.public_id) throw new ApiError(result.error?.message || 'The file upload failed.', [], response.status)
  return { url: result.secure_url, publicId: result.public_id, format: result.format, resourceType: result.resource_type }
}

export const projectApi = {
  list: (params = {}) => api(`/projects?${new URLSearchParams(params)}`),
  get: (id) => api(`/projects/${id}`),
  apply: (id, body) => api(`/projects/${id}/apply`, { method: 'POST', body }),
}

export function saveSession({ user, token }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('campusxchange.user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('campusxchange.user')
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('campusxchange.user') || 'null') } catch { return null }
}

export function hasSession() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export { SESSION_EXPIRED_EVENT }
