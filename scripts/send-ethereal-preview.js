const nodemailer = require('nodemailer');

(async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const name = 'Mario Rossi';
    const email = 'mario.rossi@example.com';
    const subject = 'Anteprima template HTML';
    const message = 'Ciao!\nQuesta è una prova del template HTML con <strong>line breaks</strong>.';
    const cleanMessage = String(message).replace(/\n/g, '<br>');

    const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;padding:20px;box-shadow:0 8px 30px rgba(16,24,40,0.06);">
          <h2 style="color:#0b2a3a">Anteprima messaggio</h2>
          <p style="color:#1f3a4b">Mittente: <strong>${name}</strong> &lt;${email}&gt;</p>
          <div style="padding:12px;border-radius:8px;background:#f6fbff;border:1px solid rgba(3,18,22,0.03);">${cleanMessage}</div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: 'Vercam Test <no-reply@example.com>',
      to: testAccount.user,
      subject,
      text: message,
      html,
    });

    console.log('Message sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('Errore invio preview:', err);
    process.exit(1);
  }
})();
