-- Add snippet_versions table for version history
CREATE TABLE IF NOT EXISTS snippet_versions (
  id UUID PRIMARY KEY,
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  editor_id VARCHAR(255),
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for version queries
CREATE INDEX IF NOT EXISTS idx_snippet_versions_snippet_id ON snippet_versions(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_created_at ON snippet_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_version_number ON snippet_versions(snippet_id, version_number DESC);

-- Add revision column to snippets for optimistic locking
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1;