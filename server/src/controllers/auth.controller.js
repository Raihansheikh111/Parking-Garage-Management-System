import { loginUser, registerUser } from '../services/auth.service.js'

export async function register(req, res) {
  const user = await registerUser(req.body)
  res.status(201).json({ message: 'Registration successful', user })
}

export async function login(req, res) {
  const { token, user } = await loginUser(req.body)
  res.json({ message: 'Login successful', token, user })
}