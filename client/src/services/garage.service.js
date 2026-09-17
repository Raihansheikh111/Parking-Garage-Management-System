import { apiRequest } from './api.js'

export async function listGarages() {
  return apiRequest('/garages')
}

export async function getGarage(garageId) {
  return apiRequest(`/garages/${garageId}`)
}
