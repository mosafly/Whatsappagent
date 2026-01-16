'use client';

import { useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { SupabaseStatus } from '@/components/ui/SupabaseStatus';
import { DebugLogTester } from '@/components/ui/DebugLogTester';
import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate Shopify Auth / App Bridge loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Page title="Whatsappagent Dashboard">
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
