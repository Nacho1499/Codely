import { NextRequest, NextResponse } from "next/server";
import { SnippetService } from "./snippet.service";
import { SnippetRepository } from "./snippet.repository";
import { OwnershipMiddleware } from "./ownership.middleware";
import { ZodError } from "zod";
import { createTransaction } from "@/lib/db";

// Dependency Injection instantiation
const repository = new SnippetRepository();
const service = new SnippetService(repository);

export async function GET() {
  try {
    const snippets = await service.getAllSnippets();
    return NextResponse.json(snippets);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract and inject the wallet address securely from headers
    const walletAddress = OwnershipMiddleware.extractWalletAddress(req);
    if (walletAddress) {
      body.ownerWalletAddress = walletAddress;
    }

    const snippet = await service.createSnippet(body);

    // Log transaction if wallet address provided
    if (walletAddress) {
      try {
        await createTransaction(
          walletAddress,
          "snippet_create",
          `Created snippet ${snippet.id}`,
          { snippetId: snippet.id },
        );
      } catch (err) {
        console.error("[transactions] Failed to log snippet_create:", err);
      }
    }

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
