-- Migration: Support for Twilio Webhook
-- Story 1.3: Agent IA Concierge Bobotcho

-- Add columns to messages table for direct webhook insertion
-- (without requiring conversation_id upfront)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS shop_phone TEXT,
ADD COLUMN IF NOT EXISTS message_body TEXT,
ADD COLUMN IF NOT EXISTS twilio_sid TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'inbound',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received';

-- Make conversation_id nullable for webhook-first insertion
ALTER TABLE public.messages 
ALTER COLUMN conversation_id DROP NOT NULL;

-- Add columns to ai_logs for performance monitoring
ALTER TABLE public.ai_logs
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.messages(id),
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS n8n_success BOOLEAN DEFAULT false;

-- Make shop_id nullable for webhook context (will be set later)
ALTER TABLE public.ai_logs
ALTER COLUMN shop_id DROP NOT NULL;

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_response_time 
ON public.ai_logs(response_time_ms);

CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at 
ON public.ai_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_customer_phone 
ON public.messages(customer_phone);

CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid 
ON public.messages(twilio_sid);

-- RLS Policy for anonymous webhook access (service role)
-- Note: The webhook uses service role key, so RLS is bypassed
-- This policy is for authenticated users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Service role can insert messages'
  ) THEN
    CREATE POLICY "Service role can insert messages"
    ON public.messages
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_logs'
      AND policyname = 'Service role can insert ai_logs'
  ) THEN
    CREATE POLICY "Service role can insert ai_logs"
    ON public.ai_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- Function to auto-create conversation if needed
CREATE OR REPLACE FUNCTION public.ensure_conversation(
    p_customer_phone TEXT,
    p_shop_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to find existing active conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE customer_phone = p_customer_phone
    AND (p_shop_id IS NULL OR shop_id = p_shop_id)
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF v_conversation_id IS NULL AND p_shop_id IS NOT NULL THEN
        INSERT INTO public.conversations (shop_id, customer_phone, status)
        VALUES (p_shop_id, p_customer_phone, 'active')
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.ensure_conversation IS 
'Finds or creates a conversation for a customer phone number';
