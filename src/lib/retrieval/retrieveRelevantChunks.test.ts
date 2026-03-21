import { describe, expect, it } from "vitest";

import type { EmbeddedChunk } from "@/lib/indexing/embedChunks";

import { cosineSimilarity, retrieveRelevantChunks } from "./retrieveRelevantChunks";

const sampleChunks: EmbeddedChunk[] = [
  {
    id: "chunk-1",
    filePath: "src/a.ts",
    startLine: 1,
    endLine: 5,
    content: "alpha",
    embedding: [1, 0, 0],
  },
  {
    id: "chunk-2",
    filePath: "src/b.ts",
    startLine: 6,
    endLine: 10,
    content: "beta",
    embedding: [0.8, 0.2, 0],
  },
  {
    id: "chunk-3",
    filePath: "src/c.ts",
    startLine: 11,
    endLine: 15,
    content: "gamma",
    embedding: [0, 1, 0],
  },
];

describe("cosineSimilarity", () => {
  it("returns 0 when vector lengths differ", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("returns 0 when either vector has zero magnitude", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("calculates cosine similarity for matching vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
  });
});

describe("retrieveRelevantChunks", () => {
  it("returns the most relevant chunks sorted by score descending", async () => {
    const result = await retrieveRelevantChunks(
      "question",
      sampleChunks,
      async () => [1, 0, 0],
    );

    expect(result).toHaveLength(3);
    expect(result.map((chunk) => chunk.id)).toEqual(["chunk-1", "chunk-2", "chunk-3"]);
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(result[1].score).toBeGreaterThan(result[2].score);
  });

  it("uses a default limit of 5", async () => {
    const result = await retrieveRelevantChunks(
      "question",
      sampleChunks,
      async () => [1, 0, 0],
    );

    expect(result).toHaveLength(3);
  });

  it("respects a custom limit", async () => {
    const result = await retrieveRelevantChunks(
      "question",
      sampleChunks,
      async () => [1, 0, 0],
      2,
    );

    expect(result).toHaveLength(2);
    expect(result.map((chunk) => chunk.id)).toEqual(["chunk-1", "chunk-2"]);
  });

  it("returns an empty array when there are no chunks", async () => {
    const result = await retrieveRelevantChunks("question", [], async () => [1, 0, 0]);

    expect(result).toEqual([]);
  });

  it("throws when question embedding fails", async () => {
    await expect(
      retrieveRelevantChunks(
        "question",
        sampleChunks,
        async () => Promise.reject(new Error("embedding failed")),
      ),
    ).rejects.toThrow("embedding failed");
  });

  it("skips chunks with invalid embeddings", async () => {
    const chunksWithInvalidEmbedding: EmbeddedChunk[] = [
      ...sampleChunks,
      {
        id: "chunk-4",
        filePath: "src/d.ts",
        startLine: 16,
        endLine: 20,
        content: "delta",
        embedding: [NaN, 1, 0],
      },
      {
        id: "chunk-5",
        filePath: "src/e.ts",
        startLine: 21,
        endLine: 25,
        content: "epsilon",
        embedding: [],
      },
    ];

    const result = await retrieveRelevantChunks(
      "question",
      chunksWithInvalidEmbedding,
      async () => [1, 0, 0],
      10,
    );

    expect(result.map((chunk) => chunk.id)).toEqual(["chunk-1", "chunk-2", "chunk-3"]);
  });

  it("returns an empty array when the question embedding contains invalid values", async () => {
    const result = await retrieveRelevantChunks(
      "question",
      sampleChunks,
      async () => [NaN, 0, 0],
    );

    expect(result).toEqual([]);
  });

  it("does not mutate the input chunks", async () => {
    const originalChunks = JSON.parse(JSON.stringify(sampleChunks)) as EmbeddedChunk[];

    await retrieveRelevantChunks("question", sampleChunks, async () => [1, 0, 0]);

    expect(sampleChunks).toEqual(originalChunks);
  });
});
