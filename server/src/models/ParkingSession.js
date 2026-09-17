import mongoose from 'mongoose'

const parkingSessionSchema = new mongoose.Schema(
  {
    garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true, index: true },
    spotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
    plateNumber: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: ['compact', 'standard', 'ev'], required: true },
    checkInTime: { type: Date, required: true, default: Date.now },
    checkOutTime: { type: Date },
    fee: { type: Number, min: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
  },
  { timestamps: true },
)

parkingSessionSchema.index({ garageId: 1, status: 1 })
parkingSessionSchema.index({ plateNumber: 1, status: 1 })
parkingSessionSchema.index(
  { plateNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
)

export default mongoose.model('ParkingSession', parkingSessionSchema)