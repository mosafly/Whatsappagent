import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, ShopifyGraphQL } from '@/lib/shopify/shopify-config';

export async function GET(request: NextRequest) {
  try {
    const { admin, shop } = await authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    
    const first = parseInt(searchParams.get('first') || '10');
    const cursor = searchParams.get('cursor') || undefined;

    // Récupérer les produits via GraphQL
    const response = await ShopifyGraphQL.getProducts(admin, first, cursor);
    
    return NextResponse.json({
      success: true,
      shop,
      data: response.data,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des produits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, shop } = await authenticateAdmin(request);
    const productData = await request.json();

    // Créer un nouveau produit
    const response = await ShopifyGraphQL.createProduct(admin, productData);
    
    if (response.data.productCreate.userErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Erreur lors de la création du produit',
          details: response.data.productCreate.userErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      shop,
      data: response.data.productCreate.product,
    });

  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du produit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
