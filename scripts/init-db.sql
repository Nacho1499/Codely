-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS snippets CASCADE;

-- Create snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  -- Blockchain verification fields
  on_chain_hash VARCHAR(64),        -- SHA-256 hash of snippet content
  transaction_hash VARCHAR(64),     -- Stellar transaction hash
  verified_at TIMESTAMP,             -- When the hash was verified on-chain
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at DESC);
