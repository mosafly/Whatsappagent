# Scripts de Test Webhook n8n Bobotcho

Scripts pour tester les webhooks n8n en environnement de test et production.

## Fichiers

- `test_webhook.sh` - Script Linux/macOS/Bash
- `test_webhook.bat` - Script Windows
- `quick_test.md` - Commandes rapides

## Usage

### Windows
```bash
# Test environnement
test_webhook.bat test "Bonjour, je veux des infos sur vos produits"

# Production
test_webhook.bat prod "Quels sont vos prix ?"
```

### Linux/macOS
```bash
# Rendre exécutable
chmod +x test_webhook.sh

# Test environnement
./test_webhook.sh test "Bonjour, je veux des infos sur vos produits"

# Production
./test_webhook.sh prod "Quels sont vos prix ?"
```

## Webhooks

- **Test** : https://n8n.srv1014720.hstgr.cloud/webhook-test/bobotcho-webhook
- **Production** : https://n8n.srv1014720.hstgr.cloud/webhook/bobotcho-webhook

## Payload JSON

Les scripts envoient ce format de données WhatsApp :
```json
{
  "id": "test-123456789",
  "conversation_id": "test-conversation-123456789",
  "shop_id": "00000000-0000-0000-0000-000000000000",
  "role": "customer",
  "content": "MESSAGE",
  "type": "text",
  "metadata": {},
  "created_at": "2026-01-23T10:30:00.000Z",
  "status": "queued",
  "error_message": null,
  "customer_phone": "+2250104278080",
  "shop_phone": null,
  "message_body": "MESSAGE",
  "twilio_sid": null,
  "direction": "inbound"
}
```

## Messages de test suggérés

- "Bonjour, je veux des infos sur vos produits"
- "Quels sont vos prix ?"
- "Avez-vous des bundles avec installation ?"
- "Je suis du quartier Cocody, vous livrez là ?"
- "Test de mémoire: rappelez-vous notre conversation"

## Dépendances

- `curl` (généralement installé par défaut)
- `jq` (optionnel, pour formatage JSON sur Linux/macOS)

## Dépannage

### Erreur 404
- Vérifie que l'URL du webhook est correcte
- Vérifie que le workflow n8n est actif

### Erreur 500
- Vérifie les logs n8n pour les erreurs
- Vérifie la configuration des nodes

### Pas de réponse
- Vérifie la connexion réseau
- Vérifie que les credentials n8n sont valides
