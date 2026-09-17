import ParkingSession from '../models/ParkingSession.js'
import { createHttpError } from '../middleware/error.middleware.js'
import { checkInVehicle, checkOutVehicle } from '../services/parking.service.js'
import { normalizePlate } from '../utils/normalizePlate.js'

function sessionResponse(session) {
  const spot = session.spotId
  return {
    id: session._id,
    plateNumber: session.plateNumber,
    vehicleType: session.vehicleType,
    status: session.status,
    spot: spot && {
      id: spot._id,
      level: spot.level,
      spotNumber: spot.spotNumber,
      type: spot.type,
    },
    checkInTime: session.checkInTime,
    checkOutTime: session.checkOutTime,
    fee: session.fee,
  }
}

export async function checkIn(req, res) {
  const { garageId, plateNumber, vehicleType } = req.body
  if (!garageId || typeof plateNumber !== 'string' || !plateNumber.trim() || !vehicleType) {
    throw createHttpError(400, 'garageId, plateNumber, and vehicleType are required')
  }
  if (!['compact', 'standard', 'ev'].includes(vehicleType)) {
    throw createHttpError(400, 'vehicleType must be compact, standard, or ev')
  }
  const session = await checkInVehicle({ garageId, plateNumber, vehicleType })
  res.status(201).json({ message: 'Vehicle checked in successfully', session: sessionResponse(session) })
}

export async function checkOut(req, res) {
  const { plateNumber } = req.body
  if (typeof plateNumber !== 'string' || !plateNumber.trim()) throw createHttpError(400, 'plateNumber is required')
  const receipt = await checkOutVehicle(plateNumber)
  res.json({
    message: 'Vehicle checked out successfully',
    receipt,
  })
}

export async function searchSessions(req, res) {
  if (typeof req.query.plate !== 'string' || !req.query.plate.trim()) throw createHttpError(400, 'plate query is required')
  const plate = normalizePlate(req.query.plate)
  const sessions = await ParkingSession.find({ plateNumber: { $regex: escapeRegex(plate) } })
    .sort({ checkInTime: -1 })
    .populate('spotId')
  res.json(sessions.map(sessionResponse))
}

export async function listSessions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
  const filters = {}
  for (const field of ['garageId', 'status']) {
    if (req.query[field]) filters[field] = req.query[field]
  }
  if (req.query.plate) filters.plateNumber = { $regex: escapeRegex(normalizePlate(req.query.plate)) }

  const allowedSortFields = ['checkInTime', 'checkOutTime', 'plateNumber', 'fee', 'status']
  const sortField = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'checkInTime'
  const sortOrder = req.query.order === 'asc' ? 1 : -1
  const [sessions, total] = await Promise.all([
    ParkingSession.find(filters).populate('spotId').sort({ [sortField]: sortOrder }).skip((page - 1) * limit).limit(limit),
    ParkingSession.countDocuments(filters),
  ])

  res.json({
    data: sessions.map(sessionResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function getSession(req, res) {
  const session = await ParkingSession.findById(req.params.id).populate('spotId')
  if (!session) throw createHttpError(404, 'Parking session not found')
  res.json(sessionResponse(session))
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}