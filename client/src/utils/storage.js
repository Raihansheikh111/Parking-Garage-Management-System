export function getSelectedGarageId() {
  return localStorage.getItem('pms_garage_id')
}

export function setSelectedGarageId(garageId) {
  if (garageId) {
    localStorage.setItem('pms_garage_id', garageId)
    return
  }

  localStorage.removeItem('pms_garage_id')
}
