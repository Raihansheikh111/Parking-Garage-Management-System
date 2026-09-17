import { Router } from 'express'
import { checkIn, checkOut, getSession, listSessions, searchSessions } from '../controllers/parking.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/check-in', asyncHandler(checkIn))
router.post('/check-out', asyncHandler(checkOut))
router.get('/search', asyncHandler(searchSessions))
router.get('/sessions', asyncHandler(listSessions))
router.get('/sessions/:id', asyncHandler(getSession))

export default router