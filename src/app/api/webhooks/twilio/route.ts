import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration du client Supabase avec la clé de service pour contourner le RLS lors du webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function validateTwilioSignature(body: string, signature: string, url: string, authToken: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(url + body)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Webhook Twilio pour réceptionner les messages WhatsApp
 * Story 1.1 & 1.3: Webhook Twilio & Agent IA Concierge Bobotcho
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Validation signature Twilio (sécurité critique)
    const signature = req.headers.get('x-twilio-signature');
    if (!signature) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return new NextResponse('Twilio auth token missing', { status: 500 });
    }

    const forwardedProto = req.headers.get('x-forwarded-proto');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const baseUrl = forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(req.url).origin;
    const url = `${baseUrl}${req.nextUrl.pathname}${req.nextUrl.search}`;
    const rawBody = await req.text();
    
    if (!validateTwilioSignature(rawBody, signature, url, authToken)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Reparser le FormData après avoir lu le body
    const formData = new FormData();
    const pairs = rawBody.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        formData.append(decodeURIComponent(key), decodeURIComponent(value));
      }
    }
    
    const body = formData.get('Body') as string;
    const from = formData.get('From') as string; // Format: whatsapp:+225...
    const to = formData.get('To') as string;     // Numéro de la boutique
    const messageSid = formData.get('SmsMessageSid') as string;

    // Validation basique
    if (!from || !body) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // 0.1. Idempotence - vérifier si le message existe déjà
    const existingMessage = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('twilio_sid', messageSid)
      .maybeSingle();

    if (existingMessage.data) {
      // Message déjà traité, renvoyer une réponse vide
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const customerPhone = from.replace('whatsapp:', '');
    
    // 1. Trouver ou créer la boutique (mono-tenant pour le moment)
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id')
      .limit(1)
      .single();

    if (shopError || !shop) {
      console.error('Shop not found:', shopError);
      return new NextResponse('Shop configuration error', { status: 500 });
    }

    // 2. Assurer l'existence de la conversation
    let { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('customer_phone', customerPhone)
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: createConvError } = await supabaseAdmin
        .from('conversations')
        .insert({
          customer_phone: customerPhone,
          shop_id: shop.id,
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createConvError) throw createConvError;
      conversation = newConv;
    } else {
      // Mettre à jour la date de dernière activité
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    }

    // 3. Insérer le message entrant
    const { data: insertedMsg, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        shop_id: shop.id,
        role: 'customer',
        content: body,
        metadata: {
          twilio_sid: messageSid,
          from_raw: from,
          to_raw: to
        }
      })
      .select('id')
      .single();

    if (msgError) throw msgError;

    // 4. Appel à l'Agent IA (FastAPI backend ou n8n fallback)
    const startTime = Date.now();
    let aiResponseText = "";
    let aiError = null;

    const BACKEND_URL = process.env.BACKEND_URL; // FastAPI backend
    const AI_TIMEOUT_MS = 25000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      if (BACKEND_URL) {
        // FastAPI backend (replaces n8n)
        const backendRes = await fetch(`${BACKEND_URL}/api/ai-response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.BACKEND_API_KEY || '',
          },
          body: JSON.stringify({
            Body: body,
            From: customerPhone,
            conversationId: conversation.id,
            messageId: insertedMsg.id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!backendRes.ok) throw new Error(`Backend error: ${backendRes.statusText}`);

        const backendData = await backendRes.json();
        aiResponseText = backendData.response || "Message processed";
      } else {
        // Fallback: n8n workflow
        const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Header ${process.env.N8N_AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            Body: body,
            From: customerPhone,
            conversationId: conversation.id,
            messageId: insertedMsg.id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!n8nRes.ok) throw new Error(`n8n error: ${n8nRes.statusText}`);

        await n8nRes.json();
        aiResponseText = "Message sent via n8n workflow";
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        aiError = 'Timeout: AI backend took too long to respond';
      } else {
        aiError = err.message;
      }
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    // 5. Logger l'interaction IA
    await supabaseAdmin
      .from('ai_logs')
      .insert({
        shop_id: shop.id,
        conversation_id: conversation.id,
        input: body,
        output: aiResponseText || aiError,
        metrics: {
          latency_ms: latency,
          error: aiError,
          provider: 'n8n-gpt-4o-mini',
          workflow_version: 'rag-v5'
        }
      });

    // 6. n8n gère l'envoi Twilio directement, on renvoie une réponse vide
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    );

  } catch (error) {
    console.error('[Webhook Twilio Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
