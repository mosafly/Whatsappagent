-- Migration: Bobotcho Referral & AI Enhancements
-- Story 3.1 & 3.2: Système de Parrainage

-- 5. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    referrer_id UUID REFERENCES public.conversations(id) NOT NULL, -- The conversation/customer who refers
    referee_phone TEXT UNIQUE NOT NULL, -- The phone number of the friend referred
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, converted, reward_claimed
    reward_amount_referrer INTEGER DEFAULT 20000,
    reward_amount_referee INTEGER DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_phone ON public.referrals(referee_phone);

-- RLS Policy for referrals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Shops can only see their own referrals'
  ) THEN
    CREATE POLICY "Shops can only see their own referrals"
    ON public.referrals
    FOR ALL
    TO authenticated
    USING (shop_id = (current_setting('app.current_shop_id', true)::UUID));
  END IF;
END $$;

-- Add columns to conversations for referral integration
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.referrals(id);

-- Update messages table for status tracking
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued', -- queued, sent, delivered, read, failed
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Trigger for updated_at on referrals
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is idempotent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_referrals_updated_at'
      AND tgrelid = 'public.referrals'::regclass
  ) THEN
    DROP TRIGGER set_referrals_updated_at ON public.referrals;
  END IF;
END $$;

CREATE TRIGGER set_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
