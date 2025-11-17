const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Script per testare l'upload di documenti
// Uso: node scripts/upload-document.js <file_path> <token>

async function uploadDocument(filePath, token) {
  if (!filePath || !token) {
    console.error('Uso: node scripts/upload-document.js <file_path> <token>');
    console.error('Esempio: node scripts/upload-document.js ./test.pdf eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error('File non trovato:', filePath);
    process.exit(1);
  }

  const form = new FormData();
  form.append('fileUpload', fs.createReadStream(filePath));
  form.append('fileName', path.basename(filePath, path.extname(filePath)));
  form.append('fileCategory', 'altro');
  form.append('fileDescription', 'Documento di test caricato via script');

  try {
    const response = await axios.post('http://localhost:3000/documents/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      }
    });

    console.log('Upload riuscito:', response.data);
  } catch (error) {
    console.error('Errore upload:', error.response ? error.response.data : error.message);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  const [,, filePath, token] = process.argv;
  uploadDocument(filePath, token);
}

module.exports = { uploadDocument };