import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl, verifyShopifyHmac } from '@/lib/shopify/shopify-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  try {
    // Valider le paramètre shop
    if (!shop) {
      return NextResponse.json(
        { error: 'Paramètre shop requis' },
        { status: 400 }
      );
    }

    // Valider le format du shop (basic validation)
    if (!shop.endsWith('.myshopify.com') && !shop.includes('/')) {
      return NextResponse.json(
        { error: 'Format de shop invalide' },
        { status: 400 }
      );
    }

    // Générer l'URL d'authentification
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/auth/callback`;
    
    const authUrl = generateAuthUrl(shop, redirectUri, state);

    // Rediriger vers Shopify
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('Erreur lors de l\'initialisation OAuth:', error);
    return NextResponse.json(
      { error: 'Erreur d\'authentification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
