#!/bin/bash

# Script pour tester les webhooks n8n Bobotcho
# Usage: ./test_webhook.sh [test|prod] [message]

# Configuration
WEBHOOK_TEST="https://n8n.srv1014720.hstgr.cloud/webhook-test/bobotcho-webhook"
WEBHOOK_PROD="https://n8n.srv1014720.hstgr.cloud/webhook/bobotcho-webhook"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  Test Webhook Bobotcho n8n  ${NC}"
    echo -e "${BLUE}=================================${NC}"
}

print_usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [test|prod] [message]"
    echo ""
    echo -e "${YELLOW}Exemples:${NC}"
    echo "  $0 test \"Bonjour, je veux des infos sur vos produits\""
    echo "  $0 prod \"Quels sont vos prix ?\""
    echo ""
    echo -e "${YELLOW}Environnements:${NC}"
    echo "  test  : $WEBHOOK_TEST"
    echo "  prod  : $WEBHOOK_PROD"
}

# Vérification des arguments
if [ $# -lt 2 ]; then
    print_usage
    exit 1
fi

ENVIRONMENT=$1
MESSAGE="$2"

# Sélection du webhook selon l'environnement
case $ENVIRONMENT in
    "test")
        WEBHOOK_URL=$WEBHOOK_TEST
        ENV_LABEL="TEST"
        ;;
    "prod")
        WEBHOOK_URL=$WEBHOOK_PROD
        ENV_LABEL="PRODUCTION"
        ;;
    *)
        echo -e "${RED}Erreur: Environnement '$ENVIRONMENT' invalide. Utilise 'test' ou 'prod'.${NC}"
        print_usage
        exit 1
        ;;
esac

print_header
echo -e "${GREEN}Environnement:${NC} $ENV_LABEL"
echo -e "${GREEN}Webhook:${NC} $WEBHOOK_URL"
echo -e "${GREEN}Message:${NC} $MESSAGE"
echo ""

# Données de test WhatsApp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
PHONE="+2250104278080"

# Création du payload JSON
PAYLOAD=$(cat <<EOF
{
  "id": "test-$(date +%s)",
  "conversation_id": "test-conversation-$(date +%s)",
  "shop_id": "00000000-0000-0000-0000-000000000000",
  "role": "customer",
  "content": "$MESSAGE",
  "type": "text",
  "metadata": {},
  "created_at": "$TIMESTAMP",
  "status": "queued",
  "error_message": null,
  "customer_phone": "$PHONE",
  "shop_phone": null,
  "message_body": "$MESSAGE",
  "twilio_sid": null,
  "direction": "inbound"
}
EOF
)

echo -e "${YELLOW}Payload JSON:${NC}"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

# Exécution de la requête curl
echo -e "${YELLOW}Envoi de la requête...${NC}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

# Extraction du statut HTTP et du corps de la réponse
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*$//')

# Affichage des résultats
echo -e "${GREEN}Statut HTTP:${NC} $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Succès !${NC}"
    echo -e "${GREEN}Réponse:${NC}"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${RED}❌ Erreur !${NC}"
    echo -e "${RED}Réponse:${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}           Test terminé           ${NC}"
echo -e "${BLUE}=================================${NC}"
