// Script per inviare una email di prova usando un account ethereal (nodemailer).
// Uso: node scripts/send-test-email.js
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

    const info = await transporter.sendMail({
      from: 'Test <test@example.com>',
      to: testAccount.user,
      subject: 'Email di prova Vercam',
      text: 'Questa è una email di prova inviata da scripts/send-test-email.js',
      html: '<p>Questa è una <strong>email di prova</strong> inviata da <code>scripts/send-test-email.js</code></p>',
    });

    console.log('Message sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('Errore durante invio test email:', err);
    process.exit(1);
  }
})();
