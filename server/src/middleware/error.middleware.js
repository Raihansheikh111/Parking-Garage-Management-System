export function errorMiddleware(error, _req, res, _next) {
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource ID' })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message })
  }

  if (error instanceof TypeError) {
    return res.status(400).json({ message: error.message })
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate resource' })
  }

  console.error(error)
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : 'Internal server error',
  })
}

export function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}