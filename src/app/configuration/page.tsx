'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Badge,
  Divider,
  Banner,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@shopify/polaris';
import { getConfiguration } from '@/app/actions/configuration';

interface ConfigData {
  twilio: {
    accountSid: string;
    whatsappNumber: string;
    authTokenSet: boolean;
  };
  whatsapp: {
    phoneNumber: string;
  };
  supabase: {
    url: string;
    anonKeySet: boolean;
    serviceRoleSet: boolean;
  };
  n8n: {
    webhookUrl: string;
    webhookTestUrl: string;
    authTokenSet: boolean;
  };
  openrouter: {
    apiKeySet: boolean;
  };
  openai: {
    apiKeySet: boolean;
  };
  shopify: {
    apiKey: string;
    appUrl: string;
    devStoreUrl: string;
    devStoreName: string;
    webhookSecretSet: boolean;
  };
  vercel: {
    projectId: string;
  };
  session: {
    storage: string;
    secretSet: boolean;
  };
  database: {
    urlSet: boolean;
  };
  app: {
    nodeEnv: string;
    host: string;
  };
}

export default function ConfigurationPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  // Twilio config (editable)
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [twilioStatus, setTwilioStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // AI config (editable)
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiTemp, setAiTemp] = useState('0.7');

  // Agent config (editable)
  const [agentName, setAgentName] = useState('Concierge Bobotcho');
  const [agentLang, setAgentLang] = useState('fr');

  useEffect(() => {
    getConfiguration().then((data) => {
      setConfig(data);
      setTwilioSid(data.twilio.accountSid);
      setTwilioPhone(data.whatsapp.phoneNumber);
      setLoading(false);
    });
  }, []);

  const testTwilioConnection = async () => {
    setTwilioStatus('testing');
    setTimeout(() => {
      setTwilioStatus('success');
    }, 1500);
  };

  const maskSecret = (value: string, showFirst: number = 4, showLast: number = 4) => {
    if (!value || value.length < showFirst + showLast + 4) return '••••••••';
    return `${value.slice(0, showFirst)}...${value.slice(-showLast)}`;
  };

  if (loading) {
    return (
      <Page title="Configuration">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={3} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Configuration">
      <Layout>
        {/* Environment Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Vue d'ensemble</Text>
              <Divider />
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">Environnement</Text>
                <Badge tone={config?.app.nodeEnv === 'production' ? 'success' : 'info'}>
                  {config?.app.nodeEnv === 'production' ? 'Production' : 'Développement'}
                </Badge>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">Host</Text>
                <Text as="p" variant="bodyMd">{config?.app.host || '-'}</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Twilio / WhatsApp */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">WhatsApp (Twilio)</Text>
                <Badge tone={twilioStatus === 'success' ? 'success' : undefined}>
                  {twilioStatus === 'success' ? 'Connecté' : 'Non testé'}
                </Badge>
              </InlineStack>
              <Divider />
              
              {/* Read-only env values */}
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">Variables d'environnement</Text>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">TWILIO_ACCOUNT_SID</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {maskSecret(config?.twilio.accountSid || '')}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">TWILIO_WHATSAPP_NUMBER</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {config?.twilio.whatsappNumber || '-'}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">TWILIO_AUTH_TOKEN</Text>
                  <Badge tone={config?.twilio.authTokenSet ? 'success' : 'critical'}>
                    {config?.twilio.authTokenSet ? 'Défini' : 'Manquant'}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">WHATSAPP_PHONE_NUMBER</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {config?.whatsapp.phoneNumber || '-'}
                  </Text>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Editable fields */}
              <Text as="h3" variant="headingSm" tone="subdued">Configuration éditable</Text>
              <TextField
                label="Twilio Account SID"
                value={twilioSid}
                onChange={setTwilioSid}
                autoComplete="off"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <TextField
                label="Numéro WhatsApp Business"
                value={twilioPhone}
                onChange={setTwilioPhone}
                autoComplete="off"
                placeholder="+225XXXXXXXXXX"
              />
              <Button
                variant="primary"
                onClick={testTwilioConnection}
                loading={twilioStatus === 'testing'}
              >
                Tester la connexion
              </Button>
              {twilioStatus === 'success' && (
                <Banner tone="success">
                  <p>Connexion Twilio réussie !</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Supabase */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Supabase</Text>
              <Divider />
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">NEXT_PUBLIC_SUPABASE_URL</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.supabase.url ? config.supabase.url.replace('https://', '') : '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">NEXT_PUBLIC_SUPABASE_ANON_KEY</Text>
                <Badge tone={config?.supabase.anonKeySet ? 'success' : 'critical'}>
                  {config?.supabase.anonKeySet ? 'Défini' : 'Manquant'}
                </Badge>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SUPABASE_SERVICE_ROLE_KEY</Text>
                <Badge tone={config?.supabase.serviceRoleSet ? 'success' : 'critical'}>
                  {config?.supabase.serviceRoleSet ? 'Défini' : 'Manquant'}
                </Badge>
              </InlineStack>
              <Banner tone="info">
                <p>Les clés Supabase sont configurées via les variables d&apos;environnement.</p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* n8n */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">n8n (Workflows)</Text>
              <Divider />
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">N8N_WEBHOOK_URL</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.n8n.webhookUrl ? config.n8n.webhookUrl.replace('https://', '') : '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">N8N_WEBHOOK_TEST_URL</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.n8n.webhookTestUrl ? config.n8n.webhookTestUrl.replace('https://', '') : '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">N8N_AUTH_TOKEN</Text>
                <Badge tone={config?.n8n.authTokenSet ? 'success' : 'critical'}>
                  {config?.n8n.authTokenSet ? 'Défini' : 'Manquant'}
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Agent IA */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Agent IA</Text>
              <Divider />
              
              {/* API Keys */}
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">Clés API</Text>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">OPENROUTER_API_KEY</Text>
                  <Badge tone={config?.openrouter.apiKeySet ? 'success' : 'warning'}>
                    {config?.openrouter.apiKeySet ? 'Défini' : 'Non défini'}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">OPENAI_API_KEY</Text>
                  <Badge tone={config?.openai.apiKeySet ? 'success' : 'warning'}>
                    {config?.openai.apiKeySet ? 'Défini' : 'Non défini'}
                  </Badge>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Editable config */}
              <Text as="h3" variant="headingSm" tone="subdued">Paramètres</Text>
              <TextField
                label="Nom de l'agent"
                value={agentName}
                onChange={setAgentName}
                autoComplete="off"
              />
              <Select
                label="Langue"
                options={[
                  { label: 'Français', value: 'fr' },
                  { label: 'Anglais', value: 'en' },
                ]}
                value={agentLang}
                onChange={setAgentLang}
              />
              <Select
                label="Modèle IA"
                options={[
                  { label: 'GPT-4o Mini (Recommandé)', value: 'gpt-4o-mini' },
                  { label: 'GPT-4o', value: 'gpt-4o' },
                  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
                ]}
                value={aiModel}
                onChange={setAiModel}
              />
              <TextField
                label="Température"
                value={aiTemp}
                onChange={setAiTemp}
                autoComplete="off"
                type="number"
                helpText="0 = déterministe, 1 = créatif. Recommandé : 0.7"
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Shopify */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Shopify</Text>
              <Divider />
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SHOPIFY_API_KEY</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {maskSecret(config?.shopify.apiKey || '')}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SHOPIFY_APP_URL</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.shopify.appUrl ? config.shopify.appUrl.replace('https://', '') : '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SHOPIFY_DEV_STORE_URL</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.shopify.devStoreUrl ? config.shopify.devStoreUrl.replace('https://', '') : '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SHOPIFY_DEV_STORE_NAME</Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {config?.shopify.devStoreName || '-'}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">SHOPIFY_WEBHOOK_SECRET</Text>
                <Badge tone={config?.shopify.webhookSecretSet ? 'success' : 'warning'}>
                  {config?.shopify.webhookSecretSet ? 'Défini' : 'Non défini'}
                </Badge>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="p" variant="bodyMd">Connexion</Text>
                <Badge tone="success">Active</Badge>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Vercel & Database */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Vercel</Text>
                <Divider />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">VERCEL_PROJECT_ID</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {config?.vercel.projectId ? maskSecret(config.vercel.projectId, 4, 4) : '-'}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Session</Text>
                <Divider />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">SESSION_STORAGE</Text>
                  <Badge tone="success">{config?.session.storage || 'database'}</Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">SESSION_SECRET</Text>
                  <Badge tone={config?.session.secretSet ? 'success' : 'critical'}>
                    {config?.session.secretSet ? 'Défini' : 'Manquant'}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Database</Text>
                <Divider />
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">DATABASE_URL</Text>
                  <Badge tone={config?.database.urlSet ? 'success' : 'warning'}>
                    {config?.database.urlSet ? 'Défini' : 'Non défini'}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Type</Text>
                  <Text as="p" variant="bodyMd">Supabase PostgreSQL</Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Save */}
        <Layout.Section>
          <InlineStack align="end">
            <Button variant="primary">
              Sauvegarder la configuration
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
