# Vue d’ensemble - WhatsApp CRM Supabase

> **Mise à jour : Remplacement Node.js → Supabase**
> Toute la logique backend est portée sur **Supabase** (Postgres géré + Edge Functions + Scheduled Jobs + RLS). Twilio reste le BSP WhatsApp et Shopify envoie les événements vers des **Edge Functions** publiques.

## Fonctionnalités
* Sync Shopify (clients, commandes, abandons) via webhooks + import initial
* Modèle de données CRM (contacts, segments, campagnes, automations)
* Envoi WhatsApp via **Twilio Messages API + Content API** (templates) + statut delivery
* Opt‑in/out, throttling, segmentation et 3 automations MVP
* Squelette backend Node.js (Express/Nest‑like) - *Note: pour référence seulement*

## Architecture Supabase
* **Base de données :** Postgres avec RLS.
* **Logique :** Edge Functions (Deno).
* **Scheduling :** pg_net / Scheduled Edge Functions.

## Schéma SQL
- Tables: `contacts`, `customer_stats`, `events`, `campaigns`, `message_logs`, `automations`, `jobs`.
- Fonction `claim_job` pour la gestion des files d'attente.

## Edge Functions
- `shopify-webhook` : Réception et dispatch des webhooks Shopify.
- `twilio-dispatch` : Envoi effectif des messages.
- `twilio-status` : Retour d'état des messages.
- `reactivation-cron` : Scripts de relance marketing.
