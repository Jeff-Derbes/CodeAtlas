import { NextResponse } from "next/server";

import { answerQuestion } from "@/lib/answering";
import { getDefaultIndexPath, loadIndex } from "@/lib/indexing";
import { embedText } from "@/lib/llm";
import { retrieveRelevantChunks } from "@/lib/retrieval";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: unknown;
    };
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ message: "A question is required." }, { status: 400 });
    }

    const savedIndex = await loadIndex(getDefaultIndexPath());

    if (!savedIndex) {
      return NextResponse.json(
        { message: "No saved index found. Index a repository first." },
        { status: 400 },
      );
    }

    const retrievedChunks = await retrieveRelevantChunks(
      question,
      savedIndex.chunks,
      embedText,
    );
    const result = await answerQuestion(question, retrievedChunks);

    return NextResponse.json({
      repoPath: savedIndex.repoPath,
      retrievedChunkCount: retrievedChunks.length,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Answer generation failed.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
