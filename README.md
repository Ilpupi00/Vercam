# VercamStatico
Sito Vercam

## Configurare l'invio email

Per inviare email dal server è stato aggiunto un semplice mailer basato su `nodemailer`.

1. Copia il file `.env.example` in `.env` e modifica i valori:

	- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
	- MAIL_FROM (campo From usato per inviare)
	- MAIL_TO (destinatario delle email di contatto)

2. Installa le dipendenze e avvia il server:

```
npm install
npm start
```

3. Endpoint per inviare email (POST): `/email`

	Body JSON: `{ "name": "Mario", "email": "mario@example.com", "message": "Ciao", "subject": "Opzionale" }`

Risponderà con `{ ok: true }` in caso di successo.

