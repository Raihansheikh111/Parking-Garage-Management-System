import Garage from '../models/Garage.js'
import { createHttpError } from '../middleware/error.middleware.js'

export async function createGarage(req, res) {
  const { name, address, levels, pricing } = req.body
  if (!name || !address || !pricing || levels === undefined) {
    throw createHttpError(400, 'name, address, levels, and pricing are required')
  }

  const garage = await Garage.create({ name, address, levels, pricing })
  res.status(201).json(garage)
}

export async function listGarages(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
  const [data, total] = await Promise.all([
    Garage.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Garage.countDocuments(),
  ])

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}

export async function getGarage(req, res) {
  const garage = await Garage.findById(req.params.id)
  if (!garage) throw createHttpError(404, 'Garage not found')
  res.json(garage)
}

export async function updateGarage(req, res) {
  const garage = await Garage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!garage) throw createHttpError(404, 'Garage not found')
  res.json(garage)
}