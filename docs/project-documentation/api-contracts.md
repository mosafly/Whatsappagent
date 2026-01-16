# API contracts

## Webhook Twilio WhatsApp
- **Route**: `POST /api/webhooks/twilio`
- **Auth attendu**: Signature Twilio `x-twilio-signature` (⚠️ non implémentée dans le code, à ajouter).
- **Headers**: `Content-Type: application/x-www-form-urlencoded` (FormData Twilio)
- **Payload (principaux champs)**:
  - `From` (ex: `whatsapp:+225…`), `To`, `Body`, `SmsMessageSid`
- **Traitement**:
  1) Récupère/initialise `shop` (mono-tenant, prend le premier shop) via Supabase **service role**
  2) `conversations`: find-or-create par `customer_phone` + `shop_id`, MAJ `last_message_at`
  3) `messages`: insert message entrant (`role: customer`, metadata twilio)
  4) Appel n8n: `POST N8N_WEBHOOK_URL` avec JSON `{ messageBody, customerPhone, conversationId, messageId }` + header `Authorization: Header ${N8N_AUTH_TOKEN}`
  5) Log dans `ai_logs` (latence, erreur éventuelle)
  6) Si n8n répond `{ message }`, insertion message assistant et réponse TwiML `<Message>${message}</Message>`
- **Réponses**:
  - 200 XML TwiML avec message IA
  - 200 XML vide si IA KO
  - 400 si paramètres manquants
  - 500 si erreur interne / shop introuvable
- **Contraintes**:
  - Timeout n8n non géré (tests prévoient <30s) → ajouter timeout/retry
  - Validation signature Twilio absente → à implémenter (SEC-001 tests)

## Actions/Pages
- Front `Inbox` / `Configuration` sont des maquettes sans backend.
- Aucune autre route API exposée.
