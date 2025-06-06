import { eventHandler, createError } from 'h3'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']

export default eventHandler(async (event) => {
  const origin = event.node.req.headers.origin
  const res = event.node.res

  if (!origin) {
    return
  }

  if (!allowedOrigins.includes(origin)) {
    console.warn(`Заблокирован запрос с неразрешенного origin: ${origin}`)
    throw createError({
      statusCode: 403,
      message: 'Доступ запрещен'
    })
  }

  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization, Accept')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')

  if (event.node.req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
}) 