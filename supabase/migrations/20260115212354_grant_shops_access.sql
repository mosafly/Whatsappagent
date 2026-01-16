-- Ensure shops table is accessible for anon/authenticated clients
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shops TO anon, authenticated;

-- Enable RLS (idempotent)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Allow public read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shops'
          AND policyname = 'Public can read shops'
    ) THEN
        CREATE POLICY "Public can read shops"
        ON public.shops
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- Allow public insert (optional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shops'
          AND policyname = 'Public can insert shops'
    ) THEN
        CREATE POLICY "Public can insert shops"
        ON public.shops
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;
END $$;
