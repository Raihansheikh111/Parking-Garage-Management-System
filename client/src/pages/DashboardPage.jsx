import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listGarages } from '../services/garage.service.js'
import { getAvailability } from '../services/spot.service.js'
import { setSelectedGarageId } from '../utils/storage.js'

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [garages, setGarages] = useState([])
  const [selectedGarageId, setSelectedGarageIdState] = useState(localStorage.getItem('pms_garage_id') || '')
  const [summary, setSummary] = useState({ total: 0, available: 0, occupied: 0, ev: { total: 0, available: 0, occupied: 0 } })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!token) return
      try {
        setIsLoading(true)
        const garageResponse = await listGarages()
        const nextGarages = garageResponse.data || []
        setGarages(nextGarages)

        const garageId = selectedGarageId || (nextGarages[0]?._id ?? '')
        if (garageId) {
          setSelectedGarageId(garageId)
          setSelectedGarageIdState(garageId)
          const stats = await getAvailability(garageId)
          const total = Object.values(stats).reduce((acc, item) => acc + (item.total || 0), 0)
          const available = Object.values(stats).reduce((acc, item) => acc + (item.available || 0), 0)
          const occupied = Object.values(stats).reduce((acc, item) => acc + (item.occupied || 0), 0)
          const evStats = stats.ev || { total: 0, available: 0, occupied: 0 }
          setSummary({ total, available, occupied, ev: evStats })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  async function handleGarageChange(event) {
    const garageId = event.target.value
    setSelectedGarageIdState(garageId)
    setSelectedGarageId(garageId)

    try {
      const stats = await getAvailability(garageId)
      const total = Object.values(stats).reduce((acc, item) => acc + (item.total || 0), 0)
      const available = Object.values(stats).reduce((acc, item) => acc + (item.available || 0), 0)
      const occupied = Object.values(stats).reduce((acc, item) => acc + (item.occupied || 0), 0)
      const evStats = stats.ev || { total: 0, available: 0, occupied: 0 }
      setSummary({ total, available, occupied, ev: evStats })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name || 'Driver'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/check-in">Check-in</Link>
          <Link to="/check-out">Check-out</Link>
          <Link to="/search">Search</Link>
          <Link to="/history">History</Link>
          <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      <label style={{ display: 'block', marginBottom: 16 }}>
        Select garage
        <select value={selectedGarageId} onChange={handleGarageChange} style={{ display: 'block', width: '100%', marginTop: 8 }}>
          {garages.map((garage) => (
            <option key={garage._id} value={garage._id}>{garage.name}</option>
          ))}
        </select>
      </label>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {isLoading ? <p>Loading garage availability...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <StatCard label="Total spots" value={summary.total} />
          <StatCard label="Available spots" value={summary.available} />
          <StatCard label="Occupied spots" value={summary.occupied} />
          <StatCard label="EV availability" value={`${summary.ev.available}/${summary.ev.total}`} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 20, background: '#fff' }}>
      <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  )
}
