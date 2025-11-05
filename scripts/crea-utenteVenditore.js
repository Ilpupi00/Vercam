#!/usr/bin/env node
'use strict';

const path = require('path');
const db = require(path.resolve(__dirname, '..', 'db', 'database'));
const bcrypt = require('bcryptjs');

function usage() {
  console.log('Usage: node scripts/crea-utenteVenditore.js <email> <password> [username]');
  console.log('Example: node scripts/crea-utenteVenditore.js mario@example.com S3cr3t mario');
  process.exit(1);
}

const args = process.argv.slice(2);

function prompt(question) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function promptPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    let password = '';
    stdin.on('data', onData);

    function onData(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdout.write('\n');
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdout.write('\n');
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine();
            stdout.cursorTo(0);
            stdout.write(question + '*'.repeat(password.length));
          }
          break;
        default:
          // append
          password += char;
          stdout.write('*');
          break;
      }
    }
  });
}

async function main() {
  let email, password, usernameArg;

  if (args.length >= 2) {
    [email, password, usernameArg] = args;
  } else {
    // interactive
    email = (await prompt('Email: ')).trim();
    if (!email) { console.error('Email richiesta'); process.exit(1); }
    password = await promptPassword('Password: ');
    const password2 = await promptPassword('Conferma password: ');
    if (password !== password2) { console.error('Le password non corrispondono'); process.exit(1); }
    usernameArg = (await prompt('Username (opzionale, invio per usare la parte prima di @): ')).trim() || undefined;
  }

  if (!email || !password) usage();

  let username = usernameArg || (email.split('@')[0] || 'user');
  // sanitize username
  username = username.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 50) || 'user';

  db.serialize(() => {
    // Usiamo direttamente il tipo con id = 1 (assunto come fornito)
    const assumedTipoId = 1;

    function continueWithTipo(tipoId) {
      // verificare che username non esista già
      db.get('SELECT id FROM users WHERE username = ?', [username], (err2, row2) => {
        if (err2) {
          console.error('Errore controllo username:', err2);
          process.exit(1);
        }
        if (row2) {
          // crea fallback
          const suffix = '_' + Date.now().toString().slice(-4);
          username = username.slice(0, 45) + suffix;
          console.log('Username esistente, uso fallback:', username);
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const insertSql = 'INSERT INTO users (tipo, username, email, password_hash) VALUES (?, ?, ?, ?)';
        db.run(insertSql, [tipoId, username, email, passwordHash], function (err3) {
          if (err3) {
            if (err3.code === 'SQLITE_CONSTRAINT') {
              console.error('Vincolo non rispettato (email o username già esistente):', err3.message);
            } else {
              console.error('Errore inserimento utente:', err3);
            }
            process.exit(1);
          }
          console.log('Utente creato con id', this.lastID, 'username:', username, 'email:', email);
          process.exit(0);
        });
      });
    }

    // Verifica rapida: se non esiste il tipo con id 1, avvisa ma procedi comunque
    db.get('SELECT id FROM user_tipo WHERE id = ?', [assumedTipoId], (err, row) => {
      if (err) {
        console.error('Errore durante la verifica del ruolo:', err);
        process.exit(1);
      }
      if (!row) {
        console.warn('Avviso: nessun record in user_tipo con id=1 trovato; lo script userà comunque tipo=1. Se necessario, aggiungi il ruolo manualmente.');
      }
      continueWithTipo(assumedTipoId);
    });
  });

  // nel caso in cui lo script venga interrotto dal nodo, chiudiamo la connessione
  process.on('exit', () => {
    try { db.close(); } catch (e) {}
  });
}

main();
