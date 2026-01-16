'use client';

import { Page, Layout, Card, Text, BlockStack, Button } from '@shopify/polaris';
import { useRouter } from 'next/navigation';

export default function ConfigurationPage() {
  const router = useRouter();

  return (
    <Page
      title="Configuration"
      backAction={{
        content: 'Dashboard',
        onAction: () => router.push('/'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Paramètres
              </Text>
              <Text as="p" variant="bodyMd">
                Cette page servira à configurer votre agent (WhatsApp, règles, tracking, intégration Shopify, etc.).
              </Text>
              <Button onClick={() => router.push('/inbox')}>
                Aller à l’Inbox
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
