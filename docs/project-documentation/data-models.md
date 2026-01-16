# Data models & migrations

## Tables principales
- **shops**
  - Schéma divergent:
    - `20260112_initial_schema`: `shopify_domain` (unique), `shop_name`.
    - `20260115210158_init_shops_table`: `name`, `domain`, timestamps + policies très permissives (select/insert public).
  - À décider: modèle cible (shopify_domain+name ?), supprimer policies demo, RLS stricte.

- **conversations**
  - `id`, `shop_id` (FK shops), `customer_phone`, `status` (active/archived/pending_validation), `last_message_at`, `created_at`.
  - RLS: policy “Shops can only see their own conversations” via `app.current_shop_id` (authenticated).

- **messages**
  - `id`, `conversation_id` (nullable après webhook migration), `shop_id`, `role` (customer/agent/system/assistant), `content`, `type`, `metadata`, `created_at`.
  - Colonnes ajoutées: `customer_phone`, `shop_phone`, `message_body`, `twilio_sid`, `direction`, `status` (queued/sent/delivered/read/failed), `error_message`.
  - Index: `customer_phone`, `twilio_sid`.
  - RLS: “Shops can only see their own messages”. Webhook utilise service role (bypass RLS).

- **ai_logs**
  - `id`, `shop_id` (nullable après webhook migration), `conversation_id`, `input`, `output`, `metrics`, `created_at`.
  - Colonnes ajoutées: `message_id` FK messages, `response_time_ms`, `success`, `n8n_success`.
  - Index: `response_time_ms`, `created_at DESC`.
  - RLS: “Shops can only see their own logs”; service role pour insert.

- **knowledge_base** (pgvector)
  - `title`, `content`, `category`, `priority`, `metadata`, `embedding vector(1536)`, timestamps.
  - Policy: "Public can read knowledge base" (⚠️ public) — revue nécessaire si données sensibles.
  - Index HNSW `embedding vector_cosine_ops`.

- **rag_search_logs**
  - `conversation_id` FK conversations, `query`, `results_count`, `top_result_id`, `top_similarity`, `created_at`.
  - Policy: insert via service_role.

- **referrals**
  - `shop_id` FK shops, `referrer_id` FK conversations, `referee_phone` unique, `referral_code`, `status` (pending/converted/reward_claimed), montants, timestamps.
  - Index: `referral_code`, `referee_phone`.
  - RLS: policy "Shops can only see their own referrals" via `app.current_shop_id` (authenticated).

## Fonctions & triggers
- `semantic_search(query_embedding, match_threshold float=0.78, match_count int=5)` → retourne KB triée par priorité/similarité.
- `handle_updated_at` + trigger `set_referrals_updated_at` sur `referrals` (before update).
- `ensure_conversation(p_customer_phone, p_shop_id)` SECURITY DEFINER → find-or-create conversation active.

## Extensions
- `vector` (pgvector) activée.

## Risques / actions recommandées
- **Shops**: unifier schéma (choisir domain/shopify_domain), drop table dupliquée si besoin, recréer policies RLS strictes (no public). Ajouter `updated_at` triggers.
- **RLS cohérence**: 
  - En prod, éviter service role côté API publique; préférer supabase client avec JWT + `app.current_shop_id`.
  - Renforcer policies sur `knowledge_base` si privé.
- **Contrainte uniques**: ajouter `unique (shop_id, customer_phone)` sur conversations? Ajouter `unique (conversation_id, twilio_sid)` ou `unique (shop_id, twilio_sid)` pour idempotence webhook.
- **Statuts messages**: aligner valeurs (`queued/sent/delivered/read/failed` vs defaults).
- **Indexes**: ajouter index sur `(shop_id, last_message_at DESC)` (conversations), `(conversation_id, created_at)` (messages).
- **Migrations ordre**: vérifier l’ordre appliqué en env (doublon shops + policies publiques). Consigner un script de consolidation.
