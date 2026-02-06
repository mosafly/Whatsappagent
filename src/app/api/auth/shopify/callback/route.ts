import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  if (!shop) {
    return NextResponse.json(
      { error: 'Paramètre shop requis' },
      { status: 400 }
    );
  }

  // Rediriger vers l'application principale
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('shop', shop);
  if (host) {
    redirectUrl.searchParams.set('host', host);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
