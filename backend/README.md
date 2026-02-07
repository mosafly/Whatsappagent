# Bobotcho Backend — FastAPI

Backend Python pour l'agent WhatsApp Bobotcho. Remplace n8n pour le RAG, l'envoi de templates Twilio, les campagnes bulk et les automations.

## Stack

- **FastAPI** — API REST
- **LangChain** — RAG (Supabase pgvector + OpenRouter)
- **Twilio SDK** — WhatsApp messages + Content API (templates)
- **Celery + Redis** — Tâches async (campagnes bulk, automations cron)
- **Docker Compose** — Déploiement

## Démarrage rapide

```bash
# 1. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies clés

# 2. Lancer les services
docker compose up -d

# 3. Vérifier le health check
curl http://localhost:8000/health
```

## Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/health` | Health check (pas d'auth) |
| `POST` | `/api/ai-response` | Réponse IA via RAG (remplace n8n) |
| `GET` | `/api/templates` | Liste des templates WhatsApp |
| `POST` | `/api/templates` | Créer un template + soumettre à Meta |
| `POST` | `/api/templates/send` | Envoyer un template à un destinataire |
| `GET` | `/api/templates/{name}/status` | Vérifier statut approbation Meta |
| `POST` | `/api/campaigns/send` | Lancer une campagne bulk (async Celery) |
| `POST` | `/api/messages/send` | Envoyer un message freeform |

## Auth

Tous les endpoints `/api/*` requièrent le header `X-API-Key` avec la valeur de `API_SECRET_KEY`.

```bash
curl -H "X-API-Key: your-secret" http://localhost:8000/api/templates
```

## Celery Beat (Cron)

| Tâche | Fréquence | Description |
|-------|-----------|-------------|
| `check_automations` | Toutes les 5 min | Exécute les automations actives |
| `check_template_approvals` | Toutes les heures | Vérifie les approbations Meta |

## Déploiement VPS Hostinger

```bash
ssh user@srv1014720.hstgr.cloud
cd /opt/bobotcho-backend
git pull
docker compose up -d --build
```
