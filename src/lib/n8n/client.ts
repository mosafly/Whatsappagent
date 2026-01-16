/**
 * N8N Client for triggering AI workflows
 * Handles communication between Next.js and N8N workflows
 */

export interface N8NTriggerPayload {
  messageId: string;
  conversationId: string;
  customerPhone: string;
  messageBody: string;
  shopId: string;
}

export class N8NClient {
  private baseUrl: string;
  private authToken: string;

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
    this.authToken = process.env.N8N_AUTH_TOKEN || '';
  }

  /**
   * Triggers the AI workflow in N8N for a new message
   */
  async triggerAIWorkflow(payload: N8NTriggerPayload): Promise<void> {
    if (!this.baseUrl || !this.authToken) {
      throw new Error('N8N configuration missing');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`N8N trigger failed: ${response.statusText}`);
    }
  }
}
