'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Badge,
  Button,
  IndexTable,
  useIndexResourceState,
  Spinner,
  EmptyState,
  Filters,
  ChoiceList,
} from '@shopify/polaris';
import { createClient } from '@/lib/supabase/client';

type Contact = {
  id: string;
  customer_phone: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  referral_code?: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setContacts(data);
      }
      setLoading(false);
    }
    loadContacts();
  }, [supabase]);

  const filteredContacts = useMemo(() => {
    let result = contacts;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((c) =>
        c.customer_phone.toLowerCase().includes(q),
      );
    }
    if (statusFilter.length > 0) {
      result = result.filter((c) => statusFilter.includes(c.status));
    }
    return result;
  }, [contacts, searchQuery, statusFilter]);

  const resourceName = { singular: 'contact', plural: 'contacts' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredContacts);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const rowMarkup = filteredContacts.map((contact, index) => (
    <IndexTable.Row
      id={contact.id}
      key={contact.id}
      selected={selectedResources.includes(contact.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {contact.customer_phone}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={contact.status === 'active' ? 'success' : 'info'}>
          {contact.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {formatDate(contact.last_message_at)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {formatDate(contact.created_at)}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  if (loading) {
    return (
      <Page title="Contacts">
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
      title="Contacts"
      primaryAction={{
        content: 'Sync Shopify',
        onAction: () => {
          // TODO: Trigger Shopify customer sync
        },
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <div style={{ padding: '16px' }}>
              <Filters
                queryValue={searchQuery}
                queryPlaceholder="Rechercher par téléphone..."
                onQueryChange={setSearchQuery}
                onQueryClear={() => setSearchQuery('')}
                onClearAll={() => {
                  setSearchQuery('');
                  setStatusFilter([]);
                }}
                filters={[
                  {
                    key: 'status',
                    label: 'Statut',
                    filter: (
                      <ChoiceList
                        title="Statut"
                        titleHidden
                        choices={[
                          { label: 'Actif', value: 'active' },
                          { label: 'Archivé', value: 'archived' },
                          { label: 'En attente', value: 'pending_validation' },
                        ]}
                        selected={statusFilter}
                        onChange={setStatusFilter}
                        allowMultiple
                      />
                    ),
                    shortcut: true,
                  },
                ]}
              />
            </div>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <EmptyState
                  heading="Aucun contact"
                  image=""
                >
                  <p>Les contacts apparaîtront ici lorsque des clients vous contacteront sur WhatsApp.</p>
                </EmptyState>
              </div>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={filteredContacts.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Téléphone' },
                  { title: 'Statut' },
                  { title: 'Dernier message' },
                  { title: 'Créé le' },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Résumé</Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Total contacts</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">{contacts.length}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Actifs</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {contacts.filter((c) => c.status === 'active').length}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
