// Test factories for P0 critical scenarios - Jest compatible
export const createWhatsAppMessage = (overrides = {}) => ({
  from: `+${Math.random().toString().slice(2, 14)}`, // Random phone number
  to: '+2250712345678', // Bobotcho WhatsApp number
  body: 'Test message: ' + Math.random().toString(36).substring(7),
  timestamp: new Date().toISOString(),
  messageSid: Math.random().toString(36).substring(2, 15),
  ...overrides,
});

export const createN8NTriggerPayload = (overrides = {}) => ({
  messageId: Math.random().toString(36).substring(2, 15),
  conversationId: Math.random().toString(36).substring(2, 15),
  customerPhone: `+${Math.random().toString().slice(2, 14)}`,
  messageBody: 'Test question: ' + Math.random().toString(36).substring(7),
  shopId: Math.random().toString(36).substring(2, 15),
  ...overrides,
});

// Test helpers for API requests - Jest compatible
export const createTwilioWebhookRequest = (message, signature = 'valid-signature-for-test') => ({
  data: new URLSearchParams({
    From: message.from,
    To: message.to,
    Body: message.body,
  }),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-twilio-signature': signature,
  },
});

export const measureResponseTime = async (startTime) => {
  const endTime = Date.now();
  return (endTime - startTime) / 1000; // Convert to seconds
};
