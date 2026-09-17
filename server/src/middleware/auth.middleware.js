import User from '../models/User.js'
import { createHttpError } from './error.middleware.js'
import { verifyUserToken } from '../utils/jwt.js'

export async function requireAuth(req, _res, next) {
  try {
    const authorization = req.get('Authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw createHttpError(401, 'Authentication required')
    }

    const token = authorization.slice(7).trim()
    if (!token) throw createHttpError(401, 'Authentication required')

    const payload = verifyUserToken(token)
    const user = await User.findById(payload.userId).select('_id name email')
    if (!user) throw createHttpError(401, 'Authentication required')

    req.user = { id: user._id, name: user.name, email: user.email }
    next()
  } catch (error) {
    if (error.statusCode === 500) return next(error)
    return next(createHttpError(401, 'Authentication required'))
  }
}