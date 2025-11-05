const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sendMail, transporter } = require('../src/configuration/mailer');

(async () => {
  try {
    const to = process.env.MAIL_TO || process.env.MAIL_FROM;
    if (!to) {
      console.error('Nessun destinatario configurato in MAIL_TO o MAIL_FROM');
      process.exit(1);
    }

    const html = `
      <!doctype html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#fff;padding:20px;">
        <h1 style="color:#0b2a3a">Test HTML minimale</h1>
        <p>Se vedi questo paragrafo in grassetto e colore, Gmail sta mostrando l'HTML correttamente.</p>
        <p style="font-weight:700;color:#0b8f5a">Contenuto HTML visibile</p>
      </body>
      </html>
    `;

    console.log('Invio test minimal HTML a:', to);
    const info = await sendMail({ to, subject: 'Test minimal HTML - Vercam', text: 'Versione testuale di fallback', html });
    console.log('Risultato invio:', info && info.response ? info.response : info);
    if (transporter && typeof transporter.close === 'function') transporter.close();
    process.exit(0);
  } catch (err) {
    console.error('Errore invio minimal HTML:', err);
    if (transporter && typeof transporter.close === 'function') transporter.close();
    process.exit(1);
  }
})();
