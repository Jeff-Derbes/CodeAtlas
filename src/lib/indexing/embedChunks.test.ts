import { describe, it, expect } from "vitest";
import type { CodeChunk } from "../chunking/chunker";
import { embedChunks } from "./embedChunks";

// Helper to create a simple embedding function that always succeeds.
const mockEmbedTextSuccess = (text: string): Promise<number[]> => {
  return Promise.resolve([text.length]); // simple vector: length of text
};

// Helper to create an embedding function that fails for specific content marker.
const mockEmbedTextWithFailure = (text: string): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    if (text.includes("FAIL_EMBED")) {
      return reject(new Error("Embedding failed"));
    }
    resolve([text.length]);
  });
};

describe("embedChunks", () => {
  // Chunks without any failure markers - all should succeed
  const chunksAllSuccess: CodeChunk[] = [
    {
      id: "chunk1",
      filePath: "/path/file1.ts",
      startLine: 1,
      endLine: 10,
      content: "const a = 1;\nconst b = 2;",
    },
    {
      id: "chunk2",
      filePath: "/path/file2.ts",
      startLine: 5,
      endLine: 15,
      content: "some other content",
    },
    {
      id: "chunk3",
      filePath: "/path/file3.ts",
      startLine: 20,
      endLine: 30,
      content: "function foo() {}",
    },
  ];

  // Chunks with one failure marker
  const chunksWithFailure: CodeChunk[] = [
    {
      id: "chunk1",
      filePath: "/path/file1.ts",
      startLine: 1,
      endLine: 10,
      content: "const a = 1;\nconst b = 2;",
    },
    {
      id: "chunk2",
      filePath: "/path/file2.ts",
      startLine: 5,
      endLine: 15,
      content: "FAIL_EMBED", // will trigger rejection
    },
    {
      id: "chunk3",
      filePath: "/path/file3.ts",
      startLine: 20,
      endLine: 30,
      content: "function foo() {}",
    },
  ];

  it("returns embeddings for successful chunks only", async () => {
    const result = await embedChunks(chunksAllSuccess, mockEmbedTextSuccess);
    expect(result).toHaveLength(3);
    // Verify that the returned objects contain an embedding field and original fields.
    const ids = result.map((c) => c.id);
    expect(ids).toContain("chunk1");
    expect(ids).toContain("chunk2");
    expect(ids).toContain("chunk3");
    expect(result[0]).toHaveProperty("embedding");
  });

  it("does not mutate the original chunks array", async () => {
    const original = JSON.parse(JSON.stringify(chunksAllSuccess)); // deep copy
    await embedChunks(chunksAllSuccess, mockEmbedTextSuccess);
    expect(chunksAllSuccess).toEqual(original); // unchanged
  });

  it("throws an error when embedding fails for any chunk", async () => {
    await expect(async () => {
      await embedChunks(chunksWithFailure, mockEmbedTextWithFailure);
    }).rejects.toThrow("Embedding failed for 1 chunk(s).");
  });

  it("includes failed chunk information in the AggregateError", async () => {
    try {
      await embedChunks(chunksWithFailure, mockEmbedTextWithFailure);
    } catch (error) {
      const aggError = error as AggregateError;
      expect(aggError.errors).toHaveLength(1);
      // Access the first error and check its properties
      const firstError = aggError.errors[0] as { chunk: CodeChunk; error: Error };
      expect(firstError.chunk.id).toBe("chunk2");
      expect(firstError.error.message).toBe("Embedding failed");
    }
  });
});
