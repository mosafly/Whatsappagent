'use client';

import { useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { DebugLogTester } from '@/components/ui/DebugLogTester';
import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Récupérer les paramètres Shopify de l'URL
    const shopParam = searchParams.get('shop');
    const hostParam = searchParams.get('host');
    
    if (shopParam) {
      setShop(shopParam);
      // Stocker les infos Shopify dans localStorage
      localStorage.setItem('shopify-shop', shopParam);
      if (hostParam) {
        localStorage.setItem('shopify-host', hostParam);
      }
    }

    // Simuler le chargement et vérifier l'authentification
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Si pas de shop et pas en mode développement, rediriger vers l'auth
      if (!shopParam && process.env.NODE_ENV === 'production') {
        router.push('/api/auth');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Page 
      title="Whatsappagent Dashboard"
      subtitle={shop ? `Shop: ${shop}` : 'Mode Développement'}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Bienvenue sur votre centre de commandement
              </Text>
              <Text as="p" variant="bodyMd">
                Le Concierge Anticipatif est prêt à booster vos ventes sur WhatsApp. 🚀
              </Text>
              <div className="mt-4 flex gap-4">
                <Button variant="primary" onClick={() => router.push('/inbox')}>
                  Voir l&apos;Inbox
                </Button>
                <Button onClick={() => router.push('/configuration')}>
                  Configuration
                </Button>
              </div>
              {shop && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <Text as="p" variant="bodySm" tone="success">
                    ✅ Connecté à Shopify: {shop}
                  </Text>
                </div>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Statut IA & Data
                </Text>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                  <Text as="p" variant="bodyMd">Agent Connecté</Text>
                </div>
                <SupabaseStatus />
              </BlockStack>
            </Card>
            <DebugLogTester />
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
