import { apiRequest } from './api.js'

export async function registerUser({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function loginUser({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function setAuthSession({ token, user }) {
  localStorage.setItem('pms_token', token)
  localStorage.setItem('pms_user', JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem('pms_token')
  localStorage.removeItem('pms_user')
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem('pms_user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}
