import { Router } from 'express'
import { createGarage, getGarage, listGarages, updateGarage } from '../controllers/garage.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/', asyncHandler(createGarage))
router.get('/', asyncHandler(listGarages))
router.get('/:id', asyncHandler(getGarage))
router.put('/:id', asyncHandler(updateGarage))

export default router