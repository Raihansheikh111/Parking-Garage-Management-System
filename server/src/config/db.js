import mongoose from 'mongoose'

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    return
  }

  await mongoose.connect(uri)
}