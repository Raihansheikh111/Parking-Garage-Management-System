const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

export function calculateParkingFee(checkInTime, checkOutTime, pricing) {
  const durationMilliseconds = Math.max(0, new Date(checkOutTime) - new Date(checkInTime))
  const billableHours = Math.max(1, Math.ceil(durationMilliseconds / HOUR_IN_MILLISECONDS))
  const calculatedFee = billableHours <= 1
    ? pricing.firstHour
    : pricing.firstHour + (billableHours - 1) * pricing.additionalHour

  return {
    billableHours,
    fee: Math.min(calculatedFee, pricing.dailyCap),
  }
}