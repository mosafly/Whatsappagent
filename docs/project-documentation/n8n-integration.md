# n8n integration

## Flux actuel
- L’API Next `POST /api/webhooks/twilio` appelle n8n via `N8N_WEBHOOK_URL`.
- Payload envoyé à n8n :
  ```json
  {
    "messageBody": "<body>",
    "customerPhone": "<phone>",
    "conversationId": "<uuid>",
    "messageId": "<uuid>"
  }
  ```
- Header d’auth: `Authorization: Header ${N8N_AUTH_TOKEN}`.

## Attendus côté n8n
- Recevoir le payload, produire une réponse JSON `{ message: string }` (texte à renvoyer dans WhatsApp).
- Latence cible < 30s (contrainte Twilio/tests). Prévoir timeout + retries côté n8n.
- En cas d’échec, renvoyer une chaîne courte ou laisser vide; l’API renverra un TwiML vide.

## Points à durcir
- Authentification: valider le header et refuser sinon.
- Idempotence: utiliser `messageId`/`conversationId` pour éviter les doublons en cas de retry.
- Logging: tracer les erreurs et le temps de réponse; renvoyer un champ d’erreur si besoin.

## Workflows existants (références)
- `_bmad-output/implementation-artifacts/n8n-workflow-bobotcho*.json` (v2/v3/v4/v5) — versions à réviser/importer.
- `n8n-setup-guide.md` dans `_bmad-output/implementation-artifacts/`.

## Recos pratiques
- Ajouter un nœud de validation d’entrée (From/To/Body) et filtrer les messages vides.
- Limiter le temps global du workflow (<25s) et prévoir un fallback texte (“Merci, nous revenons vers vous très vite”).
- Consigner la latence dans Supabase ou un log n8n dédié pour surveillance.
