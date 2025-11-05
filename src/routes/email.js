const express = require('express');
const router = express.Router();
const { sendMail } = require('../configuration/mailer');

// POST /email
// body: { name, email, message, subject, phone, service, privacy }
router.post('/', async (req, res) => {
		const { name, email, message, subject, phone, service, privacy } = req.body || {};
		if (!name || !email || !message) {
				return res.status(400).json({ error: 'name, email and message are required' });
		}

		// prefer MAIL_TO, fallback to MAIL_FROM
		const mailTo = process.env.MAIL_TO || process.env.MAIL_FROM;
		if (!mailTo) {
				return res.status(500).json({ error: 'Mail destination not configured on server' });
		}

		const mailSubject = subject || `Messaggio da ${name} via sito`;
		const cleanMessage = String(message).replace(/\n/g, '<br>');
		const safePhone = phone || 'Non fornito';
		const safeService = service || 'Non specificato';
		const consent = privacy ? (privacy === true || privacy === 'on' || privacy === 'true' ? 'Consenso dato' : 'Non dato') : 'Non specificato';

		const html = `
			<!doctype html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Nuovo messaggio dal sito</title>
			</head>
			<body style="margin:0;padding:0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background:#f4f7fb;color:#333;">
				<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#f7ffef,#e8fbff);padding:40px 0;">
					<tr>
						<td align="center">
							<table width="680" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(16,24,40,0.08);">
								<!-- Header -->
								<tr>
									<td style="padding:28px 32px;background:linear-gradient(90deg,#43e97b,#00b4d8);color:#fff;">
										<h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.2px;">Nuovo messaggio da sito Vercam</h1>
										<p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Ricevuto da <strong>${name}</strong> &mdash; <a href="mailto:${email}" style="color:rgba(255,255,255,0.95);text-decoration:underline;">${email}</a></p>
									</td>
								</tr>

								<!-- Body -->
								<tr>
									<td style="padding:28px 32px;">
										<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
											<tr>
												<td style="padding-bottom:12px;">
													<h2 style="margin:0;font-size:16px;color:#0b2a3a">Oggetto</h2>
													<p style="margin:6px 0 0;font-size:14px;color:#1f3a4b;">${subject || '(nessun oggetto)'}</p>
												</td>
											</tr>
											<tr>
												<td style="padding-top:18px;padding-bottom:8px;">
													<h3 style="margin:0;font-size:14px;color:#0b2a3a">Messaggio</h3>
													<div style="margin-top:8px;padding:14px;border-radius:10px;background:#f6fbff;border:1px solid rgba(3,18,22,0.03);color:#172a3a;font-size:14px;line-height:1.5;">${cleanMessage}</div>
												</td>
											</tr>
											<tr>
												<td style="padding-top:18px;">
													<p style="margin:0;font-size:13px;color:#56626b">Informazioni aggiuntive:</p>
													<ul style="margin:8px 0 0 18px;color:#42525a;font-size:13px;">
														<li><strong>Telefono:</strong> ${safePhone}</li>
														<li><strong>Servizio richiesto:</strong> ${safeService}</li>
														<li><strong>Privacy:</strong> ${consent}</li>
														<li><strong>Nome:</strong> ${name}</li>
														<li><strong>Email:</strong> ${email}</li>
													</ul>
												</td>
											</tr>
										</table>
									</td>
								</tr>

								<!-- Footer -->
								<tr>
									<td style="padding:20px 32px;background:#fbfdff;border-top:1px solid rgba(3,18,22,0.03);">
										<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
											<tr>
												<td style="font-size:13px;color:#6b7880;">
													<p style="margin:0">Questo messaggio è stato inviato tramite il form di contatto del sito Vercam.</p>
												</td>
												<td align="right" style="font-size:13px;color:#6b7880;">
													<p style="margin:0"><strong>Vercam</strong><br><a href="mailto:info@asdborgovercelli.it" style="color:#1b6f57;text-decoration:none;">info@asdborgovercelli.it</a></p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `Messaggio da: ${name}\nEmail: ${email}\nTelefono: ${safePhone}\nServizio: ${safeService}\nPrivacy: ${consent}\n\nMessaggio:\n${message}`;

		try {
				await sendMail({ to: mailTo, subject: mailSubject, html, text });
				return res.json({ ok: true });
		} catch (err) {
				 console.error('Errore invio email:', err);
				 // Return generic message but include error details in development
				 const payload = { error: 'Errore invio email' };
				 if (process.env.NODE_ENV === 'development') payload.detail = err && err.stack ? err.stack : String(err);
				 return res.status(500).json(payload);
		}
});

module.exports = router;
