-- Create shops table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for demo)
CREATE POLICY "Enable read access for all users" ON public.shops
    FOR SELECT USING (true);

-- Allow anonymous insert access (for demo)
CREATE POLICY "Enable insert access for all users" ON public.shops
    FOR INSERT WITH CHECK (true);