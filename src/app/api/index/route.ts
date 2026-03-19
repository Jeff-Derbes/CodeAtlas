import { NextResponse } from "next/server";

import { indexRepository } from "@/lib/indexing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      repoPath?: unknown;
    };
    const repoPath = typeof body.repoPath === "string" ? body.repoPath.trim() : "";

    if (!repoPath) {
      return NextResponse.json(
        { message: "A repository path is required." },
        { status: 400 },
      );
    }

    const result = await indexRepository(repoPath);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing failed.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
