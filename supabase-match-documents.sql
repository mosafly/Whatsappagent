-- Créer la fonction match_documents pour la recherche vectorielle avec pgvector
-- Cette fonction est requise par le nœud Supabase Vector Store de n8n

-- Assurez-vous que l'extension pgvector est activée
CREATE EXTENSION IF NOT EXISTS vector;

-- Fonction pour rechercher des documents par similarité vectorielle
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.content,
    kb.metadata,
    (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE kb.embedding IS NOT NULL
    AND (filter IS NULL OR filter = '{}'::jsonb OR kb.metadata @> filter)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Créer un index GIN sur metadata pour les filtres
CREATE INDEX IF NOT EXISTS knowledge_base_metadata_idx ON knowledge_base USING GIN (metadata);

-- Créer un index HNSW sur embedding pour la recherche vectorielle
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING hnsw (embedding vector_cosine_ops);

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.match_documents IS 'Fonction de recherche vectorielle pour n8n LangChain Vector Store';
