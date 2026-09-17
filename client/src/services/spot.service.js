import { apiRequest } from './api.js'

export async function getAvailability(garageId, type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  return apiRequest(`/garages/${garageId}/spots/availability${query}`)
}
