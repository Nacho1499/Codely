CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(56) NOT NULL,
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_wallet_snippet ON favorites (wallet_address, snippet_id);

CREATE INDEX IF NOT EXISTS idx_favorites_wallet_address ON favorites (wallet_address);
