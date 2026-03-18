import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";

import { afterEach, describe, expect, it } from "vitest";

import type { EmbeddedChunk } from "./embedChunks";
import { loadIndex, saveIndex } from "./indexStore";

const tempDirs: string[] = [];

const sampleChunks: EmbeddedChunk[] = [
  {
    id: "src/example.ts:1-3",
    filePath: "src/example.ts",
    startLine: 1,
    endLine: 3,
    content: "export const value = 1;",
    embedding: [0.1, 0.2, 0.3],
  },
];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(process.cwd(), "tmp-index-store-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("indexStore", () => {
  it("saves an index as pretty JSON", async () => {
    const dir = await makeTempDir();
    const indexPath = join(dir, "indexes", "repo-index.json");

    await saveIndex(indexPath, "/repo/path", sampleChunks);

    const raw = await readFile(indexPath, "utf8");
    const saved = JSON.parse(raw) as {
      repoPath: string;
      createdAt: number;
      chunkCount: number;
      chunks: EmbeddedChunk[];
    };

    expect(raw).toContain('\n  "repoPath": "/repo/path"');
    expect(saved.repoPath).toBe("/repo/path");
    expect(saved.chunkCount).toBe(sampleChunks.length);
    expect(saved.chunks).toEqual(sampleChunks);
    expect(typeof saved.createdAt).toBe("number");
  });

  it("loads a saved index", async () => {
    const dir = await makeTempDir();
    const indexPath = join(dir, "repo-index.json");

    await saveIndex(indexPath, "/repo/path", sampleChunks);
    const loaded = await loadIndex(indexPath);

    expect(loaded).not.toBeNull();
    expect(loaded?.repoPath).toBe("/repo/path");
    expect(loaded?.chunkCount).toBe(sampleChunks.length);
    expect(loaded?.chunks).toEqual(sampleChunks);
    expect(typeof loaded?.createdAt).toBe("number");
  });

  it("returns null when the index file does not exist", async () => {
    const dir = await makeTempDir();
    const indexPath = join(dir, "missing.json");

    await expect(loadIndex(indexPath)).resolves.toBeNull();
  });

  it("returns null when the index file contains invalid JSON", async () => {
    const dir = await makeTempDir();
    const indexPath = join(dir, "invalid.json");

    await writeFile(indexPath, "{not-valid-json}", "utf8");

    await expect(loadIndex(indexPath)).resolves.toBeNull();
  });
});
