'use client';

import { useState } from 'react';
import { Button, Text, BlockStack, Card, Banner } from '@shopify/polaris';
import { testLogAction } from '@/app/actions/test-log';

export function DebugLogTester() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [lastMessage, setLastMessage] = useState<string>('');

    const handleTestLog = async () => {
        setStatus('loading');
        // Using a fake UUID for testing RLS-bypass or initial setup check
        // In production, the shopId will come from the session/context
        const fakeShopId = '00000000-0000-0000-0000-000000000000';

        try {
            const result = await testLogAction(fakeShopId);
            if (result.success) {
                setStatus('success');
                setLastMessage('Log injecté avec succès dans Supabase !');
            } else {
                setStatus('error');
                setLastMessage(`Erreur : ${result.error?.message || 'Inconnue'}`);
            }
        } catch {
            setStatus('error');
            setLastMessage('Erreur de connexion (Vérifiez votre .env)');
        }
    };

    return (
        <Card>
            <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Audit & Debug IA (Story 1.3)</Text>
                <Text as="p" variant="bodyMd">
                    Testez le pipeline de traçabilité en injectant un log fictif.
                </Text>

                {status === 'success' && (
                    <Banner title="Succès" tone="success">
                        <p>{lastMessage}</p>
                    </Banner>
                )}

                {status === 'error' && (
                    <Banner title="Échec" tone="critical">
                        <p>{lastMessage}</p>
                    </Banner>
                )}

                <Button
                    onClick={handleTestLog}
                    loading={status === 'loading'}
                    variant="primary"
                >
                    Injecter un Log de Test
                </Button>
            </BlockStack>
        </Card>
    );
}
