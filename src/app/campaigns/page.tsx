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
  ProgressBar,
  Banner,
  Divider,
} from '@shopify/polaris';
import { createClient } from '@/lib/supabase/client';

type Campaign = {
  id: string;
  name: string;
  status: string;
  template_name: string;
  segment_name: string | null;
  scheduled_at: string | null;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Informations',
  2: 'Audience',
  3: 'Template',
  4: 'Personnalisation',
  5: 'Review & Envoi',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const supabase = useMemo(() => createClient(), []);

  // Wizard form state
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('promotion');
  const [audience, setAudience] = useState('all');
  const [templateId, setTemplateId] = useState('');
  const [variable1, setVariable1] = useState('');
  const [variable2, setVariable2] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data);
      } else {
        // Table may not exist yet
        setCampaigns([]);
      }
      setLoading(false);
    }
    loadCampaigns();
  }, [supabase]);

  const resourceName = { singular: 'campagne', plural: 'campagnes' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(campaigns);

  const statusTone = (status: string) => {
    switch (status) {
      case 'draft': return undefined;
      case 'scheduled': return 'attention' as const;
      case 'sending': return 'warning' as const;
      case 'sent': return 'success' as const;
      case 'completed': return 'success' as const;
      default: return 'info' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'scheduled': return 'Planifiée';
      case 'sending': return 'En cours';
      case 'sent': return 'Envoyée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setCampaignName('');
    setCampaignType('promotion');
    setAudience('all');
    setTemplateId('');
    setVariable1('');
    setVariable2('');
    setScheduleType('immediate');
  };

  const handleCreateCampaign = async () => {
    const { error } = await supabase.from('campaigns').insert({
      name: campaignName,
      type: campaignType,
      audience,
      template_name: templateId,
      status: scheduleType === 'immediate' ? 'sending' : 'scheduled',
      variables: { var1: variable1, var2: variable2 },
    });

    if (!error) {
      setWizardOpen(false);
      resetWizard();
      // Reload
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setCampaigns(data);
    }
  };

  const rowMarkup = campaigns.map((campaign, index) => (
    <IndexTable.Row
      id={campaign.id}
      key={campaign.id}
      selected={selectedResources.includes(campaign.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {campaign.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={statusTone(campaign.status)}>
          {statusLabel(campaign.status)}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{campaign.template_name || '-'}</IndexTable.Cell>
      <IndexTable.Cell>{campaign.sent_count || 0}</IndexTable.Cell>
      <IndexTable.Cell>{campaign.delivered_count || 0}</IndexTable.Cell>
      <IndexTable.Cell>{campaign.read_count || 0}</IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const wizardProgress = ((wizardStep - 1) / 4) * 100;

  if (loading) {
    return (
      <Page title="Campagnes">
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
      title="Campagnes"
      primaryAction={{
        content: 'Nouvelle campagne',
        onAction: () => {
          resetWizard();
          setWizardOpen(true);
        },
      }}
    >
      <Layout>
        <Layout.Section>
          {/* Stats row */}
          <InlineStack gap="400" wrap={false}>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Total campagnes</Text>
                  <Text as="p" variant="headingLg">{campaigns.length}</Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Envoyées</Text>
                  <Text as="p" variant="headingLg">
                    {campaigns.filter((c) => c.status === 'sent' || c.status === 'completed').length}
                  </Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Messages envoyés</Text>
                  <Text as="p" variant="headingLg">
                    {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
                  </Text>
                </BlockStack>
              </Card>
            </div>
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Taux de lecture</Text>
                  <Text as="p" variant="headingLg">
                    {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) > 0
                      ? `${Math.round(
                          (campaigns.reduce((sum, c) => sum + (c.read_count || 0), 0) /
                            campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)) *
                            100,
                        )}%`
                      : '-'}
                  </Text>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            {campaigns.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <EmptyState
                  heading="Créez votre première campagne"
                  action={{
                    content: 'Nouvelle campagne',
                    onAction: () => {
                      resetWizard();
                      setWizardOpen(true);
                    },
                  }}
                  image=""
                >
                  <p>
                    Envoyez des messages WhatsApp marketing à vos contacts avec des templates Meta approuvés.
                  </p>
                </EmptyState>
              </div>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={campaigns.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Nom' },
                  { title: 'Statut' },
                  { title: 'Template' },
                  { title: 'Envoyés' },
                  { title: 'Délivrés' },
                  { title: 'Lus' },
                  { title: 'Date' },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {/* Campaign Creation Wizard */}
      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={`Nouvelle campagne  Étape ${wizardStep}/5 : ${STEP_LABELS[wizardStep]}`}
        primaryAction={
          wizardStep === 5
            ? { content: 'Lancer la campagne', onAction: handleCreateCampaign }
            : { content: 'Suivant', onAction: () => setWizardStep((s) => Math.min(s + 1, 5) as WizardStep) }
        }
        secondaryActions={
          wizardStep > 1
            ? [{ content: 'Précédent', onAction: () => setWizardStep((s) => Math.max(s - 1, 1) as WizardStep) }]
            : [{ content: 'Annuler', onAction: () => setWizardOpen(false) }]
        }
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <ProgressBar progress={wizardProgress} size="small" />

            {wizardStep === 1 && (
              <FormLayout>
                <TextField
                  label="Nom de la campagne"
                  value={campaignName}
                  onChange={setCampaignName}
                  autoComplete="off"
                  placeholder="Ex: Promo Bobotcho Février"
                />
                <Select
                  label="Type de campagne"
                  options={[
                    { label: 'Promotion', value: 'promotion' },
                    { label: 'Annonce produit', value: 'announcement' },
                    { label: 'Relance', value: 'reactivation' },
                    { label: 'Parrainage', value: 'referral' },
                  ]}
                  value={campaignType}
                  onChange={setCampaignType}
                />
              </FormLayout>
            )}

            {wizardStep === 2 && (
              <FormLayout>
                <Select
                  label="Audience cible"
                  options={[
                    { label: 'Tous les contacts', value: 'all' },
                    { label: 'Clients actifs (30 derniers jours)', value: 'active_30d' },
                    { label: 'Clients inactifs (+30 jours)', value: 'inactive_30d' },
                    { label: 'Nouveaux clients (7 derniers jours)', value: 'new_7d' },
                  ]}
                  value={audience}
                  onChange={setAudience}
                />
                <Banner tone="info">
                  <p>L&apos;audience sera calculée au moment de l&apos;envoi basée sur les conversations Supabase.</p>
                </Banner>
              </FormLayout>
            )}

            {wizardStep === 3 && (
              <FormLayout>
                <Select
                  label="Template WhatsApp (Meta approuvé)"
                  options={[
                    { label: 'Sélectionnez un template...', value: '' },
                    { label: 'Bienvenue Opt-in', value: 'bobotcho_bienvenue_optin' },
                    { label: 'Paiement Réussi', value: 'bobotcho_paiement_reussi' },
                    { label: 'Guide Installation', value: 'bobotcho_rguide_installation' },
                    { label: 'Livraison Imminente', value: 'bobotcho_livraison_imminente' },
                    { label: 'Avis Post-Achat', value: 'bobotcho_avis_post_achat' },
                    { label: 'Avis Post-Achat V2', value: 'bobotcho_avis_post_achat_v2' },
                    { label: 'Panier Abandonné V2', value: 'bobotcho_panier_abandonne_v2' },
                  ]}
                  value={templateId}
                  onChange={setTemplateId}
                />
                {templateId && (
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">Aperçu du template</Text>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                      }}>
                        <Text as="p" variant="bodyMd">
                          Bonjour {'{{1}}'}, découvrez notre offre exclusive Bobotcho à {'{{2}}'} FCFA !
                          Commandez maintenant sur WhatsApp.
                        </Text>
                      </div>
                    </BlockStack>
                  </Card>
                )}
              </FormLayout>
            )}

            {wizardStep === 4 && (
              <FormLayout>
                <Banner tone="info">
                  <p>Personnalisez les variables du template. Utilisez des valeurs par défaut ou des champs dynamiques.</p>
                </Banner>
                <TextField
                  label="Variable {{1}}  Nom du client"
                  value={variable1}
                  onChange={setVariable1}
                  autoComplete="off"
                  placeholder="Ex: Cher(e) client(e)"
                  helpText="Sera remplacé par le nom du contact si disponible"
                />
                <TextField
                  label="Variable {{2}}  Prix/Offre"
                  value={variable2}
                  onChange={setVariable2}
                  autoComplete="off"
                  placeholder="Ex: 60 000"
                />
              </FormLayout>
            )}

            {wizardStep === 5 && (
              <BlockStack gap="400">
                <Banner tone="success">
                  <p>Vérifiez les détails avant de lancer la campagne.</p>
                </Banner>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" tone="subdued">Nom</Text>
                      <Text as="p" variant="bodyMd" fontWeight="bold">{campaignName || '-'}</Text>
                    </InlineStack>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" tone="subdued">Type</Text>
                      <Text as="p" variant="bodyMd">{campaignType}</Text>
                    </InlineStack>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" tone="subdued">Audience</Text>
                      <Text as="p" variant="bodyMd">{audience}</Text>
                    </InlineStack>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" tone="subdued">Template</Text>
                      <Text as="p" variant="bodyMd">{templateId || '-'}</Text>
                    </InlineStack>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" tone="subdued">Envoi</Text>
                      <Badge tone="attention">Immédiat</Badge>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
