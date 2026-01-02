CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS embedding vector(768);
-- We use HNSW index for better recall/performance than IVFFlat, if available in recent pgvector
-- If not, standard IVFFlat is fine. We'll try HNSW first.
CREATE INDEX IF NOT EXISTS invoices_embedding_hnsw_idx ON invoices USING hnsw (embedding vector_cosine_ops);
