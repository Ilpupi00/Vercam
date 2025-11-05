
// DB connection helper for PostgreSQL
// Reads connection settings from .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || undefined,
	database: process.env.DB_NAME || 'Vercam',
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
	max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
	// This is a fatal error on the idle client — log it for observability
	console.error('Unexpected error on idle PostgreSQL client', err);
});

async function testConnection() {
	const client = await pool.connect();
	try {
		const res = await client.query('SELECT 1 AS ok');
		console.log('Postgres connection test result:', res.rows[0]);
		return res.rows[0].ok === 1;
	} finally {
		client.release();
	}
}

/**
 * Run a parameterized query using the pool.
 * Example: query('SELECT * FROM users WHERE id=$1', [id])
 */
async function query(text, params) {
	const start = Date.now();
	const res = await pool.query(text, params);
	const duration = Date.now() - start;
	// optional: log slow queries
	if (duration > 500) {
		console.warn('Slow query', { text, duration, params });
	}
	return res;
}

async function closePool() {
	await pool.end();
}

module.exports = {
	pool,
	query,
	testConnection,
	closePool
};
