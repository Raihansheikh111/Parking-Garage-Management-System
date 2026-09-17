export function normalizePlate(plateNumber) {
  if (typeof plateNumber !== 'string') {
    throw new TypeError('Plate number must be a string')
  }
  return plateNumber.trim().toUpperCase()
}