'use client';

import { AppProvider } from '@shopify/polaris';
import { ReactNode } from 'react';
import '@shopify/polaris/build/esm/styles.css';

interface ShopifyProviderProps {
  children: ReactNode;
  shop?: string;
  host?: string;
}

export function ShopifyProvider({ children, shop, host }: ShopifyProviderProps) {
  // Configuration pour App Bridge
  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
    host: host || '',
    forceRedirect: false,
  };

  return (
    <AppProvider i18n={{}}>
      {children}
    </AppProvider>
  );
}
