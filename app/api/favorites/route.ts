import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { FavoritesRepository } from "./favorites.repository";
import { FavoritesService } from "./favorites.service";
import { SnippetRepository } from "../snippets/snippet.repository";

const favoritesRepository = new FavoritesRepository();
const snippetRepository = new SnippetRepository();
const favoritesService = new FavoritesService(favoritesRepository, snippetRepository);

async function handler(req: NextRequest) {
  try {
    const auth = (req as any).auth;
    const walletAddress = auth.walletAddress;

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await favoritesService.getFavorites(walletAddress, { page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error fetching favorites:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);
