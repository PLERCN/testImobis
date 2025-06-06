import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getClient } from './index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function initDatabase() {
  try {
    const db = await getClient()
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8')
    
    await db.query(sqlScript)
    
    console.log('База данных успешно инициализирована')
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error)
    process.exit(1)
  }
}

initDatabase() 