'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Spinner,
  Select,
  Divider,
} from '@shopify/polaris';
import { createClient } from '@/lib/supabase/client';

type AnalyticsData = {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  totalConversations: number;
  activeConversations: number;
  avgResponseTimeMs: number;
  totalCampaigns: number;
  totalCampaignsSent: number;
  totalAutomations: number;
  activeAutomations: number;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Parallel queries
      const [messagesRes, conversationsRes, aiLogsRes, campaignsRes, automationsRes] =
        await Promise.all([
          supabase
            .from('messages')
            .select('id, role, direction', { count: 'exact' })
            .gte('created_at', startDate),
          supabase
            .from('conversations')
            .select('id, status', { count: 'exact' }),
          supabase
            .from('ai_logs')
            .select('response_time_ms')
            .gte('created_at', startDate)
            .not('response_time_ms', 'is', null),
          supabase
            .from('campaigns')
            .select('id, status', { count: 'exact' }),
          supabase
            .from('automations')
            .select('id, is_active', { count: 'exact' }),
        ]);

      const messages = messagesRes.data || [];
      const conversations = conversationsRes.data || [];
      const aiLogs = aiLogsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const automations = automationsRes.data || [];

      const inbound = messages.filter(
        (m) => m.role === 'customer' || m.direction === 'inbound',
      ).length;
      const outbound = messages.length - inbound;

      const avgTime =
        aiLogs.length > 0
          ? Math.round(
              aiLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) /
                aiLogs.length,
            )
          : 0;

      setData({
        totalMessages: messages.length,
        inboundMessages: inbound,
        outboundMessages: outbound,
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        avgResponseTimeMs: avgTime,
        totalCampaigns: campaigns.length,
        totalCampaignsSent: campaigns.filter(
          (c) => c.status === 'sent' || c.status === 'completed',
        ).length,
        totalAutomations: automations.length,
        activeAutomations: automations.filter((a) => a.is_active).length,
      });

      setLoading(false);
    }
    loadAnalytics();
  }, [supabase, period]);

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading || !data) {
    return (
      <Page title="Analytics">
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
      title="Analytics"
      subtitle="Vue d'ensemble des performances"
    >
      <Layout>
        <Layout.Section>
          <InlineStack align="end">
            <div style={{ width: '200px' }}>
              <Select
                label="Période"
                labelInline
                options={[
                  { label: '7 jours', value: '7d' },
                  { label: '30 jours', value: '30d' },
                  { label: '90 jours', value: '90d' },
                ]}
                value={period}
                onChange={setPeriod}
              />
            </div>
          </InlineStack>
        </Layout.Section>

        {/* Messages Section */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">Messages</Text>
          <div style={{ marginTop: '12px' }}>
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Total messages</Text>
                    <Text as="p" variant="headingXl">{String(data.totalMessages)}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Entrants</Text>
                    <Text as="p" variant="headingXl">{String(data.inboundMessages)}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Sortants</Text>
                    <Text as="p" variant="headingXl">{String(data.outboundMessages)}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Temps réponse moyen</Text>
                    <Text as="p" variant="headingXl">{formatMs(data.avgResponseTimeMs)}</Text>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </div>
        </Layout.Section>

        {/* Conversations Section */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">Conversations</Text>
          <div style={{ marginTop: '12px' }}>
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Total conversations</Text>
                    <Text as="p" variant="headingXl">{String(data.totalConversations)}</Text>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Actives</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="headingXl">{String(data.activeConversations)}</Text>
                      <Badge tone="success">En cours</Badge>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </div>
        </Layout.Section>

        {/* Marketing Section */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">Marketing</Text>
          <div style={{ marginTop: '12px' }}>
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Campagnes</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="headingXl">{String(data.totalCampaigns)}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        ({String(data.totalCampaignsSent)} envoyées)
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">Automations</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="headingXl">{String(data.totalAutomations)}</Text>
                      <Badge tone="success">{`${data.activeAutomations} actives`}</Badge>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
