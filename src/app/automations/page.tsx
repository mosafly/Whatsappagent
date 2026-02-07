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
  Button,
  IndexTable,
  useIndexResourceState,
  Spinner,
  EmptyState,
  Modal,
  TextField,
  Select,
  FormLayout,
  Banner,
  Divider,
} from '@shopify/polaris';
import { createClient } from '@/lib/supabase/client';

type Automation = {
  id: string;
  name: string;
  trigger_type: string;
  template_name: string;
  delay_minutes: number;
  is_active: boolean;
  executions_count: number;
  created_at: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  new_customer: 'Nouveau client',
  order_created: 'Commande créée',
  cart_abandoned: 'Panier abandonné',
  inactive_30d: 'Inactif 30 jours',
  post_purchase: 'Après achat (J+3)',
};

const DELAY_OPTIONS = [
  { label: 'Immédiat', value: '0' },
  { label: '1 heure', value: '60' },
  { label: '3 heures', value: '180' },
  { label: '24 heures', value: '1440' },
  { label: '3 jours', value: '4320' },
  { label: '7 jours', value: '10080' },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState('new_customer');
  const [formTemplate, setFormTemplate] = useState('');
  const [formDelay, setFormDelay] = useState('0');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAutomations(data);
      } else {
        setAutomations([]);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const resourceName = { singular: 'automation', plural: 'automations' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(automations);

  const toggleAutomation = async (id: string, currentActive: boolean) => {
    await supabase
      .from('automations')
      .update({ is_active: !currentActive })
      .eq('id', id);

    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a)),
    );
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('automations').insert({
      name: formName,
      trigger_type: formTrigger,
      template_name: formTemplate,
      delay_minutes: parseInt(formDelay),
      is_active: false,
    });

    if (!error) {
      setCreateOpen(false);
      setFormName('');
      setFormTrigger('new_customer');
      setFormTemplate('');
      setFormDelay('0');
      // Reload
      const { data } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setAutomations(data);
    }
  };

  const formatDelay = (minutes: number) => {
    if (minutes === 0) return 'Immédiat';
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}j`;
  };

  const rowMarkup = automations.map((auto, index) => (
    <IndexTable.Row
      id={auto.id}
      key={auto.id}
      selected={selectedResources.includes(auto.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {auto.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={auto.is_active ? 'success' : undefined}>
          {auto.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {TRIGGER_LABELS[auto.trigger_type] || auto.trigger_type}
      </IndexTable.Cell>
      <IndexTable.Cell>{auto.template_name || '-'}</IndexTable.Cell>
      <IndexTable.Cell>{formatDelay(auto.delay_minutes)}</IndexTable.Cell>
      <IndexTable.Cell>{auto.executions_count || 0}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          variant={auto.is_active ? 'primary' : 'secondary'}
          size="slim"
          onClick={() => toggleAutomation(auto.id, auto.is_active)}
        >
          {auto.is_active ? 'Désactiver' : 'Activer'}
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  if (loading) {
    return (
      <Page title="Automations">
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
      title="Automations"
      subtitle="Envois automatiques basés sur des événements"
      primaryAction={{
        content: 'Nouvelle automation',
        onAction: () => setCreateOpen(true),
      }}
    >
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Total</Text>
                  <Text as="p" variant="headingLg">{automations.length}</Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Actives</Text>
                  <Text as="p" variant="headingLg">
                    {automations.filter((a) => a.is_active).length}
                  </Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Exécutions totales</Text>
                  <Text as="p" variant="headingLg">
                    {automations.reduce((sum, a) => sum + (a.executions_count || 0), 0)}
                  </Text>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            {automations.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <EmptyState
                  heading="Créez votre première automation"
                  action={{
                    content: 'Nouvelle automation',
                    onAction: () => setCreateOpen(true),
                  }}
                  image=""
                >
                  <p>
                    Automatisez vos envois WhatsApp : bienvenue, confirmation de commande, relance panier abandonné...
                  </p>
                </EmptyState>
              </div>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={automations.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Nom' },
                  { title: 'Statut' },
                  { title: 'Déclencheur' },
                  { title: 'Template' },
                  { title: 'Délai' },
                  { title: 'Exécutions' },
                  { title: 'Actions' },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvelle automation"
        primaryAction={{ content: 'Créer', onAction: handleCreate }}
        secondaryActions={[{ content: 'Annuler', onAction: () => setCreateOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Nom de l'automation"
              value={formName}
              onChange={setFormName}
              autoComplete="off"
              placeholder="Ex: Bienvenue nouveau client"
            />
            <Select
              label="Déclencheur"
              options={Object.entries(TRIGGER_LABELS).map(([value, label]) => ({
                label,
                value,
              }))}
              value={formTrigger}
              onChange={setFormTrigger}
            />
            <Select
              label="Template WhatsApp"
              options={[
                { label: 'Sélectionnez...', value: '' },
                { label: 'Bienvenue Opt-in', value: 'bobotcho_bienvenue_optin' },
                { label: 'Paiement Réussi', value: 'bobotcho_paiement_reussi' },
                { label: 'Guide Installation', value: 'bobotcho_rguide_installation' },
                { label: 'Livraison Imminente', value: 'bobotcho_livraison_imminente' },
                { label: 'Avis Post-Achat', value: 'bobotcho_avis_post_achat' },
                { label: 'Avis Post-Achat V2', value: 'bobotcho_avis_post_achat_v2' },
                { label: 'Panier Abandonné V2', value: 'bobotcho_panier_abandonne_v2' },
              ]}
              value={formTemplate}
              onChange={setFormTemplate}
            />
            <Select
              label="Délai avant envoi"
              options={DELAY_OPTIONS}
              value={formDelay}
              onChange={setFormDelay}
            />
            <Banner tone="info">
              <p>L&apos;automation sera créée en mode inactif. Activez-la quand vous êtes prêt.</p>
            </Banner>
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
