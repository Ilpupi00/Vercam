const db = require('./db/database');

console.log('Checking tables...');

db.serialize(() => {
  db.all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Tables:', rows.map(r => r.table_name));
    }
    process.exit(err ? 1 : 0);
  });
});