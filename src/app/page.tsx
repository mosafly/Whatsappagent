'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Spinner,
  Button,
  Divider,
} from '@shopify/polaris';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type DashboardStats = {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  todayMessages: number;
  avgResponseMs: number;
  totalCampaigns: number;
};

type RecentConversation = {
  id: string;
  customer_phone: string;
  status: string;
  last_message_at: string;
};

export default function Home() {
  return (
    <Suspense fallback={
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const shopParam = searchParams.get('shop');
    const hostParam = searchParams.get('host');
    if (shopParam) {
      setShop(shopParam);
      localStorage.setItem('shopify-shop', shopParam);
      if (hostParam) {
        localStorage.setItem('shopify-host', hostParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [convRes, msgRes, todayMsgRes, aiRes, campaignRes, recentRes] =
        await Promise.all([
          supabase.from('conversations').select('id, status', { count: 'exact' }),
          supabase.from('messages').select('id', { count: 'exact' }),
          supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .gte('created_at', today.toISOString()),
          supabase
            .from('ai_logs')
            .select('response_time_ms')
            .not('response_time_ms', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase.from('campaigns').select('id', { count: 'exact' }),
          supabase
            .from('conversations')
            .select('id, customer_phone, status, last_message_at')
            .order('last_message_at', { ascending: false })
            .limit(5),
        ]);

      const conversations = convRes.data || [];
      const aiLogs = aiRes.data || [];
      const avgMs =
        aiLogs.length > 0
          ? Math.round(
              aiLogs.reduce((s, l) => s + (l.response_time_ms || 0), 0) / aiLogs.length,
            )
          : 0;

      setStats({
        totalConversations: convRes.count || conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        totalMessages: msgRes.count || 0,
        todayMessages: todayMsgRes.count || 0,
        avgResponseMs: avgMs,
        totalCampaigns: campaignRes.count || 0,
      });

      setRecentConversations(recentRes.data || []);
      setLoading(false);
    }
    loadDashboard();
  }, [supabase]);

  const formatMs = (ms: number) => {
    if (ms === 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 1) return 'Il y a quelques minutes';
    if (diffH < 24) return `Il y a ${Math.round(diffH)}h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Dashboard"
      subtitle={shop ? `Shop: ${shop}` : 'Bobotcho WhatsApp Marketing'}
    >
      <Layout>
        {/* KPI Row */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Conversations</Text>
                  <Text as="p" variant="headingXl">{String(stats?.totalConversations || 0)}</Text>
                  <Badge tone="success">{`${stats?.activeConversations || 0} actives`}</Badge>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Messages total</Text>
                  <Text as="p" variant="headingXl">{String(stats?.totalMessages || 0)}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {`${stats?.todayMessages || 0} aujourd'hui`}
                  </Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Temps de réponse IA</Text>
                  <Text as="p" variant="headingXl">{formatMs(stats?.avgResponseMs || 0)}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Moyenne (50 derniers)</Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Campagnes</Text>
                  <Text as="p" variant="headingXl">{String(stats?.totalCampaigns || 0)}</Text>
                  <Button variant="plain" onClick={() => router.push('/campaigns')}>
                    Voir tout
                  </Button>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Recent conversations */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Conversations récentes</Text>
                <Button variant="plain" onClick={() => router.push('/conversations')}>
                  Voir toutes
                </Button>
              </InlineStack>
              <Divider />
              {recentConversations.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Aucune conversation pour le moment.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {recentConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => router.push('/conversations')}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'block',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                      }}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {conv.customer_phone}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {conv.last_message_at ? formatTime(conv.last_message_at) : '-'}
                          </Text>
                        </BlockStack>
                        <Badge tone={conv.status === 'active' ? 'success' : 'info'}>
                          {conv.status}
                        </Badge>
                      </InlineStack>
                    </button>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick actions */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Actions rapides</Text>
                <Button variant="primary" fullWidth onClick={() => router.push('/campaigns')}>
                  Nouvelle campagne
                </Button>
                <Button fullWidth onClick={() => router.push('/automations')}>
                  Créer une automation
                </Button>
                <Button fullWidth onClick={() => router.push('/templates')}>
                  Voir les templates
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Statut système</Text>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    animation: 'pulse 2s infinite',
                  }} />
                  <Text as="p" variant="bodyMd">Agent IA connecté</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }} />
                  <Text as="p" variant="bodyMd">Supabase connecté</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }} />
                  <Text as="p" variant="bodyMd">Twilio WhatsApp actif</Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
