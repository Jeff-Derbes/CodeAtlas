import type { EmbeddedChunk } from "@/lib/indexing/embedChunks";

export interface RetrievedChunk extends EmbeddedChunk {
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function isValidEmbedding(embedding: number[]): boolean {
  return (
    Array.isArray(embedding) &&
    embedding.length > 0 &&
    embedding.every((value) => Number.isFinite(value))
  );
}

export async function retrieveRelevantChunks(
  question: string,
  chunks: EmbeddedChunk[],
  embedText: (text: string) => Promise<number[]>,
  limit = 5,
): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  let questionEmbedding: number[];

  try {
    questionEmbedding = await embedText(question);
  } catch {
    return [];
  }

  if (!isValidEmbedding(questionEmbedding)) {
    return [];
  }

  const scoredChunks: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    if (!isValidEmbedding(chunk.embedding)) {
      continue;
    }

    scoredChunks.push({
      ...chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    });
  }

  return scoredChunks.sort((a, b) => b.score - a.score).slice(0, limit);
}
