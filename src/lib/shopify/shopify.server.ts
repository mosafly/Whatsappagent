import { LATEST_API_VERSION } from '@shopify/shopify-api';
import { shopify, sessionStorage, authenticateAdmin } from './shopify-config';

// Réexporter les fonctions utilitaires depuis shopify-config
export {
  sessionStorage,
  createShopifySession,
  verifyShopifyHmac,
  verifyWebhook,
  generateAuthUrl,
  exchangeCodeForToken,
  getShopInfo,
  ShopifyGraphQL,
} from './shopify-config';

// Helper pour l'authentification admin (utilise la fonction de shopify-config)
export { authenticateAdmin };

// Types pour les sessions Shopify
export interface ShopifySession {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string[];
  expires: Date | null;
  accessToken: string;
  onlineAccessInfo?: {
    associated_user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      accountOwner: boolean;
    };
  };
}

export default shopify;
