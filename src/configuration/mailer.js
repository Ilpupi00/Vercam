const nodemailer = require('nodemailer');

// Configuration via environment variables:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !MAIL_FROM) {
  console.warn('Mailer: missing one or more SMTP environment variables (SMTP_HOST, SMTP_PORT, MAIL_FROM).');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 587,
  secure: SMTP_PORT && Number(SMTP_PORT) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

async function sendMail({ to, subject, text, html, from }) {
  if (!to) throw new Error('Missing `to` address');
  const mailOptions = {
    from: from || MAIL_FROM,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail, transporter };
