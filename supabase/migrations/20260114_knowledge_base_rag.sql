-- Migration: Knowledge Base RAG pour Bobotcho
-- Support client avec retrieval-augmented generation

-- Activer l'extension pgvector pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Table Knowledge Base
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'produit', 'installation', 'tarification', 'livraison', 'support'
    priority INTEGER DEFAULT 5, -- 1-10, 10 = priorité haute
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Index pour recherche vectorielle (HNSW - compatible Supabase)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON public.knowledge_base 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Policy pour lecture (public pour webhook)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'knowledge_base'
          AND policyname = 'Public can read knowledge base'
    ) THEN
        CREATE POLICY "Public can read knowledge base"
        ON public.knowledge_base
        FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;

-- 2. Fonction de recherche sémantique
CREATE OR REPLACE FUNCTION public.semantic_search(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    priority INTEGER,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        kb.priority,
        1 - (kb.embedding <=> query_embedding) as similarity
    FROM public.knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.priority DESC, similarity DESC
    LIMIT match_count;
END;
$$;

-- 3. Table pour logs de recherche RAG
CREATE TABLE IF NOT EXISTS public.rag_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER,
    top_result_id UUID,
    top_similarity float,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rag_search_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour insertion via service role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'rag_search_logs'
          AND policyname = 'Service role can insert rag logs'
    ) THEN
        CREATE POLICY "Service role can insert rag logs"
        ON public.rag_search_logs
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;
