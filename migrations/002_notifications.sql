-- migrations/002_notifications.sql
-- Aggiunge preferenze di notifica per gli utenti e tabella notifications
-- Esegui contro il database `vercam` (dopo 001_init.sql)

-- Aggiungi flag di preferenza per ricevere notifiche quando viene aggiunto un documento
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_on_new_document BOOLEAN DEFAULT TRUE;

-- Tabella per tracciare le notifiche inviate (o tentate)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'document_added', -- tipo di notifica
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  message_id TEXT, -- id fornito dal provider di posta (se presente)
  payload JSONB DEFAULT '{}', -- eventuali dati aggiuntivi (es. titolo documento, url)
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_document ON notifications (document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (status);

-- Nota: la tabella `emails` creata in 001_init.sql non è necessaria per lo scenario
-- in cui si invia solo una notifica quando un documento è aggiunto. Puoi mantenerla
-- per altri scopi o rimuoverla manualmente se desideri semplificare lo schema.
