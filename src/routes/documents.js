const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { sendDocumentNotification } = require('../configuration/document-notification');

const router = express.Router();

// Helper promisified wrappers for the project DB adapter (sqlite-compatible or pg adapter)
function dbAll(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(db, sql, params) {
  return new Promise((resolve, reject) => {
    // Use function to capture `this` which adapter sets to ctx with lastID/changes
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);
      // `this` provided by adapter contains lastID and changes for compatibility
      resolve(this || {});
    });
  });
}
// Configurazione multer per l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    
    const extname = allowedExts.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.includes(file.mimetype);
    
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase(),
      extAllowed: extname,
      mimeAllowed: mimetype
    });
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato'));
    }
  }
});

// Middleware per verificare autenticazione
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Autenticazione richiesta' });
  }
  next();
}

// POST /documents/upload - Carica un documento
router.post('/upload', requireAuth, upload.single('fileUpload'), [
  body('fileName').isString().isLength({ min: 1, max: 100 }),
  body('fileCategory').isIn(['contratti', 'certificati', 'manuali', 'procedure', 'modulistica', 'altro']),
  body('fileDescription').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'File richiesto' });
  }

  try {
    const { fileName, fileCategory, fileDescription } = req.body;
    const filePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '..', 'public'), filePath);

    // Calcola checksum
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Salva nel database (adapter usa ? placeholders)
    const insertSql = `INSERT INTO documenti (titolo, contenuto, path, tipo_documento, checksum, autore_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertRes = await dbRun(req.db, insertSql, [fileName, fileDescription || '', relativePath, fileCategory, checksum, req.user.id]);

    // adapter sets lastID on the callback context for compatibility
    const newId = insertRes.lastID || insertRes.id || null;
    
    // Invia email a tutti gli utenti nella tabella emails
    try {
      const emailsSql = `SELECT email, nome FROM emails`;
      const emailRecipients = await dbAll(req.db, emailsSql, []);
      
      if (emailRecipients && emailRecipients.length > 0) {
        const documentData = {
          fileName,
          fileCategory,
          fileDescription: fileDescription || '',
          userName: req.user.username,
          uploadDate: new Date().toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        await sendDocumentNotification(documentData, emailRecipients);
      }
    } catch (emailError) {
      // Log dell'errore ma non bloccare la risposta - il documento è stato caricato
      console.error('Errore invio email notifica documento:', emailError);
    }
    
    res.json({ ok: true, message: 'Documento caricato con successo', id: newId });
  } catch (error) {
    console.error('Errore upload documento:', error);
    // Rimuovi file se errore
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ ok: false, error: 'Errore interno del server' });
  }
});

// GET /documents - Lista documenti dell'utente
router.get('/', requireAuth, async (req, res) => {
  try {
    // Debug: mostra i metodi disponibili sull'oggetto req.db
    try { console.log('REQ.DB methods:', Object.keys(req.db || {})); } catch (e) { console.log('REQ.DB inspect error', e); }
    const selectSql = `SELECT id, titolo, contenuto, path, tipo_documento, checksum, created_at FROM documenti WHERE autore_id = ? ORDER BY created_at DESC`;
    const rows = await dbAll(req.db, selectSql, [req.user.id]);

    const documents = rows.map(doc => ({
      id: doc.id,
      name: doc.titolo,
      description: doc.contenuto,
      category: doc.tipo_documento,
      path: doc.path,
      checksum: doc.checksum,
      uploadDate: doc.created_at ? (new Date(doc.created_at).toISOString().split('T')[0].split('-').reverse().join('/')) : null
    }));

    res.json({ ok: true, documents });
  } catch (error) {
    console.error('Errore recupero documenti:', error);
    res.status(500).json({ ok: false, error: 'Errore interno del server' });
  }
});

// GET /documents/public - Lista pubblica di tutti i documenti (senza autenticazione)
router.get('/public', async (req, res) => {
  try {
    const selectSql = `SELECT id, titolo, contenuto, path, tipo_documento, checksum, created_at FROM documenti ORDER BY created_at DESC`;
    const rows = await dbAll(req.db, selectSql, []);

    const documents = rows.map(doc => ({
      id: doc.id,
      name: doc.titolo,
      description: doc.contenuto,
      category: doc.tipo_documento,
      path: doc.path,
      checksum: doc.checksum,
      uploadDate: doc.created_at ? (new Date(doc.created_at).toISOString().split('T')[0].split('-').reverse().join('/')) : null
    }));

    res.json({ ok: true, documents });
  } catch (error) {
    console.error('Errore recupero documenti pubblici:', error);
    res.status(500).json({ ok: false, error: 'Errore interno del server' });
  }
});

// PUT /documents/:id - Modifica documento
router.put('/:id', requireAuth, [
  body('fileName').isString().isLength({ min: 1, max: 100 }),
  body('fileCategory').isIn(['contratti', 'certificati', 'manuali', 'procedure', 'modulistica', 'altro']),
  body('fileDescription').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { fileName, fileCategory, fileDescription } = req.body;

    // Verifica che il documento appartenga all'utente
    const checkQuery = 'SELECT id FROM documenti WHERE id = ? AND autore_id = ?';
    const checkRow = await dbGet(req.db, checkQuery, [id, req.user.id]);
    if (!checkRow) {
      return res.status(404).json({ ok: false, error: 'Documento non trovato' });
    }

    const updateQuery = `UPDATE documenti SET titolo = ?, contenuto = ?, tipo_documento = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND autore_id = ?`;
    await dbRun(req.db, updateQuery, [fileName, fileDescription || '', fileCategory, id, req.user.id]);

    res.json({ ok: true, message: 'Documento modificato con successo' });
  } catch (error) {
    console.error('Errore modifica documento:', error);
    res.status(500).json({ ok: false, error: 'Errore interno del server' });
  }
});

// DELETE /documents/:id - Elimina documento
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Recupera il path del file
    const selectQuery = 'SELECT path FROM documenti WHERE id = ? AND autore_id = ?';
    const selectRow = await dbGet(req.db, selectQuery, [id, req.user.id]);
    if (!selectRow) {
      return res.status(404).json({ ok: false, error: 'Documento non trovato' });
    }

    const filePath = path.join(__dirname, '..', 'public', selectRow.path);

    // Elimina dal database
    const deleteQuery = 'DELETE FROM documenti WHERE id = ? AND autore_id = ?';
    await dbRun(req.db, deleteQuery, [id, req.user.id]);

    // Elimina il file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ ok: true, message: 'Documento eliminato con successo' });
  } catch (error) {
    console.error('Errore eliminazione documento:', error);
    res.status(500).json({ ok: false, error: 'Errore interno del server' });
  }
});

module.exports = router;