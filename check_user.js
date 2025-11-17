const db = require('./db/database');

console.log('Checking user...');

db.serialize(() => {
  db.get('SELECT id, username, email, password_hash FROM users WHERE email = ?', ['lucalupi03@gmail.com'], (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('User:', row);
    }
    process.exit(err ? 1 : 0);
  });
});