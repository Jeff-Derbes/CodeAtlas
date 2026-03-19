import path from "path";

import type { IndexingResult } from "@/lib/types";
import { scanRepo } from "@/lib/repo";
import { readFiles } from "@/lib/repo/readFile";
import { chunkFiles } from "@/lib/chunking/chunker";
import { embedText as defaultEmbedText } from "@/lib/llm";
import { embedChunks } from "./embedChunks";
import type { EmbedTextFn } from "@/lib/llm/embedder";
import { saveIndex } from "./indexStore";

export { loadIndex, saveIndex } from "./indexStore";
export type { SavedIndex } from "./indexStore";

const DEFAULT_INDEX_FILE = "current-index.json";

export function getDefaultIndexPath(): string {
  return path.join(process.cwd(), "data", "indexes", DEFAULT_INDEX_FILE);
}

export interface IndexRepositoryOptions {
  embedText?: EmbedTextFn;
  indexPath?: string;
}

export async function indexRepository(
  repoPath: string,
  options: IndexRepositoryOptions = {},
): Promise<IndexingResult> {
  const metadata = scanRepo(repoPath);
  const filePaths = metadata.map((m) => m.absolutePath);
  const fileDatas = await readFiles(filePaths, repoPath);
  const chunks = chunkFiles(fileDatas);
  const embedText = options.embedText ?? defaultEmbedText;
  const embeddedChunks = await embedChunks(chunks, embedText);
  const indexPath = options.indexPath ?? getDefaultIndexPath();

  await saveIndex(indexPath, repoPath, embeddedChunks);

  return {
    status: "indexed",
    repoPath,
    indexPath,
    indexedChunkCount: embeddedChunks.length,
    indexedFileCount: fileDatas.filter((file) => file.content && !file.error).length,
    message: `Indexed ${embeddedChunks.length} chunk(s) from ${repoPath}.`,
  };
}
