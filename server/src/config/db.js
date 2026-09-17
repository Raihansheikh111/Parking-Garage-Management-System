import mongoose from 'mongoose'

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is required to start the server')
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}