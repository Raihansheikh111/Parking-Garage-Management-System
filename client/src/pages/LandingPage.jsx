import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 900, margin: '4rem auto', padding: 24 }}>
      <h1>Parking Management System</h1>
      <p>Manage garage availability, check-ins, check-outs, and parking history.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  )
}
