import type { CodeChunk } from "@/lib/chunking/chunker";

/**
 * Represents a code chunk with an embedding vector.
 */
export interface EmbeddedChunk extends CodeChunk {
  /**
   * Embedding vector produced by the embedder.
   */
  embedding: number[];
}

/**
 * Generates embeddings for an array of {@link CodeChunk}s using a provided
 * `embedText` function. The operation is performed sequentially; each chunk
 * is processed one after another, and failures are isolated to the failed
 * chunk.
 *
 * @param chunks Array of code chunks to embed.
 * @param embedText Function that accepts a string and returns a promise resolving
 *   to an embedding vector (`number[]`).
 * @returns Promise resolving to an array of {@link EmbeddedChunk}s for which the
 *   embedding succeeded. Failed chunks are omitted from the result.
 * @throws Any exception from `embedText` is re-thrown after processing all chunks.
 */
export async function embedChunks(
  chunks: CodeChunk[],
  embedText: (text: string) => Promise<number[]>,
): Promise<EmbeddedChunk[]> {
  const results: EmbeddedChunk[] = [];
  const errors: Array<{ chunk: CodeChunk; error: Error }> = [];

  for (const chunk of chunks) {
    try {
      const embedding = await embedText(chunk.content);
      results.push({
        ...chunk,
        embedding,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push({ chunk, error: err });
    }
  }

  // Re-throw an aggregated error if any chunks failed
  if (errors.length > 0) {
    const message = `Embedding failed for ${errors.length} chunk(s).`;
    const combinedError = new AggregateError(errors, message);
    throw combinedError;
  }

  return results;
}
