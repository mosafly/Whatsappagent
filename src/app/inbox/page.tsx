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
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

type InboxMessage = {
  id: string;
  role: 'customer' | 'agent';
  text: string;
  createdAt: string;
};

type InboxConversation = {
  id: string;
  customerName: string;
  phone: string;
  lastMessagePreview: string;
  unreadCount: number;
  messages: InboxMessage[];
};

function createInitialConversations(): InboxConversation[] {
  return [
    {
      id: 'c-1',
      customerName: 'Sarah Martin',
      phone: '+33 6 12 34 56 78',
      lastMessagePreview: 'Je peux avoir un suivi de commande ?',
      unreadCount: 2,
      messages: [
        {
          id: 'm-1',
          role: 'customer',
          text: 'Bonjour, je peux avoir un suivi de commande ?',
          createdAt: '10:12',
        },
        {
          id: 'm-2',
          role: 'agent',
          text: 'Bonjour Sarah, bien sûr. Pouvez-vous me donner votre numéro de commande ?',
          createdAt: '10:13',
        },
        {
          id: 'm-3',
          role: 'customer',
          text: 'Oui: #10482',
          createdAt: '10:14',
        },
      ],
    },
    {
      id: 'c-2',
      customerName: 'Nicolas Dupont',
      phone: '+33 7 98 76 54 32',
      lastMessagePreview: 'Vous avez la taille M en stock ?',
      unreadCount: 0,
      messages: [
        {
          id: 'm-1',
          role: 'customer',
          text: 'Hello, vous avez la taille M en stock ?',
          createdAt: 'Hier',
        },
        {
          id: 'm-2',
          role: 'agent',
          text: 'Oui, la taille M est disponible. Vous souhaitez quelle couleur ?',
          createdAt: 'Hier',
        },
      ],
    },
    {
      id: 'c-3',
      customerName: 'Amina Benali',
      phone: '+33 6 44 55 66 77',
      lastMessagePreview: 'Merci !',
      unreadCount: 1,
      messages: [
        {
          id: 'm-1',
          role: 'customer',
          text: 'Je voudrais modifier mon adresse de livraison.',
          createdAt: '09:01',
        },
        {
          id: 'm-2',
          role: 'agent',
          text: 'D’accord. Envoyez-moi la nouvelle adresse complète et je m’en occupe.',
          createdAt: '09:02',
        },
        {
          id: 'm-3',
          role: 'customer',
          text: 'Merci !',
          createdAt: '09:03',
        },
      ],
    },
  ];
}

const initialConversations = createInitialConversations();

function formatConversationTitle(conversation: InboxConversation) {
  return `${conversation.customerName} · ${conversation.phone}`;
}

function computeLastPreview(conversation: InboxConversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  return last?.text ?? '';
}

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<InboxConversation[]>(() =>
    initialConversations,
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    () => initialConversations[0]?.id ?? '',
  );
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery]);

  const canSend = Boolean(draft.trim().length > 0 && selectedConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, selectedConversation?.messages.length]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleSend = () => {
    if (!selectedConversation) return;
    const text = draft.trim();
    if (!text) return;

    const newMessage: InboxMessage = {
      id: `m-${Date.now()}`,
      role: 'agent',
      text,
      createdAt: 'À l’instant',
    };

    setDraft('');
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== selectedConversation.id) return c;
        const next = {
          ...c,
          messages: [...c.messages, newMessage],
        };
        return {
          ...next,
          lastMessagePreview: computeLastPreview(next),
        };
      }),
    );
  };

  return (
    <Page
      title="Inbox"
      backAction={{
        content: 'Dashboard',
        onAction: () => router.push('/'),
      }}
      primaryAction={{
        content: 'Configuration',
        onAction: () => router.push('/configuration'),
      }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Conversations
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {filteredConversations.length}
                </Text>
              </InlineStack>
              <TextField
                label="Recherche"
                labelHidden
                value={searchQuery}
                onChange={setSearchQuery}
                autoComplete="off"
                placeholder="Rechercher (nom, téléphone, message...)"
              />
              <Divider />
              <BlockStack gap="200">
                {filteredConversations.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Aucune conversation ne correspond à votre recherche.
                  </Text>
                ) : null}

                {filteredConversations.map((c) => {
                  const isSelected = c.id === selectedConversationId;
                  return (
                    <Box
                      key={c.id}
                      padding="200"
                      background={isSelected ? 'bg-surface-secondary' : undefined}
                      borderRadius="200"
                    >
                      <InlineStack align="space-between" blockAlign="start" gap="200">
                        <Box>
                          <Button
                            variant="plain"
                            onClick={() => handleSelectConversation(c.id)}
                          >
                            {c.customerName}
                          </Button>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {c.lastMessagePreview}
                          </Text>
                        </Box>
                        {c.unreadCount > 0 ? (
                          <Box
                            paddingInline="200"
                            paddingBlock="100"
                            borderRadius="200"
                            background="bg-fill-brand"
                          >
                            <Text as="span" variant="bodySm" tone="text-inverse">
                              {c.unreadCount}
                            </Text>
                          </Box>
                        ) : null}
                      </InlineStack>
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
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <Box>
                  <Text as="h2" variant="headingMd">
                    {selectedConversation
                      ? selectedConversation.customerName
                      : 'Sélectionnez une conversation'}
                  </Text>
                  {selectedConversation ? (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {formatConversationTitle(selectedConversation)}
                    </Text>
                  ) : null}
                </Box>
                <InlineStack gap="200">
                  <Button onClick={() => router.push('/configuration')}>Configuration</Button>
                </InlineStack>
              </InlineStack>

              <Divider />

              {selectedConversation ? (
                <BlockStack gap="200">
                  <div className="rounded-lg bg-white p-3 min-h-[260px]">
                    <BlockStack gap="200">
                      {selectedConversation.messages.length === 0 ? (
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Aucun message pour le moment.
                        </Text>
                      ) : null}

                      {selectedConversation.messages.map((m) => {
                        const isAgent = m.role === 'agent';
                        return (
                          <InlineStack key={m.id} align={isAgent ? 'end' : 'start'}>
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                isAgent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                              <div
                                className={`mt-1 text-xs ${
                                  isAgent ? 'text-emerald-100' : 'text-slate-500'
                                }`}
                              >
                                {m.createdAt}
                              </div>
                            </div>
                          </InlineStack>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </BlockStack>
                  </div>

                  <InlineStack gap="200" blockAlign="end" align="space-between">
                    <div className="w-full">
                      <TextField
                        label="Message"
                        labelHidden
                        value={draft}
                        onChange={setDraft}
                        autoComplete="off"
                        placeholder="Écrivez votre message..."
                        multiline={3}
                        helpText="Utilisez le bouton Envoyer"
                      />
                    </div>
                    <Button variant="primary" onClick={handleSend} disabled={!canSend}>
                      Envoyer
                    </Button>
                  </InlineStack>
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Choisissez une conversation à gauche pour afficher le fil de messages.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
