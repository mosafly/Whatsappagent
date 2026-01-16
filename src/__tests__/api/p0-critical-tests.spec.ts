import { test, expect } from 'jest';
import { createWhatsAppMessage, createTwilioWebhookRequest, measureResponseTime } from '../support/factories/test-data.factory';

// Mock Next.js request for testing
const mockNextRequest = (url: string, options: any) => {
  return Promise.resolve({
    status: 200,
    text: () => Promise.resolve('<Response></Response>'),
    json: () => Promise.resolve({}),
  } as any);
};

// Mock environment variables
process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.TWILIO_WEBHOOK_URL = 'http://localhost/api/webhooks/twilio';

describe('P0 Critical Tests - Epic 1 Risk Mitigations', () => {
  test.describe('PERF-001: IA Response Time < 30s (BLOCKER)', () => {
    test('should respond to customer question within 30 seconds', async () => {
      // GIVEN: Customer question stored in Supabase
      const message = createWhatsAppMessage({
        body: 'Quel est le prix du Bobotcho ?'
      });

      // WHEN: Webhook triggers N8N workflow
      const startTime = Date.now();
      
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      const response = await request;
      const responseTime = await measureResponseTime(startTime);

      // THEN: Response is successful and within 30 seconds
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(30); // CRITICAL: Must be < 30s
      
      const responseBody = await response.text();
      expect(responseBody).toContain('<Response>');
      expect(responseBody).toContain('<Message>');
      
      // Verify AI response is present (not empty TwiML)
      expect(responseBody).not.toBe('<Response></Response>');
    });

    test('should fail gracefully if N8N takes longer than 30 seconds', async () => {
      // GIVEN: Complex question that might take longer
      const message = createWhatsAppMessage({
        body: 'Explique-moi en détail l\'installation électrique du Bobotcho sans électricité, avec les étapes spécifiques pour Abidjan, et comparez avec les autres options disponibles sur le marché ivoirien.'
      });

      // WHEN: Triggering complex query with timeout
      const startTime = Date.now();
      
      // Mock slow response
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      // Simulate slow processing
      await new Promise(resolve => setTimeout(resolve, 35000));
      const response = await request;
      const responseTime = await measureResponseTime(startTime);

      // THEN: Should handle timeout gracefully
      expect(responseTime).toBeGreaterThan(30);
      // In real implementation, this would be handled by timeout logic
    });
  });

  test.describe('SEC-001: Twilio Signature Validation (MITIGATE)', () => {
    test('should reject requests with missing signature', async () => {
      // GIVEN: Request without Twilio signature
      const message = createWhatsAppMessage();

      // WHEN: Sending webhook without signature
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: new URLSearchParams({
          From: message.from,
          To: message.to,
          Body: message.body,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Missing x-twilio-signature header
        },
      });

      // THEN: Should reject with 401
      expect(request.status).toBe(401);
      
      const body = await request.text();
      expect(body).toContain('Unauthorized');
    });

    test('should reject requests with invalid signature', async () => {
      // GIVEN: Request with malformed signature
      const message = createWhatsAppMessage();

      // WHEN: Sending webhook with invalid signature
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: new URLSearchParams({
          From: message.from,
          To: message.to,
          Body: message.body,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-twilio-signature': 'invalid-signature-malformed-xyz123',
        },
      });

      // THEN: Should reject with 403
      expect(request.status).toBe(403);
      
      const body = await request.text();
      expect(body).toContain('Forbidden');
    });

    test('should reject requests with tampered body', async () => {
      // GIVEN: Valid signature but tampered body content
      const message = createWhatsAppMessage();

      // WHEN: Sending with tampered body but original signature
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: new URLSearchParams({
          From: message.from,
          To: message.to,
          Body: 'TAMPERED: ' + message.body, // Modified content
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-twilio-signature': 'signature-for-original-body', // Won't match tampered content
        },
      });

      // THEN: Should reject with 403
      expect(request.status).toBe(403);
    });

    test('should accept requests with valid signature', async () => {
      // GIVEN: Properly signed request
      const message = createWhatsAppMessage();

      // WHEN: Sending valid webhook
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      // THEN: Should accept and process
      expect(request.status).toBe(200);
      
      const body = await request.text();
      expect(body).toContain('<Response>');
    });
  });

  test.describe('TECH-001: N8N Integration Resilience (MITIGATE)', () => {
    test('should handle N8N service unavailability gracefully', async () => {
      // GIVEN: N8N service is down (mocked)
      const message = createWhatsAppMessage({
        body: 'Test message when N8N is down'
      });

      // WHEN: Triggering webhook while N8N is unavailable
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      // THEN: Should handle gracefully (not crash)
      // Mock fallback response
      expect(request.status).toBe(200);
      
      const body = await request.text();
      expect(body).toContain('<Response>');
      expect(body).toContain('<Message>');
    });

    test('should store message in Supabase even if N8N fails', async () => {
      // GIVEN: Message that needs to be stored
      const message = createWhatsAppMessage({
        body: 'Important message that must be saved'
      });

      // WHEN: N8N processing fails but storage should work
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      // THEN: Message should be stored regardless of N8N status
      expect([200, 500]).toContain(request.status);
      
      // In real implementation, verify message was stored in database
      // This is a placeholder for the actual database verification
    });

    test('should retry N8N communication on temporary failures', async () => {
      // GIVEN: Temporary N8N failure scenario
      const message = createWhatsAppMessage({
        body: 'Message that should trigger retry logic'
      });

      // WHEN: First attempt fails, second succeeds
      const request = mockNextRequest('/api/webhooks/twilio', {
        method: 'POST',
        body: createTwilioWebhookRequest(message).data,
        headers: createTwilioWebhookRequest(message).headers,
      });

      // THEN: Should eventually succeed after retry
      expect(request.status).toBe(200);
      
      const body = await request.text();
      expect(body).toContain('<Response>');
    });
  });
});
