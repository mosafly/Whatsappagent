import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import { PrismaClient } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Initialisation Prisma
const prisma = new PrismaClient();

// Configuration Shopify pour Next.js
const shopify = shopifyApi({
  apiVersion: LATEST_API_VERSION,
  adminApiVersion: LATEST_API_VERSION,
  restAdminApiVersion: LATEST_API_VERSION,
  isCustomStoreApp: false,
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(',') || [],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost:3000',
  isEmbeddedApp: true,
});

// Session storage custom pour Next.js
class NextJsSessionStorage {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async storeSession(session: any) {
    const { id, shop, state, isOnline, scope, expires, accessToken, onlineAccessInfo } = session;
    
    await this.prisma.shopifySession.upsert({
      where: { shop },
      update: {
        state,
        isOnline,
        scope,
        expires,
        accessToken,
        onlineAccessInfo,
      },
      create: {
        id,
        shop,
        state,
        isOnline,
        scope,
        expires,
        accessToken,
        onlineAccessInfo,
      },
    });

    return true;
  }

  async loadSession(id: string) {
    const session = await this.prisma.shopifySession.findUnique({
      where: { id },
    });

    if (!session) {
      return undefined;
    }

    // Vérifier si la session a expiré
    if (session.expires && new Date() > session.expires) {
      await this.deleteSession(id);
      return undefined;
    }

    return {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
      onlineAccessInfo: session.onlineAccessInfo,
    };
  }

  async deleteSession(id: string) {
    await this.prisma.shopifySession.delete({
      where: { id },
    });
    return true;
  }

  async findSessionsByShop(shop: string) {
    const sessions = await this.prisma.shopifySession.findMany({
      where: { shop },
    });

    return sessions.map(session => ({
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
      onlineAccessInfo: session.onlineAccessInfo,
    }));
  }
}

const sessionStorage = new NextJsSessionStorage(prisma);

// Helper pour authentification admin
export async function authenticateAdmin(request: Request) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (!shop) {
    throw new Error('Shop parameter required');
  }

  // Vérifier si une session existe pour ce shop
  const sessions = await sessionStorage.findSessionsByShop(shop);
  const sessionData = sessions[0]; // Prendre la première session active

  if (!sessionData) {
    throw new Error('No active session found');
  }

  // Créer un objet Session Shopify
  const session = new Session({
    id: sessionData.id,
    shop: sessionData.shop,
    state: sessionData.state,
    isOnline: sessionData.isOnline,
    scope: sessionData.scope.join(','),
    expires: sessionData.expires || undefined,
    accessToken: sessionData.accessToken,
  });

  // Créer le client REST
  const admin = new shopify.clients.Rest({ session });

  return {
    session: sessionData,
    admin,
    shop,
  };
}

// Helper pour créer une session après OAuth
export async function createShopifySession(shop: string, accessToken: string, shopData: any) {
  const sessionId = crypto.randomUUID();
  const state = crypto.randomUUID();
  
  const sessionData = {
    id: sessionId,
    shop,
    state,
    isOnline: true,
    scope: process.env.SCOPES?.split(',') || [],
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
    accessToken,
    onlineAccessInfo: shopData,
  };

  await sessionStorage.storeSession(sessionData);
  return sessionData;
}

// Helper pour validation HMAC Shopify
export function verifyShopifyHmac(query: string, hmac: string): boolean {
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(query, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

// Helper pour validation webhook
export function verifyWebhook(request: Request, body: string): boolean {
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  
  if (!hmac) {
    return false;
  }

  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'base64'),
    Buffer.from(calculatedHmac, 'base64')
  );
}

// Helper pour générer URLs d'authentification
export function generateAuthUrl(shop: string, redirectUri: string, state: string): string {
  const scopes = process.env.SCOPES?.split(',') || [];
  const apiKey = process.env.SHOPIFY_API_KEY!;
  
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes.join(','),
    redirect_uri: redirectUri,
    state,
    'grant_options[]': 'per-user',
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

// Helper pour échanger le code contre un token
export async function exchangeCodeForToken(shop: string, code: string) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

// Helper pour obtenir les informations du shop
export async function getShopInfo(shop: string, accessToken: string) {
  const response = await fetch(`https://${shop}/admin/api/2025-10/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shop info');
  }

  const data = await response.json();
  return data.shop;
}

// GraphQL Helpers
export class ShopifyGraphQL {
  static async query(admin: any, query: string, variables?: any) {
    const response = await admin.graphql(query, { variables });
    return response.json();
  }

  static async getProducts(admin: any, first: number = 10, cursor?: string) {
    const query = `
      query getProducts($first: Int!, $cursor: String) {
        products(first: $first, after: $cursor) {
          edges {
            node {
              id
              title
              handle
              status
              vendor
              productType
              createdAt
              updatedAt
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              featuredImage {
                url
                altText
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    return this.query(admin, query, { first, cursor });
  }

  static async getOrders(admin: any, first: number = 10, cursor?: string) {
    const query = `
      query getOrders($first: Int!, $cursor: String) {
        orders(first: $first, after: $cursor, reverse: true) {
          edges {
            node {
              id
              name
              email
              phone
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              createdAt
              processedAt
              financialStatus
              fulfillmentStatus
              shippingAddress {
                firstName
                lastName
                address1
                city
                province
                country
                zip
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    return this.query(admin, query, { first, cursor });
  }

  static async getCustomers(admin: any, first: number = 10, cursor?: string) {
    const query = `
      query getCustomers($first: Int!, $cursor: String) {
        customers(first: $first, after: $cursor) {
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
              state
              createdAt
              updatedAt
              ordersCount
              totalSpentV2 {
                amount
                currencyCode
              }
              addresses(first: 1) {
                edges {
                  node {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    return this.query(admin, query, { first, cursor });
  }

  static async createProduct(admin: any, productData: any) {
    const mutation = `
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    return this.query(admin, mutation, { input: productData });
  }

  static async updateProduct(admin: any, id: string, productData: any) {
    const mutation = `
      mutation updateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    return this.query(admin, mutation, { 
      input: { 
        id: `gid://shopify/Product/${id}`, 
        ...productData 
      } 
    });
  }
}

export { shopify, sessionStorage, prisma };
export default shopify;
