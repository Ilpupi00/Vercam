#!/usr/bin/env node
'use strict';

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: set the DATABASE_URL environment variable to your Postgres connection string.');
    console.error("Example: export DATABASE_URL='postgres://user:pass@localhost:5432/vercam'");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  const sqlitePath = path.resolve(__dirname, '..', 'db', 'vercam.db');
  const sqlite = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Could not open sqlite DB at', sqlitePath, err);
      process.exit(1);
    }
  });

  function sqliteAll(sql, params) {
    return new Promise((resolve, reject) => {
      sqlite.all(sql, params || [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  // tables to copy in dependency order
  const tables = ['user_tipo', 'users', 'emails', 'documenti'];

  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    const initSqlPath = path.resolve(__dirname, '..', 'migration', 'postgres_init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);
    console.log('Tables created or already exist.');

    console.log('Beginning import transaction...');
    await client.query('BEGIN');

    // user_tipo
    const userTipos = await sqliteAll('SELECT id, descrizione FROM user_tipo');
    console.log('userTipos:', userTipos);
    let idCounter = 1;
    for (const t of userTipos) {
      const insertId = t.id || ++idCounter;
      await client.query(
        'INSERT INTO user_tipo (id, descrizione, tipo_utente) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET descrizione = EXCLUDED.descrizione, tipo_utente = EXCLUDED.tipo_utente',
        [insertId, t.descrizione, 'user']
      );
    }
    console.log(`Imported user_tipo rows: ${userTipos.length}`);

    // users
    const users = await sqliteAll('SELECT id, tipo, username, email, password_hash, created_at, updated_at FROM users');
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, tipo, username, email, password_hash, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           tipo = EXCLUDED.tipo,
           username = EXCLUDED.username,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [u.id, u.tipo, u.username, u.email, u.password_hash, u.created_at || null, u.updated_at || null]
      );
    }
    console.log(`Imported users rows: ${users.length}`);

    // emails
    const emails = await sqliteAll('SELECT id, nome, email FROM emails');
    for (const e of emails) {
      await client.query(
        'INSERT INTO emails (id, nome, email) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email',
        [e.id, e.nome, e.email]
      );
    }
    console.log(`Imported emails rows: ${emails.length}`);

    // documenti
    const docs = await sqliteAll('SELECT id, titolo, contenuto, path, autore_id, created_at, updated_at FROM documenti');
    for (const d of docs) {
      await client.query(
        `INSERT INTO documenti (id, titolo, contenuto, path, tipo_documento, checksum, autore_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           titolo = EXCLUDED.titolo,
           contenuto = EXCLUDED.contenuto,
           path = EXCLUDED.path,
           tipo_documento = EXCLUDED.tipo_documento,
           checksum = EXCLUDED.checksum,
           autore_id = EXCLUDED.autore_id,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [d.id, d.titolo, d.contenuto, d.path, 'documento', '', d.autore_id, d.created_at || null, d.updated_at || null]
      );
    }
    console.log(`Imported documenti rows: ${docs.length}`);

    // update sequences for SERIAL primary keys
    const tablesToSeq = ['user_tipo', 'users', 'emails', 'documenti'];
    for (const tbl of tablesToSeq) {
      const seqRes = await client.query("SELECT pg_get_serial_sequence($1, 'id') AS seq", [tbl]);
      const seqName = seqRes.rows[0] && seqRes.rows[0].seq;
      if (seqName) {
        const setvalSql = `SELECT setval('${seqName}', (SELECT COALESCE(MAX(id),1) FROM ${tbl}))`;
        await client.query(setvalSql);
        console.log(`Updated sequence for ${tbl} -> ${seqName}`);
      }
    }

    await client.query('COMMIT');
    console.log('Import completed successfully.');

  } catch (err) {
    console.error('Import failed, rolling back. Error:', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exitCode = 1;
  } finally {
    client.release();
    sqlite.close();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
