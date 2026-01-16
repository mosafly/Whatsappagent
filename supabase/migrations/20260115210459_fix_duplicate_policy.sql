-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can read knowledge base" ON public.knowledge_base;

-- Recreate policy with IF NOT EXISTS check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'knowledge_base' 
        AND policyname = 'Public can read knowledge base'
    ) THEN
        CREATE POLICY "Public can read knowledge base"
        ON public.knowledge_base
        FOR SELECT TO public USING (true);
    END IF;
END $$;