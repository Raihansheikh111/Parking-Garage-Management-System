import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import { requireAuth } from './middleware/auth.middleware.js'
import { connectDB } from './config/db.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import garageRoutes from './routes/garage.routes.js'
import parkingRoutes from './routes/parking.routes.js'
import spotRoutes, { availabilityRouter } from './routes/spot.routes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/garages', requireAuth, garageRoutes)
app.use('/api/spots', requireAuth, spotRoutes)
app.use('/api/garages', requireAuth, availabilityRouter)
app.use('/api/parking', requireAuth, parkingRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Parking Management API is running',
  })
})

app.use(errorMiddleware)

export async function startServer() {
  try {
    await connectDB()
    app.listen(port, () => {
      console.log(`Parking Management API listening on port : http://localhost:${port}`)
    })
  } catch (error) {
    console.error(`Unable to start server: ${error.message}`)
    process.exitCode = 1
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

export default app