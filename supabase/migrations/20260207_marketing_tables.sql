-- Migration: Marketing Tables for WhatsApp Campaigns & Automations
-- Supports: Campaigns, Segments, Automations, WhatsApp Templates

-- 1. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'promotion', -- promotion, announcement, reactivation, referral
    status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, completed, failed
    audience TEXT DEFAULT 'all', -- all, active_30d, inactive_30d, new_7d, segment:<id>
    template_name TEXT,
    variables JSONB DEFAULT '{}',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    segment_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_shop_id ON public.campaigns(shop_id);

-- RLS: Service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaigns' AND policyname = 'Service role full access campaigns'
  ) THEN
    CREATE POLICY "Service role full access campaigns"
    ON public.campaigns FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS: Public read for app
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaigns' AND policyname = 'Public read campaigns'
  ) THEN
    CREATE POLICY "Public read campaigns"
    ON public.campaigns FOR SELECT TO public
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaigns' AND policyname = 'Public insert campaigns'
  ) THEN
    CREATE POLICY "Public insert campaigns"
    ON public.campaigns FOR INSERT TO public
    WITH CHECK (true);
  END IF;
END $$;

-- 2. Campaign Messages (individual sends)
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT DEFAULT 'queued', -- queued, sent, delivered, read, failed
    twilio_sid TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON public.campaign_messages(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_messages' AND policyname = 'Service role full access campaign_messages'
  ) THEN
    CREATE POLICY "Service role full access campaign_messages"
    ON public.campaign_messages FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_messages' AND policyname = 'Public read campaign_messages'
  ) THEN
    CREATE POLICY "Public read campaign_messages"
    ON public.campaign_messages FOR SELECT TO public
    USING (true);
  END IF;
END $$;

-- 3. Automations
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- new_customer, order_created, cart_abandoned, inactive_30d, post_purchase
    template_name TEXT,
    delay_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    variables JSONB DEFAULT '{}',
    executions_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON public.automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automations' AND policyname = 'Service role full access automations'
  ) THEN
    CREATE POLICY "Service role full access automations"
    ON public.automations FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automations' AND policyname = 'Public read automations'
  ) THEN
    CREATE POLICY "Public read automations"
    ON public.automations FOR SELECT TO public
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automations' AND policyname = 'Public insert automations'
  ) THEN
    CREATE POLICY "Public insert automations"
    ON public.automations FOR INSERT TO public
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automations' AND policyname = 'Public update automations'
  ) THEN
    CREATE POLICY "Public update automations"
    ON public.automations FOR UPDATE TO public
    USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Automation Logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT DEFAULT 'triggered', -- triggered, sent, delivered, failed
    twilio_sid TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON public.automation_logs(automation_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automation_logs' AND policyname = 'Service role full access automation_logs'
  ) THEN
    CREATE POLICY "Service role full access automation_logs"
    ON public.automation_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'automation_logs' AND policyname = 'Public read automation_logs'
  ) THEN
    CREATE POLICY "Public read automation_logs"
    ON public.automation_logs FOR SELECT TO public
    USING (true);
  END IF;
END $$;

-- 5. WhatsApp Templates (local cache of Meta-approved templates)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'MARKETING', -- MARKETING, UTILITY, AUTHENTICATION
    status TEXT NOT NULL DEFAULT 'approved', -- approved, pending, rejected
    language TEXT DEFAULT 'fr',
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable descriptions
    twilio_content_sid TEXT, -- Twilio Content API SID
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_templates' AND policyname = 'Public read whatsapp_templates'
  ) THEN
    CREATE POLICY "Public read whatsapp_templates"
    ON public.whatsapp_templates FOR SELECT TO public
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_templates' AND policyname = 'Service role full access whatsapp_templates'
  ) THEN
    CREATE POLICY "Service role full access whatsapp_templates"
    ON public.whatsapp_templates FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. Seed initial templates (Bobotcho Meta-approved)
INSERT INTO public.whatsapp_templates (name, display_name, category, status, language, body, variables)
VALUES
  ('welcome_bobotcho', 'Bienvenue Bobotcho', 'MARKETING', 'approved', 'fr',
   'Bonjour {{1}}, bienvenue chez Bobotcho ! Découvrez notre système de lavage à l''eau révolutionnaire. Offre exclusive WhatsApp : {{2}} FCFA au lieu de 120 000 FCFA. Commandez maintenant !',
   '["Nom du client", "Prix promo"]'),
  ('promo_whatsapp', 'Promo WhatsApp Exclusive', 'MARKETING', 'approved', 'fr',
   '{{1}}, profitez de notre offre spéciale Bobotcho ! Le système de lavage à l''eau à seulement {{2}} FCFA avec installation incluse. Livraison sous 24-48h à Abidjan. Répondez OUI pour commander.',
   '["Nom du client", "Prix"]'),
  ('order_confirmation', 'Confirmation Commande', 'UTILITY', 'approved', 'fr',
   'Bonjour {{1}}, votre commande Bobotcho #{{2}} est confirmée ! Livraison prévue sous {{3}}. Notre équipe vous contactera pour l''installation. Merci de votre confiance !',
   '["Nom", "Numéro commande", "Délai livraison"]'),
  ('reactivation_client', 'Réactivation Client', 'MARKETING', 'approved', 'fr',
   '{{1}}, cela fait un moment ! Chez Bobotcho, nous avons une offre spéciale pour vous : {{2}} FCFA au lieu de 120 000 FCFA. Offre limitée. Répondez pour en profiter.',
   '["Nom", "Prix promo"]'),
  ('referral_invite', 'Parrainage', 'MARKETING', 'approved', 'fr',
   '{{1}}, parrainez un ami et recevez {{2}} FCFA de réduction ! Votre code : {{3}}. Partagez-le et gagnez ensemble.',
   '["Nom", "Montant réduction", "Code parrainage"]'),
  ('cart_reminder', 'Relance Panier', 'MARKETING', 'approved', 'fr',
   '{{1}}, vous avez oublié quelque chose ! Votre Bobotcho vous attend. Finalisez votre commande maintenant et bénéficiez de l''offre à {{2}} FCFA. Répondez OUI pour continuer.',
   '["Nom", "Prix"]')
ON CONFLICT (name) DO NOTHING;

-- 7. Add opt-in fields to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS opt_in_marketing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS opt_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opt_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 8. Trigger for updated_at on new tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['campaigns', 'automations', 'whatsapp_templates']
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'set_' || tbl || '_updated_at'
        AND tgrelid = ('public.' || tbl)::regclass
    ) THEN
      EXECUTE format('DROP TRIGGER set_%s_updated_at ON public.%I', tbl, tbl);
    END IF;
    
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
