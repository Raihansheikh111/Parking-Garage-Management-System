import mongoose from 'mongoose'

const parkingSpotSchema = new mongoose.Schema(
  {
    garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true, index: true },
    level: { type: Number, required: true, min: 1, validate: Number.isInteger },
    spotNumber: { type: String, required: true, trim: true },
    type: { type: String, enum: ['compact', 'standard', 'ev'], required: true, index: true },
    status: { type: String, enum: ['available', 'occupied'], default: 'available', index: true },
  },
  { timestamps: true },
)

parkingSpotSchema.index({ garageId: 1, level: 1, spotNumber: 1 }, { unique: true })
parkingSpotSchema.index({ garageId: 1, type: 1, status: 1 })

export default mongoose.model('ParkingSpot', parkingSpotSchema)