import express from 'express'
import cors from 'cors'
import campaignRoutes from './api/campaigns/index.js'
import { pool } from './db/index.js'
import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Настройки CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400
}

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))

// Security middleware
app.use((req, res, next) => {
  // Устанавливаем заголовки безопасности
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join('; '))

  // Дополнительные заголовки
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

// Логирование запросов
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`)
  
  res.on('finish', () => {
    const duration = Date.now() - start
    if (res.statusCode >= 400 || duration > 1000) {
      console.warn(`[ПОДОЗРИТЕЛЬНАЯ АКТИВНОСТЬ] ${req.method} ${req.url} - IP: ${req.ip} - Status: ${res.statusCode} - Duration: ${duration}ms`)
    }
  })
  next()
})

// Базовый роут для проверки
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API сервер работает' })
})

// Routes
app.use('/api/campaigns', campaignRoutes)

// Обработка 404
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url)
  res.status(404).json({
    error: true,
    message: 'Страница не найдена',
    path: req.url
  })
})

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err)
  res.status(500).json({
    error: true,
    message: 'Внутренняя ошибка сервера'
  })
})

// Запуск сервера
app.listen(PORT, async () => {
  try {
    // Проверяем подключение к БД при запуске сервера
    await pool.query('SELECT NOW()')
    console.log(`API сервер запущен на порту ${PORT}`)
    console.log(`Базовый URL: http://localhost:${PORT}/api`)
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error)
    process.exit(1)
  }
}) 