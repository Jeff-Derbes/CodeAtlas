import type { IndexedChunk } from "@/lib/types";
import { scanRepo } from "../repo/scanRepo";
import { readFiles } from "../repo/readFile";
import * as path from "path";
import { chunkFiles, type CodeChunk } from "./chunker";

export async function chunkRepository(repoPath: string): Promise<IndexedChunk[]> {
  const resolvedRoot = path.resolve(repoPath);

  const metadata = scanRepo(resolvedRoot);
  const filePaths = metadata.map((m) => m.absolutePath);

  const fileDatas = await readFiles(filePaths, resolvedRoot);

  const codeChunks = chunkFiles(fileDatas);

  return codeChunks.map((c) => ({
    id: c.id,
    path: c.filePath,
    content: c.content,
  }));
}

export { chunkFiles, type CodeChunk };
