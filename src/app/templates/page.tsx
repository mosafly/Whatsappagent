'use client';

import { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Divider,
  Box,
} from '@shopify/polaris';

type WhatsAppTemplate = {
  id: string;
  name: string;
  display_name: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  body: string;
  variables: string[];
  twilio_content_sid: string;
};

const TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'bobotcho_bienvenue_optin',
    name: 'bobotcho_bienvenue_optin',
    display_name: 'Bienvenue Opt-in',
    category: 'UTILITY',
    status: 'approved',
    language: 'fr',
    body: 'Bienvenue chez Bobotcho {{1}} ! Vous recevrez ici vos confirmations de commande et le suivi de votre livraison. Nous respectons votre tranquillité : pour ne plus recevoir de messages, répondez STOP.',
    variables: ['Nom du client'],
    twilio_content_sid: 'HX270c5f49a05db6b144e08d91cbd7a082',
  },
  {
    id: 'bobotcho_paiement_reussi',
    name: 'bobotcho_paiement_reussi',
    display_name: 'Paiement Réussi',
    category: 'UTILITY',
    status: 'approved',
    language: 'fr',
    body: 'Cher Monsieur, Chère Madame {{1}}, votre paiement pour la commande {{2}} est bien reçu. Votre voyage vers un nouveau standard d\'hygiène et de dignité commence maintenant. Merci de votre confiance en Bobotcho.',
    variables: ['Nom du client', 'Numéro commande'],
    twilio_content_sid: 'HX4db9d71658a47c6ea17bd86e5055358d',
  },
  {
    id: 'bobotcho_rguide_installation',
    name: 'bobotcho_rguide_installation',
    display_name: 'Guide Installation',
    category: 'UTILITY',
    status: 'approved',
    language: 'fr',
    body: 'Bonjour {{1}}, vous allez adorer la simplicité de Bobotcho. Installation en 10 minutes, sans outils. Voici votre guide vidéo {{2}} pour commencer à profiter d\'une fraîcheur absolue. Bonne installation !',
    variables: ['Nom du client', 'Lien vidéo'],
    twilio_content_sid: 'HX79255b66bb1cf3c516d91a1cc1f2595c',
  },
  {
    id: 'bobotcho_livraison_imminente',
    name: 'bobotcho_livraison_imminente',
    display_name: 'Livraison Imminente',
    category: 'UTILITY',
    status: 'approved',
    language: 'fr',
    body: 'Bonjour {{1}}, votre colis Bobotcho arrive aujourd\'hui ou demain. Notre livreur vous contactera dans les prochaines heures. Préparez-vous à découvrir ce que signifie vraiment être propre !',
    variables: ['Nom du client'],
    twilio_content_sid: 'HX2a5eadca5715b45a3a21f8c9427f06af',
  },
  {
    id: 'bobotcho_avis_post_achat',
    name: 'bobotcho_avis_post_achat',
    display_name: 'Avis Post-Achat',
    category: 'UTILITY',
    status: 'approved',
    language: 'fr',
    body: 'Bonjour {{1}}, merci pour votre message. Nos conseillers Bobotcho sont actuellement indisponibles, mais nous traiterons votre demande en priorité dès demain matin à 8h. Consultez notre guide {{2}} en attendant. Merci de votre patience !',
    variables: ['Nom du client', 'Lien guide'],
    twilio_content_sid: 'HXb1697c0b2c263e57ef481a851f9a696a',
  },
  {
    id: 'bobotcho_avis_post_achat_v2',
    name: 'bobotcho_avis_post_achat_v2',
    display_name: 'Avis Post-Achat V2',
    category: 'MARKETING',
    status: 'approved',
    language: 'fr',
    body: 'Bonjour {{1}}, voilà maintenant quelques jours que vous utilisez votre Bobotcho. Votre avis est précieux pour nous ! Comment décririez-vous votre nouvelle sensation de fraîcheur ? Partagez votre expérience {{2}}. Merci d\'avance !',
    variables: ['Nom du client', 'Lien avis'],
    twilio_content_sid: 'HXd0b28d4eba9b9d2b97d84708214fdc45',
  },
  {
    id: 'bobotcho_panier_abandonne_v2',
    name: 'bobotcho_panier_abandonne_v2',
    display_name: 'Panier Abandonné V2',
    category: 'MARKETING',
    status: 'approved',
    language: 'fr',
    body: 'Bonjour {{1}}, votre confort ne devrait pas attendre. Vous avez laissé votre Bobotcho dans le panier, mais chaque jour sans lui est un jour de plus avec irritations et inconfort. Finalisez votre commande {{2}}. Votre bien-être vous attend !',
    variables: ['Nom du client', 'Lien panier'],
    twilio_content_sid: 'HXeb404635e8d4ca6d920dbaa2db7d231b',
  },
];

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  const statusTone = (status: string) => {
    switch (status) {
      case 'approved': return 'success' as const;
      case 'pending': return 'attention' as const;
      case 'rejected': return 'critical' as const;
      default: return 'info' as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'MARKETING': return 'Marketing';
      case 'UTILITY': return 'Utilitaire';
      case 'AUTHENTICATION': return 'Authentification';
      default: return cat;
    }
  };

  return (
    <Page
      title="Templates WhatsApp"
      subtitle="Templates Meta approuvés pour vos campagnes et automations"
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {TEMPLATES.map((template) => (
              <Card key={template.id}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        {template.display_name}
                      </Text>
                      <Badge tone={statusTone(template.status)}>
                        {statusLabel(template.status)}
                      </Badge>
                      <Badge>{categoryLabel(template.category)}</Badge>
                    </InlineStack>
                    <Button
                      variant="plain"
                      onClick={() =>
                        setSelectedTemplate(
                          selectedTemplate?.id === template.id ? null : template,
                        )
                      }
                    >
                      {selectedTemplate?.id === template.id ? 'Masquer' : 'Aperçu'}
                    </Button>
                  </InlineStack>

                  <Text as="p" variant="bodySm" tone="subdued">
                    SID: {template.twilio_content_sid}  Langue: {template.language}  Variables: {template.variables.length}
                  </Text>

                  {selectedTemplate?.id === template.id && (
                    <>
                      <Divider />
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '12px',
                          border: '1px solid #bbf7d0',
                          maxWidth: '400px',
                        }}
                      >
                        <Text as="p" variant="bodyMd">
                          {template.body}
                        </Text>
                      </div>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" fontWeight="semibold">
                          Variables :
                        </Text>
                        {template.variables.map((v, i) => (
                          <Text key={i} as="p" variant="bodySm" tone="subdued">
                            {`{{${i + 1}}}`}  {v}
                          </Text>
                        ))}
                      </BlockStack>
                    </>
                  )}
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Résumé</Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Total templates</Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">{String(TEMPLATES.length)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Approuvés</Text>
                  <Badge tone="success">
                    {String(TEMPLATES.filter((t) => t.status === 'approved').length)}
                  </Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Marketing</Text>
                  <Text as="p" variant="bodyMd">
                    {String(TEMPLATES.filter((t) => t.category === 'MARKETING').length)}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">Utilitaire</Text>
                  <Text as="p" variant="bodyMd">
                    {String(TEMPLATES.filter((t) => t.category === 'UTILITY').length)}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <div style={{ marginTop: '16px' }}>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Guide</Text>
                <Text as="p" variant="bodySm">
                  Les templates doivent être approuvés par Meta avant utilisation.
                  Utilisez les variables {'{{1}}'}, {'{{2}}'} pour personnaliser les messages.
                </Text>
                <Text as="p" variant="bodySm">
                  Catégories : <strong>Marketing</strong> (promos, relances),
                  <strong> Utilitaire</strong> (confirmations, notifications).
                </Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
