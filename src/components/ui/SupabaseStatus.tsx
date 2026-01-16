'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge, Text, BlockStack } from '@shopify/polaris';

export function SupabaseStatus() {
    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [errorHeader, setErrorHeader] = useState<string>('');

    useEffect(() => {
        async function checkConnection() {
            const supabase = createClient();
            try {
                const { error } = await supabase.from('shops').select('count', { count: 'exact', head: true });
                if (error) {
                    // If error 404 or connection error, but supabase initialized, we show error
                    setStatus('error');
                    setErrorHeader(error.message);
                } else {
                    setStatus('connected');
                }
            } catch {
                setStatus('error');
                setErrorHeader('Non configuré');
            }
        }

        checkConnection();
    }, []);

    return (
        <BlockStack gap="200">
            <div className="flex items-center gap-2">
                <Text as="p" variant="bodyMd">Base de données Supabase :</Text>
                {status === 'checking' && <Badge progress="incomplete">Vérification...</Badge>}
                {status === 'connected' && <Badge tone="success">Connecté</Badge>}
                {status === 'error' && (
                    <Badge tone="critical">
                        {errorHeader === 'Non configuré' ? 'Attente Config (.env)' : 'Erreur Connexion'}
                    </Badge>
                )}
            </div>
        </BlockStack>
    );
}
