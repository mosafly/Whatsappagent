# Commandes Rapides de Test

## Windows (Command Prompt)

```cmd
# Test webhook
cd scripts
test_webhook.bat test "Bonjour, je veux des infos sur vos produits"

# Production
test_webhook.bat prod "Quels sont vos prix ?"
```

## Linux/macOS (Terminal)

```bash
# Test webhook
cd scripts
chmod +x test_webhook.sh
./test_webhook.sh test "Bonjour, je veux des infos sur vos produits"

# Production
./test_webhook.sh prod "Quels sont vos prix ?"
```

## cURL Direct

### Test
```bash
curl -X POST https://n8n.srv1014720.hstgr.cloud/webhook-test/bobotcho-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "conversation_id": "test-conversation-123",
    "shop_id": "00000000-0000-0000-0000-000000000000",
    "role": "customer",
    "content": "Bonjour, je veux des infos sur vos produits",
    "type": "text",
    "metadata": {},
    "created_at": "2026-01-23T10:30:00.000Z",
    "status": "queued",
    "error_message": null,
    "customer_phone": "+2250104278080",
    "shop_phone": null,
    "message_body": "Bonjour, je veux des infos sur vos produits",
    "twilio_sid": null,
    "direction": "inbound"
  }'
```

### Production
```bash
curl -X POST https://n8n.srv1014720.hstgr.cloud/webhook/bobotcho-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "prod-123",
    "conversation_id": "prod-conversation-123",
    "shop_id": "00000000-0000-0000-0000-000000000000",
    "role": "customer",
    "content": "Quels sont vos prix ?",
    "type": "text",
    "metadata": {},
    "created_at": "2026-01-23T10:30:00.000Z",
    "status": "queued",
    "error_message": null,
    "customer_phone": "+2250104278080",
    "shop_phone": null,
    "message_body": "Quels sont vos prix ?",
    "twilio_sid": null,
    "direction": "inbound"
  }'
```
