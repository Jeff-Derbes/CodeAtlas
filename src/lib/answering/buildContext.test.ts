import { describe, expect, it } from "vitest";

import type { AnswerSourceChunk } from "@/lib/types";

import { buildContext } from "./buildContext";

describe("buildContext", () => {
  it("formats retrieved chunks into numbered source blocks", () => {
    const chunks: AnswerSourceChunk[] = [
      {
        relativePath: "src/lib/example.ts",
        startLine: 10,
        endLine: 18,
        content: "export const answer = 42;",
        score: 0.98765,
      },
    ];

    const result = buildContext(chunks);

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].sourceId).toBe(1);
    expect(result.contextText).toContain("[Source 1]");
    expect(result.contextText).toContain("File: src/lib/example.ts");
    expect(result.contextText).toContain("Lines: 10-18");
    expect(result.contextText).toContain("Score: 0.9877");
    expect(result.contextText).toContain("```ts");
  });

  it("uses a longer fence when the chunk content already contains backticks", () => {
    const chunks: AnswerSourceChunk[] = [
      {
        relativePath: "README.md",
        startLine: 1,
        endLine: 4,
        content: "Use ```bash to run the script.",
      },
    ];

    const result = buildContext(chunks);

    expect(result.contextText).toContain("````md");
  });
});
