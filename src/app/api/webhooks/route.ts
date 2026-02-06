import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyWebhook } from '@/lib/shopify/shopify-config';

// Types pour les webhooks Shopify
interface ShopifyWebhook {
  topic: string;
  shop: string;
  payload: any;
}

// Handlers pour différents types de webhooks
async function handleProductCreated(payload: any, shop: string) {
  console.log(`Nouveau produit créé dans ${shop}:`, payload.title);
  // Logique métier: notifier sur WhatsApp, mettre à jour la base de données, etc.
  
  // Exemple: Intégration avec votre système WhatsApp
  // await sendWhatsAppNotification({
  //   message: `Nouveau produit: ${payload.title}`,
  //   shop: shop
  // });
}

async function handleOrderCreated(payload: any, shop: string) {
  console.log(`Nouvelle commande dans ${shop}:`, payload.id);
  // Logique métier: confirmation commande, notification WhatsApp
  
  // Exemple: Envoyer confirmation WhatsApp
  // await sendWhatsAppOrderConfirmation(payload);
}

async function handleCustomerCreated(payload: any, shop: string) {
  console.log(`Nouveau client dans ${shop}:`, payload.email);
  // Logique métier: bienvenue WhatsApp, intégration CRM
}

async function handleAppUninstalled(payload: any, shop: string) {
  console.log(`App désinstallée de ${shop}`);
  // Nettoyer les données, supprimer les webhooks, etc.
  
  // Exemple: Nettoyer la base de données
  // await cleanupShopData(shop);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Valider le webhook
    if (!verifyWebhook(request, body)) {
      return NextResponse.json(
        { error: 'Webhook invalide' },
        { status: 401 }
      );
    }

    const topic = request.headers.get('x-shopify-topic')!;
    const shop = request.headers.get('x-shopify-shop-domain')!;
    const payload = JSON.parse(body);

    console.log(`Webhook reçu: ${topic} de ${shop}`);

    // Router vers le handler approprié
    switch (topic) {
      case 'PRODUCTS_CREATE':
        await handleProductCreated(payload, shop);
        break;
        
      case 'PRODUCTS_UPDATE':
        console.log(`Produit mis à jour: ${payload.id}`);
        break;
        
      case 'PRODUCTS_DELETE':
        console.log(`Produit supprimé: ${payload.id}`);
        break;
        
      case 'ORDERS_CREATE':
        await handleOrderCreated(payload, shop);
        break;
        
      case 'ORDERS_UPDATED':
        console.log(`Commande mise à jour: ${payload.id}`);
        break;
        
      case 'ORDERS_CANCELLED':
        console.log(`Commande annulée: ${payload.id}`);
        break;
        
      case 'CUSTOMERS_CREATE':
        await handleCustomerCreated(payload, shop);
        break;
        
      case 'CUSTOMERS_UPDATE':
        console.log(`Client mis à jour: ${payload.id}`);
        break;
        
      case 'APP_UNINSTALLED':
        await handleAppUninstalled(payload, shop);
        break;
        
      default:
        console.log(`Webhook non géré: ${topic}`);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Webhook endpoint - POST uniquement' },
    { status: 405 }
  );
}
