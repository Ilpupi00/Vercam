# Backend per Upload Documenti

Questo backend gestisce l'upload, la visualizzazione, la modifica e l'eliminazione di documenti per l'area venditore di Vercam.

## Funzionalità

- **Upload di documenti**: Supporta PDF, DOC, DOCX, XLS, XLSX, JPG, PNG fino a 10MB
- **Gestione categorie**: Contratti, Certificati, Manuali, Procedure, Modulistica, Altro
- **Autenticazione**: Richiede login JWT
- **Archiviazione sicura**: File salvati in `src/public/uploads/`, metadati in PostgreSQL

## API Endpoints

### POST /documents/upload
Carica un nuovo documento.

**Body (FormData):**
- `fileUpload`: File da caricare
- `fileName`: Nome del documento
- `fileCategory`: Categoria (contratti|certificati|manuali|procedure|modulistica|altro)
- `fileDescription`: Descrizione opzionale

**Risposta:**
```json
{ "ok": true, "message": "Documento caricato con successo", "id": 123 }
```

### GET /documents
Recupera tutti i documenti dell'utente autenticato.

**Risposta:**
```json
{
  "ok": true,
  "documents": [
    {
      "id": 1,
      "name": "Contratto.pdf",
      "description": "Descrizione",
      "category": "contratti",
      "uploadDate": "10/11/2025"
    }
  ]
}
```

### PUT /documents/:id
Modifica un documento esistente.

**Body (JSON):**
```json
{
  "fileName": "Nuovo nome",
  "fileCategory": "certificati",
  "fileDescription": "Nuova descrizione"
}
```

### DELETE /documents/:id
Elimina un documento.

## Script di Test

Usa `scripts/upload-document.js` per testare l'upload:

```bash
node scripts/upload-document.js path/to/file.pdf your_jwt_token
```

## Sicurezza

- File validati per tipo e dimensione
- Checksum SHA256 per integrità
- Accesso limitato ai propri documenti
- Autenticazione JWT richiesta

## Dipendenze Aggiunte

- `multer`: Gestione upload file
- `axios`: Per script di test
- `form-data`: Per script di test