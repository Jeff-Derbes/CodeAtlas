import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { chunkRepository } from "./index";

let tempDir: string;
const lines = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`);
const content = lines.join("\n");

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chunk-repo-"));
  // Write a single file with 250 lines
  const filePath = path.join(tempDir, "test.ts");
  await fs.writeFile(filePath, content);
});

afterAll(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("chunkRepository integration", () => {
  it("should return chunks with correct metadata for a repo", async () => {
    const chunks = await chunkRepository(tempDir);
    // Expect 3 chunks as per CHUNK_SIZE=100, OVERLAP=20
    expect(chunks).toHaveLength(3);
    const [first, second, third] = chunks;
    expect(first.id).toBe("test.ts:1-100");
    expect(second.id).toBe("test.ts:81-180");
    expect(third.id).toBe("test.ts:161-250");
    // Verify content lengths
    expect(first.content.split("\n").length).toBe(100);
    expect(second.content.split("\n").length).toBe(100);
    expect(third.content.split("\n").length).toBe(90);
  });

  it("should handle files ending with a newline correctly", async () => {
    // Create a temporary file that ends with a newline
    const tempDirWithNewline = await fs.mkdtemp(path.join(os.tmpdir(), "chunk-repo-newline-"));

    try {
      const filePath = path.join(tempDirWithNewline, "test-with-newline.ts");

      // Create content ending with newline (250 lines + 1 empty line)
      const lines = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`);
      const contentWithNewline = lines.join("\n") + "\n";

      await fs.writeFile(filePath, contentWithNewline);

      const chunks = await chunkRepository(tempDirWithNewline);

      // Should still create the same number of chunks (3)
      expect(chunks).toHaveLength(3);

      // Verify first chunk
      const [first] = chunks;
      expect(first.id).toBe("test-with-newline.ts:1-100");
      expect(first.content.split("\n").length).toBe(100);
    } finally {
      await fs.rm(tempDirWithNewline, { recursive: true, force: true });
    }
  });
});
