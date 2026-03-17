import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFiles } from "./readFile";
import fs from "fs/promises";
import path from "path";

let tempDir: string;
const files: { name: string; content: Buffer | string }[] = [];

beforeAll(async () => {
  const os = await import("os");
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "readfile-test-"));

  // Small text file
  files.push({ name: "small.txt", content: "Hello, world!" });

  // Binary file (contains null byte)
  const binaryContent = Buffer.from([0x00, 0x01, 0x02]);
  files.push({ name: "binary.bin", content: binaryContent });

  // Large file (>1MB)
  const largeContent = Buffer.alloc(1_000_001, "a");
  files.push({ name: "large.txt", content: largeContent });

  await Promise.all(
    files.map(async (f) => {
      const filePath = path.join(tempDir, f.name);
      await fs.writeFile(filePath, f.content as Buffer | string);
    }),
  );
});

afterAll(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("readFiles", () => {
  it("should read small text file correctly", async () => {
    const filePath = path.join(tempDir, "small.txt");
    const results = await readFiles([filePath], tempDir);
    expect(results).toHaveLength(1);
    const res = results[0];
    expect(res.relativePath).toBe("small.txt");
    expect(res.extension).toBe(".txt");
    expect(res.size).toBeGreaterThan(0);
    expect(res.lastModified).toBeGreaterThan(0);
    expect(res.content).toBe("Hello, world!");
    expect(res.error).toBeUndefined();
  });

  it("detects binary file", async () => {
    const filePath = path.join(tempDir, "binary.bin");
    const results = await readFiles([filePath], tempDir);
    const res = results[0];
    expect(res.content).toBeNull();
    expect(res.error).toBe("Binary file");
  });

  it("flags large files as too large", async () => {
    const filePath = path.join(tempDir, "large.txt");
    const results = await readFiles([filePath], tempDir);
    const res = results[0];
    expect(res.content).toBeNull();
    expect(res.error).toBe("File too large");
  });

  it("handles non-existent file gracefully", async () => {
    const fakePath = path.join(tempDir, "does-not-exist.txt");
    const results = await readFiles([fakePath], tempDir);
    const res = results[0];
    expect(res.content).toBeNull();
    expect(res.error).toMatch(/ENOENT|not found/i);
  });
});
