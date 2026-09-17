import mongoose from 'mongoose'
import Garage from '../models/Garage.js'
import ParkingSpot from '../models/ParkingSpot.js'
import { createHttpError } from '../middleware/error.middleware.js'

export async function createSpot(req, res) {
  const { garageId, level, spotNumber, type } = req.body
  if (!garageId || level === undefined || !spotNumber || !type) {
    throw createHttpError(400, 'garageId, level, spotNumber, and type are required')
  }

  const garage = await Garage.findById(garageId)
  if (!garage) throw createHttpError(404, 'Garage not found')
  if (level > garage.levels) throw createHttpError(400, 'Spot level exceeds garage levels')

  const spot = await ParkingSpot.create({ garageId, level, spotNumber, type })
  res.status(201).json(spot)
}

export async function listSpots(req, res) {
  const filters = {}
  for (const field of ['garageId', 'type', 'status']) {
    if (req.query[field]) filters[field] = req.query[field]
  }
  if (req.query.level) filters.level = Number.parseInt(req.query.level, 10)

  const spots = await ParkingSpot.find(filters).sort({ level: 1, spotNumber: 1 })
  res.json(spots)
}

export async function getAvailability(req, res) {
  if (!mongoose.isValidObjectId(req.params.garageId)) {
    throw createHttpError(400, 'Invalid garage ID')
  }
  const match = { garageId: new mongoose.Types.ObjectId(req.params.garageId) }
  if (req.query.type) {
    if (!['compact', 'standard', 'ev'].includes(req.query.type)) {
      throw createHttpError(400, 'type must be compact, standard, or ev')
    }
    match.type = req.query.type
  }

  const availability = await ParkingSpot.aggregate([
    { $match: match },
    { $group: {
      _id: '$type',
      total: { $sum: 1 },
      available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
      occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
    } },
  ])

  if (req.query.type) {
    const result = availability[0] || { total: 0, available: 0, occupied: 0 }
    return res.json({ type: req.query.type, total: result.total, available: result.available, occupied: result.occupied })
  }

  const grouped = {}
  for (const item of availability) {
    grouped[item._id] = { total: item.total, available: item.available, occupied: item.occupied }
  }
  res.json(grouped)
}