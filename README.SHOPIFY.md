# Whatsappagent - App Shopify

Le Concierge Anticipatif pour Shopify avec intégration WhatsApp

## 🚀 Configuration Rapide

### 1. Variables d'environnement

Copiez et configurez les fichiers d'environnement:

```bash
# Configuration Shopify
cp .env.shopify .env.local

# Ajoutez vos clés Shopify Partner:
SHOPIFY_API_KEY=votre_api_key
SHOPIFY_API_SECRET=votre_api_secret
SHOPIFY_WEBHOOK_SECRET=votre_webhook_secret
DATABASE_URL=postgresql://...
```

### 2. Installation des dépendances

```bash
npm install
npm run db:generate
```

### 3. Démarrage

```bash
# Développement local
npm run dev

# Avec Shopify CLI (recommandé)
npm run shopify:dev
```

## 📁 Structure Complète

```
whatsappagent-app/
├── src/app/                    # App Next.js
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentification Shopify
│   │   └── webhooks/          # Webhooks Shopify
│   ├── inbox/                 # Interface WhatsApp
│   └── configuration/         # Configuration app
├── extensions/                 # Extensions Shopify
├── prisma/                    # Base de données
├── lib/shopify/              # Helpers Shopify
├── shopify.app.toml          # Configuration Shopify
└── .env.shopify              # Variables Shopify
```

## 🔧 Fonctionnalités Shopify

### ✅ Authentification OAuth
- Login Shopify sécurisé
- Gestion des sessions
- Scopes d'accès configurés

### ✅ Webhooks
- Produits (création, modification, suppression)
- Commandes (création, mise à jour, annulation)
- Clients (création, modification)
- Désinstallation app

### ✅ API GraphQL
- Récupération produits
- Gestion commandes
- Informations clients

### ✅ Base de données
- Sessions Shopify
- Conversations WhatsApp
- Templates messages
- Analytics

## 🛠 Développement

### Commandes utiles:

```bash
# Base de données
npm run db:generate    # Générer Prisma client
npm run db:push       # Pousser le schéma
npm run db:migrate    # Migrer la base
npm run db:studio     # Ouvrir Prisma Studio

# Shopify
npm run shopify:dev       # Démarrer avec Shopify CLI
npm run shopify:deploy    # Déployer l'app
npm run shopify:generate  # Générer une extension

# Tests
npm test
npm run test:e2e
```

### Créer une extension:

```bash
shopify app generate extension

# Types disponibles:
# - Admin action (boutons admin)
# - Theme app extension (blocs thème)
# - Checkout extension (page paiement)
# - POS extension (point de vente)
```

## 📊 Métriques et Analytics

L'app inclut un système complet d'analytics:

- Messages envoyés/reçus
- Taux de conversion
- Temps de réponse moyen
- Satisfaction client

## 🔐 Sécurité

- Validation HMAC des webhooks
- Sessions chiffrées
- Scopes d'accès limités
- Tokens d'accès sécurisés

## 🚀 Déploiement

### 1. Déploiement Shopify

```bash
npm run build
npm run shopify:deploy
```

### 2. Variables de production

Configurez les variables d'environnement en production:
- URL de l'application
- Base de données PostgreSQL
- Secrets Shopify

## 📞 Support WhatsApp

L'intégration WhatsApp utilise Twilio:

```bash
# Configuration Twilio
TWILIO_ACCOUNT_SID=votre_sid
TWILIO_AUTH_TOKEN=votre_token
TWILIO_PHONE_NUMBER=votre_numero
```

## 🔄 Workflow de développement

1. **Développement local**: `npm run dev`
2. **Test Shopify**: `npm run shopify:dev`
3. **Base de données**: `npm run db:studio`
4. **Déploiement**: `npm run shopify:deploy`

## 📚 Documentation

- [Shopify CLI Documentation](https://shopify.dev/docs/cli)
- [Polaris Design System](https://polaris.shopify.com/)
- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)

---

**Votre app Shopify est maintenant prête!** 🎉

La prochaine étape est de configurer vos clés API Shopify Partner et de tester l'authentification.
