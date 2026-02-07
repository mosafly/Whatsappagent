'use server';

/**
 * Server action to expose safe configuration values to the client
 * Excludes secrets and sensitive tokens
 */
export async function getConfiguration() {
  return {
    // Twilio
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
      authTokenSet: !!process.env.TWILIO_AUTH_TOKEN,
    },
    // WhatsApp
    whatsapp: {
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '',
    },
    // Supabase
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    // n8n
    n8n: {
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      webhookTestUrl: process.env.N8N_WEBHOOK_TEST_URL || '',
      authTokenSet: !!process.env.N8N_AUTH_TOKEN,
    },
    // OpenRouter
    openrouter: {
      apiKeySet: !!process.env.OPENROUTER_API_KEY,
    },
    // OpenAI
    openai: {
      apiKeySet: !!process.env.OPENAI_API_KEY,
    },
    // Shopify
    shopify: {
      apiKey: process.env.SHOPIFY_API_KEY || '',
      appUrl: process.env.SHOPIFY_APP_URL || '',
      devStoreUrl: process.env.SHOPIFY_DEV_STORE_URL || '',
      devStoreName: process.env.SHOPIFY_DEV_STORE_NAME || '',
      webhookSecretSet: !!process.env.SHOPIFY_WEBHOOK_SECRET,
    },
    // Vercel
    vercel: {
      projectId: process.env.VERCEL_PROJECT_ID || '',
    },
    // Session
    session: {
      storage: process.env.SESSION_STORAGE || 'database',
      secretSet: !!process.env.SESSION_SECRET,
    },
    // Database
    database: {
      urlSet: !!process.env.DATABASE_URL,
    },
    // App
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      host: process.env.HOST || '',
    },
  };
}
