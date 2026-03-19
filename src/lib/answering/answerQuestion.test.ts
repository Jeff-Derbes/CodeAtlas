import { describe, expect, it, vi } from "vitest";

import type { RetrievedChunk } from "@/lib/retrieval";

import { answerQuestion } from "./answerQuestion";

const retrievedChunks: RetrievedChunk[] = [
  {
    id: "src/lib/example.ts:1-8",
    filePath: "src/lib/example.ts",
    startLine: 1,
    endLine: 8,
    content: "export function greet() {\n  return 'hello';\n}",
    embedding: [1, 0, 0],
    score: 0.91,
  },
  {
    id: "src/lib/other.ts:12-18",
    filePath: "src/lib/other.ts",
    startLine: 12,
    endLine: 18,
    content: "export const value = 42;",
    embedding: [0.8, 0.2, 0],
    score: 0.73,
  },
];

describe("answerQuestion", () => {
  it("returns a no_context result when there are no retrieved chunks", async () => {
    const result = await answerQuestion("What does this do?", []);

    expect(result.status).toBe("no_context");
    expect(result.citations).toEqual([]);
  });

  it("parses the model JSON response and maps citations to source metadata", async () => {
    const generateText = vi.fn().mockResolvedValue(
      JSON.stringify({
        answer: "The greeting helper returns a hard-coded string. [Source 1]",
        citations: [1],
      }),
    );

    const result = await answerQuestion("How does greet work?", retrievedChunks, {
      generateText,
    });

    expect(result.status).toBe("answered");
    expect(result.answer).toContain("[Source 1]");
    expect(result.citations).toEqual([
      {
        sourceId: 1,
        relativePath: "src/lib/example.ts",
        startLine: 1,
        endLine: 8,
        snippet: "export function greet() {\n  return 'hello';\n}",
        score: 0.91,
      },
    ]);
  });

  it("falls back to inline citations when the model does not return JSON", async () => {
    const result = await answerQuestion("How does greet work?", retrievedChunks, {
      generateText: vi
        .fn()
        .mockResolvedValue("It returns a fixed string from greet(). [Source 1]"),
    });

    expect(result.status).toBe("answered");
    expect(result.citations.map((citation) => citation.sourceId)).toEqual([1]);
  });

  it("returns an error result when generation fails", async () => {
    const result = await answerQuestion("How does greet work?", retrievedChunks, {
      generateText: vi.fn().mockRejectedValue(new Error("LM Studio offline")),
    });

    expect(result.status).toBe("error");
    expect(result.answer).toContain("LM Studio offline");
  });
});
