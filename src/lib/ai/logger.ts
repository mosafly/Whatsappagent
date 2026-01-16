import { createClient } from '@/lib/supabase/server';

export interface AILogData {
    shop_id: string;
    conversation_id?: string;
    input: string;
    output: string;
    metrics?: {
        latency_ms?: number;
        tokens_in?: number;
        tokens_out?: number;
        confidence_score?: number;
        model_version?: string;
        [key: string]: unknown;
    };
}

/**
 * Persists an AI interaction to the logs for audit and debugging purposes.
 * This should typically be called from a Server Action or Edge Function.
 */
export async function logAIInteraction(data: AILogData) {
    const supabase = await createClient();

    const { error } = await supabase.from('ai_logs').insert({
        shop_id: data.shop_id,
        conversation_id: data.conversation_id,
        input: data.input,
        output: data.output,
        metrics: data.metrics || {},
    });

    if (error) {
        console.error('[STORY 1.3] AI Logger Error:', error);
        return { success: false, error };
    }

    return { success: true };
}
