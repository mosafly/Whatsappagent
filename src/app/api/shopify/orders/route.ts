import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, ShopifyGraphQL } from '@/lib/shopify/shopify-config';

export async function GET(request: NextRequest) {
  try {
    const { admin, shop } = await authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    
    const first = parseInt(searchParams.get('first') || '10');
    const cursor = searchParams.get('cursor') || undefined;

    // Récupérer les commandes via GraphQL
    const response = await ShopifyGraphQL.getOrders(admin, first, cursor);
    
    return NextResponse.json({
      success: true,
      shop,
      data: response.data,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des commandes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
