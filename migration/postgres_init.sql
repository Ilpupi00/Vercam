-- PostgreSQL schema for Vercam (converted from SQLite)
--
-- Usage:
-- 1) (optional) create a database and owner:
--    CREATE DATABASE vercam OWNER your_pg_user;
-- 2) connect to the database and run this file:
--    psql -U your_pg_user -d vercam -f postgres_init.sql
--

-- Enable the uuid-ossp extension if you want UUIDs (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_tipo
CREATE TABLE IF NOT EXISTS user_tipo (
  id SERIAL PRIMARY KEY,
  descrizione VARCHAR(50) NOT NULL,
  tipo_utente VARCHAR(20) NOT NULL
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tipo INTEGER NOT NULL REFERENCES user_tipo(id) ON DELETE RESTRICT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: emails
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);

-- Table: documenti
CREATE TABLE IF NOT EXISTS documenti (
  id SERIAL PRIMARY KEY,
  titolo VARCHAR(100) NOT NULL,
  contenuto TEXT NOT NULL,
  path VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(50) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  autore_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: sample insert for user_tipo
INSERT INTO user_tipo (descrizione, tipo_utente) VALUES ('admin', 'admin'), ('venditore', 'venditore'), ('cliente', 'cliente');

-- Notes:
-- - The original SQLite schema used AUTOINCREMENT and PRAGMA foreign_keys.
--   PostgreSQL manages sequences automatically with SERIAL and enforces foreign keys.
-- - If you prefer to use explicit sequences or UUID primary keys, adjust the
--   definitions accordingly.
