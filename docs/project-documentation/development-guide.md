# Development guide

## Prérequis
- Node.js 20+, npm
- Supabase CLI (pour migrations locales)
- Variables d’env (local `.env.local`), voir ci-dessous
- Twilio WhatsApp sandbox (ou numéro prod) pour tester le webhook
- n8n accessible via `N8N_WEBHOOK_URL`

## Scripts
- `npm run dev` — Next.js dev
- `npm run build && npm start` — prod
- `npm run lint`
- `npm test` — Jest unitaires
- `npm run test:e2e` — Playwright (squelette)

## Variables d’environnement (minimales)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, utilisé par le webhook Twilio)
- `N8N_WEBHOOK_URL` (Webhook n8n cible)
- `N8N_AUTH_TOKEN` (header `Authorization: Header <token>`)
- `TWILIO_AUTH_TOKEN` (à utiliser pour valider les signatures — non implémenté encore)

## Supabase (migrations)
- Appliquer les migrations dans `supabase/migrations` via Supabase CLI.
- Attention: doublon de schéma `shops` (voir `data-models.md`) — prévoir une migration de consolidation.
- RLS: policies permissives sur `shops` et `knowledge_base` à resserrer avant prod.

## Lancer localement (mode maquette UI)
1. Créer `.env.local` avec les clés (même si l’UI maquette n’appelle pas encore l’API).
2. `npm install`
3. `npm run dev`

## Tester le webhook Twilio (local)
- Exposer `http://localhost:3000/api/webhooks/twilio` (ex: `ngrok http 3000`).
- Configurer Twilio Webhook vers l’URL publique.
- Envoyer un message sandbox → vérifier insertions Supabase (`messages`, `conversations`, `ai_logs`).

## Qualité / sécurité à ajouter
- Validation `x-twilio-signature` (SEC-001 tests).
- Timeout + retry pour l’appel n8n (<30s), fallback message.
- Idempotence sur `twilio_sid` (contrainte unique recommandée).
- RLS stricte pour `shops`, `knowledge_base`; éviter service role côté API publique.

## Débogage
- `src/components/ui/DebugLogTester` pour vérifier logs côté front.
- Traces API: logs console dans `api/webhooks/twilio`.

