# Project overview

## Résumé
- **Produit**: Concierge WhatsApp pour Shopify (Support + Marketing agressif)
- **Stack**: Next.js 16 (App Router) + Shopify Polaris/App Bridge UI, Supabase (Postgres + RLS + pgvector), n8n (orchestration IA / webhooks), Twilio WhatsApp.
- **Tenancy**: mono-tenant V1 (table `shops` mais policies permissives à ajuster), RLS prévu par shop via `app.current_shop_id`.
- **Langue**: UI FR, ton “Concierge Anticipatif”.

## Composants clés
- **Frontend**: `src/app` (Dashboard, Inbox mock, Configuration), Polaris UI.
- **API**: Next.js route `api/webhooks/twilio` pour ingestion WhatsApp -> Supabase -> n8n -> TwiML.
- **Supabase**: tables `shops`, `conversations`, `messages`, `ai_logs`, `knowledge_base`, `rag_search_logs`, `referrals` (+ policies RLS). Extensions: `vector`.
- **n8n**: Webhook cible via `N8N_WEBHOOK_URL` (+ auth header). Plusieurs workflows JSON en `_bmad-output/implementation-artifacts/`.
- **Tests**: Jest unitaires/mocks sous `src/__tests__/api` (webhooks Twilio), e2e skeleton.

## Flux principaux
1) **Inbound WhatsApp (Twilio)** → Next API `POST /api/webhooks/twilio` (FormData) → upsert conversation/message → appel n8n → log IA → TwiML réponse.
2) **IA / RAG** → `knowledge_base` + fonction `semantic_search` (pgvector) + logs `rag_search_logs`.
3) **Referral** → table `referrals` + colonnes sur `conversations/messages` (statuts, code parrainage).

## Décisions / alertes rapides
- **RLS**: certaines policies “demo” autorisent insert/select public (`shops`), à restreindre avant prod.
- **Doublons `shops`**: deux migrations différentes (initial vs init_shops_table) — clarifier schéma cible.
- **Twilio sécurité**: pas de validation de signature dans l’API actuelle (tests l’exigent). Ajouter `x-twilio-signature` check.
- **n8n robustesse**: pas de timeout/retry dans le code API; tests prévoient des scénarios.
