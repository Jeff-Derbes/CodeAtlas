import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

import type { EmbeddedChunk } from "./embedChunks";

export interface SavedIndex {
  repoPath: string;
  createdAt: number;
  chunkCount: number;
  chunks: EmbeddedChunk[];
}

export async function saveIndex(
  indexPath: string,
  repoPath: string,
  chunks: EmbeddedChunk[],
): Promise<void> {
  const data: SavedIndex = {
    repoPath,
    createdAt: Date.now(),
    chunkCount: chunks.length,
    chunks,
  };

  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, JSON.stringify(data, null, 2), "utf8");
}

export async function loadIndex(indexPath: string): Promise<SavedIndex | null> {
  try {
    const raw = await readFile(indexPath, "utf8");
    return JSON.parse(raw) as SavedIndex;
  } catch {
    return null;
  }
}
