const { sendMail } = require('../configuration/mailer');

/**
 * Template email moderno per notifica caricamento documento
 * @param {Object} documentData - Dati del documento caricato
 * @param {string} documentData.fileName - Nome del documento
 * @param {string} documentData.fileCategory - Categoria del documento
 * @param {string} documentData.fileDescription - Descrizione del documento
 * @param {string} documentData.userName - Nome utente che ha caricato
 * @param {string} documentData.uploadDate - Data di caricamento
 * @returns {Object} Oggetto con subject, html e text dell'email
 */
function createDocumentNotificationTemplate(documentData) {
  const { fileName, fileCategory, fileDescription, userName, uploadDate } = documentData;

  const subject = `📄 Nuovo documento caricato - ${fileName}`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuovo Documento Caricato</title>
  <style>
    /* CSS Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Vercam Color Variables */
    :root {
      --vercam-primary: #43e97b;
      --vercam-secondary: #198754;
      --vercam-accent: #00b4d8;
      --vercam-dark: #0d6efd;
      --text-primary: #222;
      --text-secondary: #666;
      --bg-white: #ffffff;
      --bg-light: #f8f9fa;
      --shadow-light: rgba(67, 233, 123, 0.07);
      --shadow-medium: rgba(67, 233, 123, 0.15);
      --shadow-strong: rgba(67, 233, 123, 0.25);
      --border-radius-sm: 8px;
      --border-radius-md: 12px;
      --border-radius-lg: 16px;
      --border-radius-xl: 20px;
      --transition-fast: 0.2s ease;
      --transition-normal: 0.3s ease;
      --transition-slow: 0.5s ease;
    }

    /* Base Styles */
    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: var(--bg-white);
      border-radius: var(--border-radius-xl);
      box-shadow: 0 20px 60px var(--shadow-medium), 0 8px 32px var(--shadow-light);
      overflow: hidden;
      position: relative;
    }

    /* Header Section */
    .email-header {
      background: linear-gradient(135deg, var(--vercam-primary) 0%, var(--vercam-secondary) 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .email-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.08)"/><circle cx="60" cy="80" r="1" fill="rgba(255,255,255,0.06)"/><circle cx="30" cy="70" r="1.2" fill="rgba(255,255,255,0.05)"/></svg>');
      opacity: 0.3;
    }

    .header-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 2.5rem;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .email-title {
      color: var(--vercam-secondary);
      font-size: 2.2rem;
      font-weight: 900;
      margin-bottom: 10px;
      text-shadow: 0 4px 24px var(--shadow-medium);
      position: relative;
      z-index: 1;
    }

    .email-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    /* Content Section */
    .email-content {
      padding: 40px 30px;
    }

    .notification-card {
      background: linear-gradient(135deg, rgba(67, 233, 123, 0.05) 0%, rgba(25, 135, 84, 0.05) 100%);
      border: 2px solid rgba(67, 233, 123, 0.1);
      border-radius: var(--border-radius-lg);
      padding: 30px;
      margin: 20px 0;
      position: relative;
      overflow: hidden;
    }

    .notification-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, var(--vercam-primary) 0%, var(--vercam-secondary) 100%);
    }

    .document-info {
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      margin-bottom: 15px;
      align-items: center;
    }

    .info-label {
      font-weight: 700;
      color: var(--vercam-secondary);
      min-width: 120px;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      flex: 1;
      color: var(--text-primary);
      font-weight: 500;
      background: rgba(255, 255, 255, 0.8);
      padding: 8px 12px;
      border-radius: var(--border-radius-md);
      border: 1px solid rgba(67, 233, 123, 0.2);
    }

    .document-description {
      background: var(--bg-light);
      padding: 15px;
      border-radius: var(--border-radius-md);
      border-left: 4px solid var(--vercam-accent);
      margin-top: 15px;
      font-style: italic;
      color: var(--text-secondary);
    }

    /* CTA Button */
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, var(--vercam-primary) 0%, var(--vercam-secondary) 100%);
      color: var(--bg-white) !important;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: var(--border-radius-xl);
      font-weight: 700;
      font-size: 1.1rem;
      box-shadow: 0 8px 32px var(--shadow-strong);
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
      border: none;
    }

    .cta-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.6s ease;
    }

    .cta-button:hover::before {
      left: 100%;
    }

    .cta-button:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 12px 40px var(--shadow-strong);
    }

    /* Footer */
    .email-footer {
      background: var(--bg-light);
      padding: 30px;
      text-align: center;
      border-top: 1px solid rgba(67, 233, 123, 0.1);
    }

    .footer-text {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 10px;
    }

    .brand-signature {
      color: var(--vercam-secondary);
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 5px;
    }

    .footer-links {
      margin-top: 15px;
    }

    .footer-links a {
      color: var(--vercam-accent);
      text-decoration: none;
      margin: 0 10px;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .footer-links a:hover {
      color: var(--vercam-dark);
      text-decoration: underline;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }

      .email-container {
        border-radius: var(--border-radius-lg);
      }

      .email-header {
        padding: 30px 20px;
      }

      .header-icon {
        width: 60px;
        height: 60px;
        font-size: 2rem;
      }

      .email-title {
        font-size: 1.8rem;
      }

      .email-subtitle {
        font-size: 1rem;
      }

      .email-content {
        padding: 30px 20px;
      }

      .notification-card {
        padding: 20px;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }

      .info-label {
        min-width: auto;
      }

      .cta-button {
        padding: 12px 24px;
        font-size: 1rem;
      }
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .email-container {
      animation: fadeInUp 0.8s ease-out;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="header-icon">📄</div>
      <h1 class="email-title">Nuovo Documento Caricato</h1>
      <p class="email-subtitle">Una nuova risorsa è stata aggiunta alla piattaforma Vercam</p>
    </div>

    <!-- Content -->
    <div class="email-content">
      <div class="notification-card">
        <div class="document-info">
          <div class="info-row">
            <span class="info-label">📋 Documento</span>
            <span class="info-value">${fileName}</span>
          </div>

          <div class="info-row">
            <span class="info-label">🏷️ Categoria</span>
            <span class="info-value">${fileCategory}</span>
          </div>

          <div class="info-row">
            <span class="info-label">👤 Caricato da</span>
            <span class="info-value">VERCAM</span>
          </div>

          <div class="info-row">
            <span class="info-label">📅 Data</span>
            <span class="info-value">${uploadDate}</span>
          </div>

          ${fileDescription ? `
          <div class="document-description">
            <strong>📝 Descrizione:</strong><br>
            ${fileDescription}
          </div>
          ` : ''}
        </div>
      </div>

      <div class="cta-section">
        <a href="#" class="cta-button">
          🔗 Accedi alla Piattaforma
        </a>
      </div>

      <p style="text-align: center; color: var(--text-secondary); font-size: 0.95rem; margin-top: 20px;">
        Accedi al tuo account per visualizzare e scaricare il nuovo documento.
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <div class="brand-signature">Vercam</div>
      <p class="footer-text">Piattaforma di gestione documentale professionale</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a> |
        <a href="#">Termini di Servizio</a> |
        <a href="#">Supporto</a>
      </div>
      <p class="footer-text" style="margin-top: 15px; font-size: 0.8rem;">
        Questa è una email automatica, si prega di non rispondere.<br>
        © 2025 Vercam. Tutti i diritti riservati.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Nuovo documento caricato su Vercam

📋 Documento: ${fileName}
🏷️ Categoria: ${fileCategory}
👤 Caricato da: VERCAM
📅 Data: ${uploadDate}
${fileDescription ? `📝 Descrizione: ${fileDescription}` : ''}

Accedi alla piattaforma per visualizzare il documento: [Link alla piattaforma]

Questa è una email automatica.
© 2025 Vercam. Tutti i diritti riservati.`;

  return { subject, html, text };
}

/**
 * Invia email di notifica per nuovo documento caricato
 * @param {Object} documentData - Dati del documento
 * @param {Array} recipients - Array di oggetti {email, nome}
 */
async function sendDocumentNotification(documentData, recipients) {
  try {
    const template = createDocumentNotificationTemplate(documentData);

    const emailPromises = recipients.map(recipient =>
      sendMail({
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      }).catch(err => {
        console.error(`Errore invio email a ${recipient.email}:`, err);
        return null;
      })
    );

    await Promise.all(emailPromises);
    console.log(`Email notifica documento inviate a ${recipients.length} destinatari`);
  } catch (error) {
    console.error('Errore invio email notifica documento:', error);
    throw error;
  }
}

module.exports = {
  createDocumentNotificationTemplate,
  sendDocumentNotification
};