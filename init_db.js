const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDB() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });

  try {
    const sqlPath = path.join(__dirname, 'migration', 'postgres_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDB();