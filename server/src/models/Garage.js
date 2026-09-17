import mongoose from 'mongoose'

const pricingSchema = new mongoose.Schema(
  {
    firstHour: { type: Number, required: true, min: 0 },
    additionalHour: { type: Number, required: true, min: 0 },
    dailyCap: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const garageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    levels: { type: Number, required: true, min: 1, validate: Number.isInteger },
    pricing: { type: pricingSchema, required: true },
  },
  { timestamps: true },
)

export default mongoose.model('Garage', garageSchema)