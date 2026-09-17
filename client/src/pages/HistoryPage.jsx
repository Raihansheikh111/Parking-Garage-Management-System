import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listSessions } from '../services/parking.service.js'

export default function HistoryPage() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('checkInTime')
  const [order, setOrder] = useState('desc')
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!token) return
      setIsLoading(true)
      setError('')

      try {
        const response = await listSessions({ page, limit, sort, order })
        setSessions(response.data || [])
        setTotalPages(response.pagination?.totalPages || 1)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token, page, limit, sort, order])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24 }}>
      <h1>Parking History</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/search">Search</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <label>
          Page size
          <select value={limit} onChange={(event) => { setPage(1); setLimit(Number(event.target.value)) }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => { setPage(1); setSort(event.target.value) }}>
            <option value="checkInTime">Check-in time</option>
            <option value="plateNumber">Plate number</option>
            <option value="fee">Fee</option>
            <option value="status">Status</option>
          </select>
        </label>
        <label>
          Order
          <select value={order} onChange={(event) => { setPage(1); setOrder(event.target.value) }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {isLoading ? <p>Loading history...</p> : null}
      {!isLoading && sessions.length === 0 ? <p>No parking sessions found.</p> : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {sessions.map((session) => (
          <div key={session.id || session._id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
            <p><strong>Plate:</strong> {session.plateNumber}</p>
            <p><strong>Vehicle:</strong> {session.vehicleType}</p>
            <p><strong>Spot:</strong> {session.spot?.spotNumber || 'N/A'} / Level {session.spot?.level || 'N/A'}</p>
            <p><strong>Status:</strong> {session.status}</p>
            <p><strong>Check-in:</strong> {new Date(session.checkInTime).toLocaleString()}</p>
            {session.checkOutTime ? <p><strong>Check-out:</strong> {new Date(session.checkOutTime).toLocaleString()}</p> : null}
            {typeof session.fee === 'number' ? <p><strong>Fee:</strong> ${session.fee.toFixed(2)}</p> : null}
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' }}>
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</button>
        </div>
      ) : null}
    </div>
  )
}
