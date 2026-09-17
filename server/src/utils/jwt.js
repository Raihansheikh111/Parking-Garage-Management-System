import jwt from 'jsonwebtoken'
import { createHttpError } from '../middleware/error.middleware.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, 'JWT_SECRET is not configured')
  }
  return process.env.JWT_SECRET
}

export function signUserToken(userId) {
  return jwt.sign({ userId: userId.toString() }, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyUserToken(token) {
  return jwt.verify(token, getJwtSecret())
}