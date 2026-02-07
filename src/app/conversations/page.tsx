'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  TextField,
  Divider,
  Box,
  Badge,
  Spinner,
  EmptyState,
} from '@shopify/polaris';
import { createClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  customer_phone?: string;
  metadata?: Record<string, unknown>;
};

type Conversation = {
  id: string;
  customer_phone: string;
  status: string;
  last_message_at: string;
  created_at: string;
  messages?: Message[];
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
      setLoading(false);
    }
    loadConversations();
  }, [supabase, selectedId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedId) return;

    async function loadMessages() {
      setMessagesLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setMessagesLoading(false);
    }
    loadMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, supabase]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.customer_phone.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 24) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <Page title="Conversations">
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
    <Page title="Conversations" fullWidth>
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Conversations
                </Text>
                <Badge>{String(filteredConversations.length)}</Badge>
              </InlineStack>
              <TextField
                label="Recherche"
                labelHidden
                value={searchQuery}
                onChange={setSearchQuery}
                autoComplete="off"
                placeholder="Rechercher par téléphone..."
              />
              <Divider />
              <BlockStack gap="200">
                {filteredConversations.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Aucune conversation.
                  </Text>
                ) : null}
                {filteredConversations.map((c) => {
                  const isSelected = c.id === selectedId;
                  return (
                    <Box
                      key={c.id}
                      padding="200"
                      background={isSelected ? 'bg-surface-secondary' : undefined}
                      borderRadius="200"
                    >
                      <button
                        onClick={() => setSelectedId(c.id)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'block',
                        }}
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              {c.customer_phone}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {formatTime(c.last_message_at || c.created_at)}
                            </Text>
                          </BlockStack>
                          <Badge
                            tone={c.status === 'active' ? 'success' : 'info'}
                          >
                            {c.status}
                          </Badge>
                        </InlineStack>
                      </button>
                    </Box>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {selectedConversation ? (
                <>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd">
                        {selectedConversation.customer_phone}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Conversation {selectedConversation.status}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Divider />

                  {messagesLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <Spinner size="small" />
                    </div>
                  ) : (
                    <div style={{ minHeight: '350px', maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
                      <BlockStack gap="200">
                        {messages.map((m) => {
                          const isAgent = m.role === 'agent' || m.role === 'system';
                          return (
                            <InlineStack key={m.id} align={isAgent ? 'end' : 'start'}>
                              <div
                                style={{
                                  maxWidth: '75%',
                                  borderRadius: '12px',
                                  padding: '8px 12px',
                                  backgroundColor: isAgent ? '#059669' : '#e2e8f0',
                                  color: isAgent ? '#fff' : '#1e293b',
                                }}
                              >
                                <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                  {m.content}
                                </div>
                                <div
                                  style={{
                                    marginTop: '4px',
                                    fontSize: '11px',
                                    opacity: 0.7,
                                  }}
                                >
                                  {formatTime(m.created_at)}
                                </div>
                              </div>
                            </InlineStack>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </BlockStack>
                    </div>
                  )}

                  <Divider />
                  <InlineStack gap="200" blockAlign="end">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Message"
                        labelHidden
                        value={draft}
                        onChange={setDraft}
                        autoComplete="off"
                        placeholder="Écrivez votre message..."
                        multiline={2}
                      />
                    </div>
                    <Button
                      variant="primary"
                      disabled={!draft.trim()}
                      onClick={() => {
                        // TODO: Send via Twilio API
                        setDraft('');
                      }}
                    >
                      Envoyer
                    </Button>
                  </InlineStack>
                </>
              ) : (
                <EmptyState
                  heading="Sélectionnez une conversation"
                  image=""
                >
                  <p>Choisissez une conversation dans la liste pour voir les messages.</p>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
