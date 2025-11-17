const path = require('path');

// Use PostgreSQL when DATABASE_URL is provided or USE_PG=1, otherwise fall back to sqlite
const usePg = !!process.env.DATABASE_URL || process.env.USE_PG === '1';

if (usePg) {
    const { Pool } = require('pg');
    const connectionString = process.env.DATABASE_URL || null;
    const pool = new Pool(connectionString ? { connectionString } : {});

    console.log('Using Postgres database' + (connectionString ? (' (' + connectionString.replace(/:\/\/.*@/, '://') + ')') : ''));

    // helper: convert sqlite-style ? placeholders to $1, $2, ... for pg
    function convertPlaceholders(sql) {
        let idx = 0;
        return sql.replace(/\?/g, () => {
            idx += 1;
            return '$' + idx;
        });
    }

    const adapter = {
        serialize(fn) {
            // sqlite serialize ensures sequential execution; here we simply call the function
            if (typeof fn === 'function') fn();
        },
        get(sql, params, cb) {
            const q = convertPlaceholders(sql);
            pool.query(q, params || [])
                .then(res => cb(null, res.rows[0] || undefined))
                .catch(err => cb(err));
        },
        all(sql, params, cb) {
            const q = convertPlaceholders(sql);
            pool.query(q, params || [])
                .then(res => cb(null, res.rows))
                .catch(err => cb(err));
        },
        run(sql, params, cb) {
            let q = (sql || '').trim();
            const isInsert = /^insert\s+/i.test(q);
            // If INSERT and no RETURNING present, add RETURNING id so we can emulate lastID
            if (isInsert && !/returning\s+/i.test(q)) {
                q = q + ' RETURNING id';
            }
            q = convertPlaceholders(q);
            pool.query(q, params || [])
                .then(res => {
                    const ctx = { lastID: (res.rows && res.rows[0] && (res.rows[0].id || res.rows[0].lastid)) ? (res.rows[0].id || res.rows[0].lastid) : null, changes: res.rowCount };
                    if (typeof cb === 'function') cb.apply(ctx, [null]);
                })
                .catch(err => {
                    if (typeof cb === 'function') cb(err);
                });
        },
        close() {
            return pool.end();
        }
    };

    module.exports = adapter;

} else {
    // Fallback to sqlite (existing behaviour)
    const sqlite = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, './vercam.db');

    const db = new sqlite.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to sqlite database', err);
        } else {
            console.log('Connected to sqlite database');
        }
    });

    module.exports = db;
}