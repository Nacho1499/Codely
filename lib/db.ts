import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Ensure crypto is available
import crypto from 'crypto';

export interface PaginatedSnippets {
  snippets: any[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export async function getSnippets(limit: number = 10, offset: number = 0): Promise<PaginatedSnippets> {
  try {
    // Get total count for pagination metadata
    const countResult = await sql`SELECT COUNT(*) as count FROM snippets`;
    const totalCount = Number(countResult[0].count);
    
    // Fetch paginated snippets with consistent ordering
    const result = await sql`
      SELECT * FROM snippets 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const hasMore = offset + result.length < totalCount;
    const nextOffset = hasMore ? offset + limit : null;
    
    return {
      snippets: result as any[],
      totalCount,
      hasMore,
      nextOffset
    };
  } catch (error) {
    console.error('Error fetching snippets:', error);
    throw error;
  }
}

// Keep the original getSnippets for backward compatibility
export async function getAllSnippets() {
  try {
    const result = await sql`SELECT * FROM snippets ORDER BY created_at DESC`;
    return result as any[];
  } catch (error) {
    console.error('Error fetching snippets:', error);
    throw error;
  }
}

export async function getSnippetById(id: string) {
  try {
    const result = await sql`SELECT * FROM snippets WHERE id = ${id}`;
    return result[0] as any;
  } catch (error) {
    console.error('Error fetching snippet:', error);
    throw error;
  }
}

export async function createSnippet(
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[]
) {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    console.log('[v0] Creating snippet:', { id, title, language, tagsLength: tags.length });
    const result = await sql`
      INSERT INTO snippets (id, title, description, code, language, tags, created_at, updated_at) 
      VALUES (${id}, ${title}, ${description}, ${code}, ${language}, ${tags}, ${createdAt}, ${createdAt}) 
      RETURNING *
    `;
    console.log('[v0] Snippet created successfully:', result[0]);
    return result[0] as any;
  } catch (error) {
    console.error('[v0] Error creating snippet:', error);
    throw error;
  }
}

export async function updateSnippet(
  id: string,
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[]
) {
  try {
    const updatedAt = new Date();
    console.log('[v0] Updating snippet:', { id, title, language });
    const result = await sql`
      UPDATE snippets 
      SET title = ${title}, description = ${description}, code = ${code}, language = ${language}, tags = ${tags}, updated_at = ${updatedAt} 
      WHERE id = ${id} 
      RETURNING *
    `;
    console.log('[v0] Snippet updated successfully:', result[0]);
    return result[0] as any;
  } catch (error) {
    console.error('[v0] Error updating snippet:', error);
    throw error;
  }
}

export async function deleteSnippet(id: string) {
  try {
    await sql`DELETE FROM snippets WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting snippet:', error);
    throw error;
  }
}

// ============================================
// Blockchain Verification Functions
// ============================================

export interface SnippetWithHash {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  on_chain_hash: string | null;
  transaction_hash: string | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Store the on-chain hash for a snippet
 * This ensures immutability - once stored, hashes cannot be altered
 */
export async function storeSnippetHash(
  id: string,
  onChainHash: string,
  transactionHash: string
): Promise<SnippetWithHash> {
  try {
    const verifiedAt = new Date();
    console.log('[v0] Storing snippet hash:', { id, onChainHash, transactionHash });
    
    const result = await sql`
      UPDATE snippets 
      SET on_chain_hash = ${onChainHash}, 
          transaction_hash = ${transactionHash}, 
          verified_at = ${verifiedAt}
      WHERE id = ${id} 
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Snippet not found');
    }
    
    console.log('[v0] Snippet hash stored successfully:', result[0]);
    return result[0] as SnippetWithHash;
  } catch (error) {
    console.error('[v0] Error storing snippet hash:', error);
    throw error;
  }
}

/**
 * Get snippet with its on-chain hash for verification
 */
export async function getSnippetWithHash(id: string): Promise<SnippetWithHash | null> {
  try {
    const result = await sql`
      SELECT * FROM snippets WHERE id = ${id}
    `;
    return result[0] as SnippetWithHash | null;
  } catch (error) {
    console.error('Error fetching snippet with hash:', error);
    throw error;
  }
}

/**
 * Verify snippet integrity by comparing current content with stored hash
 */
export async function verifySnippetIntegrity(
  id: string,
  currentTitle: string,
  currentDescription: string,
  currentCode: string,
  currentLanguage: string,
  currentTags: string[]
): Promise<{
  isValid: boolean;
  snippet?: SnippetWithHash;
  message: string;
}> {
  try {
    const snippet = await getSnippetWithHash(id);
    
    if (!snippet) {
      return {
        isValid: false,
        message: 'Snippet not found'
      };
    }
    
    if (!snippet.on_chain_hash) {
      return {
        isValid: false,
        snippet,
        message: 'No on-chain hash found for this snippet'
      };
    }
    
    // Import the hash utility
    const { verifySnippetHash } = await import('./hash');
    
    const isValid = verifySnippetHash(
      currentTitle,
      currentDescription,
      currentCode,
      currentLanguage,
      currentTags,
      snippet.on_chain_hash
    );
    
    return {
      isValid,
      snippet,
      message: isValid 
        ? 'Snippet integrity verified - content matches on-chain hash'
        : 'Integrity check failed - content has been modified since last verification'
    };
  } catch (error) {
    console.error('[v0] Error verifying snippet integrity:', error);
    throw error;
  }
}

/**
 * Get all snippets that have been verified on-chain
 */
export async function getVerifiedSnippets(): Promise<SnippetWithHash[]> {
  try {
    const result = await sql`
      SELECT * FROM snippets 
      WHERE on_chain_hash IS NOT NULL 
      ORDER BY verified_at DESC
    `;
    return result as SnippetWithHash[];
  } catch (error) {
    console.error('Error fetching verified snippets:', error);
    throw error;
  }
}
