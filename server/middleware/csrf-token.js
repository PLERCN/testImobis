import { eventHandler } from 'h3'
import { randomBytes } from 'crypto'

// Генерация CSRF токена
const generateToken = () => randomBytes(32).toString('hex')

export default eventHandler(async (event) => {
  const res = event.node.res
  const cookies = event.node.req.headers.cookie || ''
  
  if (!cookies.includes('csrf-token=')) {
    const token = generateToken()
    res.setHeader('Set-Cookie', `csrf-token=${token}; HttpOnly; Secure; SameSite=Strict`)
  }
}) 