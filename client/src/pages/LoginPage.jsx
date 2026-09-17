import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, setAuthSession } from '../services/auth.service.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await loginUser(form)
      login({ token: result.token, user: result.user })
      setAuthSession({ token: result.token, user: result.user })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        <button type="submit" disabled={isSubmitting}> {isSubmitting ? 'Signing in...' : 'Login'} </button>
      </form>
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
