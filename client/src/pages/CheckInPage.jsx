import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listGarages } from '../services/garage.service.js'
import { checkInVehicle } from '../services/parking.service.js'
import { getSelectedGarageId } from '../utils/storage.js'

export default function CheckInPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [garages, setGarages] = useState([])
  const [form, setForm] = useState({ garageId: getSelectedGarageId() || '', plateNumber: '', vehicleType: 'compact' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const response = await listGarages()
        const firstGarage = response.data?.[0]
        setGarages(response.data || [])
        if (!form.garageId && firstGarage) {
          setForm((current) => ({ ...current, garageId: firstGarage._id }))
        }
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setIsSubmitting(true)

    try {
      const response = await checkInVehicle(form)
      setResult(response.session)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: 24 }}>
      <h1>Check-In</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/check-out">Check-out</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Garage
          <select value={form.garageId} onChange={(event) => setForm((current) => ({ ...current, garageId: event.target.value }))} style={{ width: '100%', marginTop: 8 }}>
            {garages.map((garage) => (
              <option key={garage._id} value={garage._id}>{garage.name}</option>
            ))}
          </select>
        </label>
        <label>
          Plate number
          <input value={form.plateNumber} onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value }))} style={{ width: '100%', marginTop: 8 }} required />
        </label>
        <label>
          Vehicle type
          <select value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))} style={{ width: '100%', marginTop: 8 }}>
            <option value="compact">compact</option>
            <option value="standard">standard</option>
            <option value="ev">ev</option>
          </select>
        </label>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {result ? (
          <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
            <p><strong>Plate:</strong> {result.plateNumber}</p>
            <p><strong>Vehicle type:</strong> {result.vehicleType}</p>
            <p><strong>Spot:</strong> {result.spot?.spotNumber || 'N/A'}</p>
            <p><strong>Level:</strong> {result.spot?.level || 'N/A'}</p>
            <p><strong>Check-in:</strong> {new Date(result.checkInTime).toLocaleString()}</p>
            <p><strong>Status:</strong> {result.status}</p>
          </div>
        ) : null}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Checking in...' : 'Check in'}</button>
      </form>
    </div>
  )
}
