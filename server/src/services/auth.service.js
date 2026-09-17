import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { createHttpError } from '../middleware/error.middleware.js'
import { signUserToken } from '../utils/jwt.js'

const PASSWORD_MINIMUM_LENGTH = 8

export function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  }
}

export async function registerUser({ name, email, password }) {
  validateRegistrationInput({ name, email, password })
  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await User.exists({ email: normalizedEmail })
  if (existingUser) throw createHttpError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash })
  return toSafeUser(user)
}

export async function loginUser({ email, password }) {
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    throw createHttpError(400, 'email and password are required')
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createHttpError(401, 'Invalid email or password')
  }

  return { token: signUserToken(user._id), user: toSafeUser(user) }
}

function validateRegistrationInput({ name, email, password }) {
  if (typeof name !== 'string' || !name.trim()) throw createHttpError(400, 'name is required')
  if (typeof email !== 'string' || !email.trim()) throw createHttpError(400, 'email is required')
  if (typeof password !== 'string' || !password) throw createHttpError(400, 'password is required')
  if (password.length < PASSWORD_MINIMUM_LENGTH) {
    throw createHttpError(400, `password must be at least ${PASSWORD_MINIMUM_LENGTH} characters`)
  }
}