const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

async function applyMigrations() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const { rows: appliedMigrations } = await client.query('SELECT name FROM migrations')
    const appliedMigrationNames = appliedMigrations.map(m => m.name)

    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
      
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`)
        const migrationPath = path.join(migrationsDir, file)
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

        await client.query('BEGIN')
        try {
          await client.query(migrationSQL)
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file])
          await client.query('COMMIT')
          console.log(`Successfully applied migration: ${file}`)
        } catch (error) {
          await client.query('ROLLBACK')
          console.error(`Error applying migration ${file}:`, error)
          throw error
        }
      }
    }

    console.log('All migrations applied successfully')
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigrations().catch(console.error) 