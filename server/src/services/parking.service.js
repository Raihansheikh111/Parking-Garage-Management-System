import Garage from '../models/Garage.js'
import ParkingSession from '../models/ParkingSession.js'
import ParkingSpot from '../models/ParkingSpot.js'
import { createHttpError } from '../middleware/error.middleware.js'
import { calculateParkingFee } from './fee.service.js'
import { normalizePlate } from '../utils/normalizePlate.js'

export async function checkInVehicle({ garageId, plateNumber, vehicleType }) {
  const normalizedPlate = normalizePlate(plateNumber)
  const garage = await Garage.findById(garageId)
  if (!garage) throw createHttpError(404, 'Garage not found')

  const existingSession = await ParkingSession.exists({ plateNumber: normalizedPlate, status: 'active' })
  if (existingSession) throw createHttpError(409, 'Vehicle is already parked')

  const spot = await ParkingSpot.findOneAndUpdate(
    { garageId, type: vehicleType, status: 'available' },
    { $set: { status: 'occupied' } },
    { new: true, sort: { level: 1, spotNumber: 1 } },
  )
  if (!spot) throw createHttpError(409, `No ${vehicleType} parking spot is currently available`)

  try {
    const session = await ParkingSession.create({
      garageId,
      spotId: spot._id,
      plateNumber: normalizedPlate,
      vehicleType,
    })
    await session.populate('spotId')
    return session
  } catch (error) {
    await ParkingSpot.findByIdAndUpdate(spot._id, { $set: { status: 'available' } })
    throw error
  }
}

export async function checkOutVehicle(plateNumber) {
  const normalizedPlate = normalizePlate(plateNumber)
  const session = await ParkingSession.findOne({ plateNumber: normalizedPlate, status: 'active' })
  if (!session) throw createHttpError(404, 'Active parking session not found')

  const garage = await Garage.findById(session.garageId)
  if (!garage) throw createHttpError(404, 'Garage not found')
  const checkOutTime = new Date()
  const billing = calculateParkingFee(session.checkInTime, checkOutTime, garage.pricing)

  session.checkOutTime = checkOutTime
  session.fee = billing.fee
  session.status = 'completed'
  await session.save()
  await ParkingSpot.findByIdAndUpdate(session.spotId, { $set: { status: 'available' } })
  const spot = await ParkingSpot.findById(session.spotId)

  return {
    plateNumber: session.plateNumber,
    spotNumber: spot?.spotNumber,
    checkInTime: session.checkInTime,
    checkOutTime,
    durationHours: billing.billableHours,
    fee: billing.fee,
  }
}