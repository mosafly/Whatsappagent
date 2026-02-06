import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyShopifyHmac, 
  exchangeCodeForToken, 
  getShopInfo, 
  createShopifySession 
} from '@/lib/shopify/shopify-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const hmac = searchParams.get('hmac');
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');

  try {
    // Valider la requête Shopify
    if (!shop || !hmac || !code) {
      return NextResponse.json(
        { error: 'Paramètres requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier HMAC
    const queryString = searchParams.toString();
    const hmacQuery = queryString.split('hmac=')[1]?.split('&')[0];
    
    if (!verifyShopifyHmac(queryString.replace(`&hmac=${hmacQuery}`, ''), hmacQuery)) {
      return NextResponse.json(
        { error: 'HMAC invalide' },
        { status: 401 }
      );
    }

    // Échanger le code contre un token d'accès
    const { access_token } = await exchangeCodeForToken(shop, code);

    // Récupérer les informations du shop
    const shopData = await getShopInfo(shop, access_token);

    // Créer et stocker la session
    const session = await createShopifySession(shop, access_token, shopData);

    // Rediriger vers l'app avec les paramètres
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.SHOPIFY_APP_URL!;

    const redirectUrl = new URL('/', baseUrl);
    redirectUrl.searchParams.set('shop', shop);
    redirectUrl.searchParams.set('host', host || '');

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Erreur lors du callback OAuth:', error);
    return NextResponse.json(
      { error: 'Erreur d\'authentification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
