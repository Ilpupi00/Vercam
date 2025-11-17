const db = require('./db/database');
const bcrypt = require('bcryptjs');

console.log('Updating password...');

const newPassword = 'password123';
const hash = bcrypt.hashSync(newPassword, 10);

db.serialize(() => {
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'lucalupi03@gmail.com'], function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Password updated, changes:', this.changes);
    }
    process.exit(err ? 1 : 0);
  });
});