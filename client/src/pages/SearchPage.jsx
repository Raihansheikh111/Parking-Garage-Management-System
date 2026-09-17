import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { searchSessions } from '../services/parking.service.js'

export default function SearchPage() {
  const { token } = useAuth()
  const [plate, setPlate] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await searchSessions(plate)
      setResults(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <h1>Search</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/history">History</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Search plate" style={{ flex: 1 }} />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {results.length === 0 && !isLoading && plate ? <p>No matching sessions found.</p> : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((session) => (
          <div key={session.id || session._id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
            <p><strong>Plate:</strong> {session.plateNumber}</p>
            <p><strong>Vehicle:</strong> {session.vehicleType}</p>
            <p><strong>Status:</strong> {session.status}</p>
            <p><strong>Spot:</strong> {session.spot?.spotNumber || 'N/A'} / Level {session.spot?.level || 'N/A'}</p>
            <p><strong>Check-in:</strong> {new Date(session.checkInTime).toLocaleString()}</p>
            {session.checkOutTime ? <p><strong>Check-out:</strong> {new Date(session.checkOutTime).toLocaleString()}</p> : null}
            {session.fee ? <p><strong>Fee:</strong> ${Number(session.fee).toFixed(2)}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
