-- Tables initialization for Whatsappagent

-- 1. Shops (Tenants)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_domain TEXT UNIQUE NOT NULL,
    shop_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 2. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, archived, pending_validation
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 3. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL, -- 'customer', 'agent', 'system'
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'image', 'payment_link'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. AI Logs (Audit)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id),
    input TEXT,
    output TEXT,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- INITIAL RLS POLICIES
-- Note: These policies assume that the context `app.current_shop_id` is set 
-- either by the backend (JWT) or manually via a RPC for testing.

-- Policy for conversations
CREATE POLICY "Shops can only see their own conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (shop_id = (current_setting('app.current_shop_id', true)::UUID));

-- Policy for messages
CREATE POLICY "Shops can only see their own messages"
ON public.messages
FOR ALL
TO authenticated
USING (shop_id = (current_setting('app.current_shop_id', true)::UUID));

-- Policy for ai_logs
CREATE POLICY "Shops can only see their own logs"
ON public.ai_logs
FOR ALL
TO authenticated
USING (shop_id = (current_setting('app.current_shop_id', true)::UUID));
