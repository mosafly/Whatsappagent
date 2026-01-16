'use server';

import { logAIInteraction } from '@/lib/ai/logger';

export async function testLogAction(shopId: string) {
    const result = await logAIInteraction({
        shop_id: shopId,
        input: "Ceci est un test d'input",
        output: "Ceci est une réponse fictive du Concierge",
        metrics: {
            latency_ms: 1200,
            tokens_in: 15,
            tokens_out: 42,
            model_version: "gpt-4-test"
        }
    });

    return result;
}
