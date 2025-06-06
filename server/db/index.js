import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export const checkDatabaseConnection = async () => {
  try {
    const client = await getClient()
    await client.query('SELECT NOW()')
    client.release()
    return true
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error)
    return false
  }
}

export const checkConnection = async () => {
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT NOW()')
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Ошибка подключения к БД:', error)
    return false
  }
}

pool.on('error', (err) => {
  console.error('Неожиданная ошибка на клиенте пула:', err)
  setTimeout(checkConnection, 5000)
})


setInterval(checkConnection, 30000) 