import { NextRequest, NextResponse } from 'next/server';
import { getSnippets, getAllSnippets, createSnippet } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Validate pagination parameters
    const validLimit = Math.min(Math.max(limit, 1), 100); // Clamp between 1 and 100
    const validOffset = Math.max(offset, 0);
    
    const result = await getSnippets(validLimit, validOffset);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Error fetching snippets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, code, language, tags } = body;

    if (!title || !description || !code || !language || !tags || tags.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, code, language, tags' },
        { status: 400 }
      );
    }

    const snippet = await createSnippet(
      title,
      description,
      code,
      language,
      tags
    );

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating snippet:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}
