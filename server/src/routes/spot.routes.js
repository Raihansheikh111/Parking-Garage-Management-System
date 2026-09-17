import { Router } from 'express'
import { createSpot, getAvailability, listSpots } from '../controllers/spot.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/', asyncHandler(createSpot))
router.get('/', asyncHandler(listSpots))

export const availabilityRouter = Router()
availabilityRouter.get('/:garageId/spots/availability', asyncHandler(getAvailability))

export default router