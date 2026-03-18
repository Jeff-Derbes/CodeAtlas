import { describe, it, expect } from "vitest";
import { chunkFiles, CodeChunk } from "./chunker";
import type { FileData } from "../types/fileData";

// Helper to create a FileData object
function makeFile(relativePath: string, content: string | null, error?: string): FileData {
  return {
    relativePath,
    extension: ".ts",
    size: content ? Buffer.byteLength(content) : 0,
    lastModified: Date.now(),
    content,
    error,
  } as unknown as FileData; // cast because FileData may have more fields
}

describe("chunkFiles", () => {
  it("splits a file into chunks with overlap and skips redundant tail chunk", () => {
    const lines = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`);
    const content = lines.join("\n");
    const file = makeFile("test.ts", content);

    const chunks = chunkFiles([file]);
    // Expect 3 chunks based on CHUNK_SIZE=100, OVERLAP=20
    expect(chunks).toHaveLength(3);

    // Validate first chunk
    const [first, second, third] = chunks;
    expect(first.startLine).toBe(1);
    expect(first.endLine).toBe(100);
    expect(first.content.split("\n").length).toBe(100);

    // Second chunk should start at 81 (overlap of 20 lines)
    expect(second.startLine).toBe(81);
    expect(second.endLine).toBe(180);
    expect(second.content.split("\n").length).toBe(100);

    // Third chunk starts at 161 and ends at 250 (90 lines)
    expect(third.startLine).toBe(161);
    expect(third.endLine).toBe(250);
    expect(third.content.split("\n").length).toBe(90);

    // Overlap check: last 20 lines of first chunk should equal first 20 lines of second chunk
    const overlapFirst = first.content.split("\n").slice(-20).join("\n");
    const overlapSecondStart = second.content.split("\n").slice(0, 20).join("\n");
    expect(overlapFirst).toBe(overlapSecondStart);

    // Chunk IDs should be formatted correctly
    expect(first.id).toBe("test.ts:1-100");
    expect(second.id).toBe("test.ts:81-180");
    expect(third.id).toBe("test.ts:161-250");
  });

  it("handles files ending with a newline correctly", () => {
    // Create content that ends with a newline
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
    const contentWithNewline = lines.join("\n") + "\n";

    const file = makeFile("test-with-newline.ts", contentWithNewline);
    const chunks = chunkFiles([file]);

    // Should only create one chunk because remaining lines equal OVERLAP
    expect(chunks).toHaveLength(1);

    // First (and only) chunk should be from line 1 to 100
    const [first] = chunks;
    expect(first.startLine).toBe(1);
    expect(first.endLine).toBe(100);

    // Verify content length is correct
    expect(first.content.split("\n").length).toBe(100);
  });

  it("does not create chunks for files with no content or errors", () => {
    const fileNoContent = makeFile("empty.ts", null);
    const fileWithError = makeFile("error.ts", "some content", "Read error");
    const chunks = chunkFiles([fileNoContent, fileWithError]);
    expect(chunks).toHaveLength(0);
  });

  it("returns an empty array when no files are provided", () => {
    const chunks = chunkFiles([]);
    expect(chunks).toEqual([]);
  });
});
