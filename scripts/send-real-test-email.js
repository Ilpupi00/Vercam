const path = require('path');
// Carica le variabili dal .env nella root del progetto
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sendMail, transporter } = require('../src/configuration/mailer');

(async () => {
  try {
    const to = process.env.MAIL_TO || process.env.MAIL_FROM;
    if (!to) {
      console.error('Nessun destinatario configurato: imposta MAIL_TO o MAIL_FROM nel file .env');
      process.exit(1);
    }

    console.log('Invio mail di test a:', to);

    const info = await sendMail({
      to,
      subject: 'Test invio email da Vercam',
      text: 'Questa è una mail di prova inviata dallo script scripts/send-real-test-email.js',
      html: '<p>Questa è una <strong>mail di prova</strong> inviata dallo script <code>scripts/send-real-test-email.js</code></p>',
    });

    console.log('Risultato invio:', info);

    // Chiudi il transporter se supportato
    if (transporter && typeof transporter.close === 'function') transporter.close();
    process.exit(0);
  } catch (err) {
    console.error('Errore durante invio mail di test:', err && err.message ? err.message : err);
    // log completo per debug
    console.error(err);
    if (transporter && typeof transporter.close === 'function') transporter.close();
    process.exit(1);
  }
})();
