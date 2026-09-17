import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { checkOutVehicle } from '../services/parking.service.js'

export default function CheckOutPage() {
  const { token } = useAuth()
  const [plateNumber, setPlateNumber] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setReceipt(null)
    setIsSubmitting(true)

    try {
      const response = await checkOutVehicle(plateNumber)
      setReceipt(response.receipt)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: 24 }}>
      <h1>Check-Out</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/check-in">Check-in</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Plate number
          <input value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} style={{ width: '100%', marginTop: 8 }} required />
        </label>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {receipt ? (
          <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
            <p><strong>Plate:</strong> {receipt.plateNumber}</p>
            <p><strong>Spot:</strong> {receipt.spotNumber}</p>
            <p><strong>Check-in:</strong> {new Date(receipt.checkInTime).toLocaleString()}</p>
            <p><strong>Check-out:</strong> {new Date(receipt.checkOutTime).toLocaleString()}</p>
            <p><strong>Duration:</strong> {receipt.durationHours} hours</p>
            <p><strong>Fee:</strong> ${Number(receipt.fee || 0).toFixed(2)}</p>
          </div>
        ) : null}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Check out'}</button>
      </form>
    </div>
  )
}
