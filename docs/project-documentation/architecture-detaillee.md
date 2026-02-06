# Documentation d'Architecture : Système WhatsApp RAG Bobotcho

## 1. Vue d'Ensemble du Système
Le système est une plateforme d'automatisation de service client WhatsApp pour Shopify, utilisant une approche RAG (Retrieval-Augmented Generation) pour fournir des réponses précises et contextualisées aux clients de Bobotcho en Côte d'Ivoire.

## 2. Stack Technique
- **Frontend** : Next.js 14, Shopify Polaris UI (Interface d'administration).
- **Backend/DB** : Supabase (PostgreSQL + Vector Store).
- **Automation** : n8n (Workflow engine).
- **Communication** : Twilio (WhatsApp Business API).
- **IA** : OpenRouter (Modèles LLM) + OpenAI (Embeddings).

## 3. Flux de Données (Data Flow)

### A. Réception d'un Message (Inbound)
1. **Client** envoie un message sur WhatsApp.
2. **Twilio** reçoit le message et appelle le Webhook n8n (`/webhook/bobotcho-webhook`).
3. **n8n** :
   - Extrait le numéro (`From`) et le message (`Body`).
   - Crée/Met à jour la conversation dans **Supabase** (`conversations`).
   - Enregistre le message entrant (`messages` table).
   - Déclenche l'**IA Agent**.

### B. Traitement IA (RAG)
1. **IA Agent** reçoit le message.
2. **Recherche Vectorielle** : L'IA interroge la table `knowledge_base` dans Supabase via des embeddings pour trouver des informations sur les produits/prix.
3. **Génération** : L'IA génère une réponse personnalisée (Ton "Abidjan Premium", vouvoiement, proximité géographique).

### C. Réponse au Client (Outbound)
1. **n8n** enregistre la réponse de l'IA dans **Supabase**.
2. **n8n** appelle l'API **Twilio** pour envoyer le message WhatsApp.
3. **Twilio** délivre le message au client.

## 4. Schéma de Données (Supabase)
- `shops` : Configuration multi-tenants.
- `conversations` : Suivi des sessions par numéro de téléphone.
- `messages` : Historique complet (inbound/outbound) avec `twilio_sid`.
- `knowledge_base` : Documents indexés pour le RAG (vector store).
- `ai_logs` : Audit des performances de l'IA.

## 5. Intégration n8n
Le workflow principal est basé sur le fichier `n8n-workflow-bobotcho-rag-v5-fixed.json`.
- **Trigger** : Webhook (Production & Test).
- **Nodes clés** : Supabase Node, AI Agent (LangChain), OpenRouter Chat Model.
