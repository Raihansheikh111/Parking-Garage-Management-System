import { apiRequest } from './api.js'

export async function checkInVehicle(payload) {
  return apiRequest('/parking/check-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function checkOutVehicle(plateNumber) {
  return apiRequest('/parking/check-out', {
    method: 'POST',
    body: JSON.stringify({ plateNumber }),
  })
}

export async function searchSessions(plate) {
  const query = new URLSearchParams({ plate })
  return apiRequest(`/parking/search?${query.toString()}`)
}

export async function listSessions({ page = 1, limit = 10, sort = 'checkInTime', order = 'desc', plate = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order })
  if (plate) params.set('plate', plate)
  return apiRequest(`/parking/sessions?${params.toString()}`)
}
