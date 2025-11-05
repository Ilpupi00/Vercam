-- create_db.sql
-- Usage: run this as a Postgres superuser (eg. `psql -U postgres -f db/create_db.sql`)
-- WARNING: replace the password placeholder before using in production

-- Create a dedicated role/user for the application
CREATE ROLE vercam_user WITH LOGIN PASSWORD 'CHANGE_ME_SECURE_PASSWORD';

-- Create the database owned by the application user
-- template0 and UTF8 are safe defaults; adjust locale if needed
CREATE DATABASE vercam OWNER vercam_user TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C';

-- Grant privileges explicitly (optional, owner already has full privileges)
GRANT ALL PRIVILEGES ON DATABASE vercam TO vercam_user;

-- NOTE: After creating the DB, run the migration file against the `vercam` database:
--   psql -U vercam_user -d vercam -f migrations/001_init.sql
