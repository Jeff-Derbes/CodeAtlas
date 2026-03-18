import type { IndexingResult } from "@/lib/types";
import { scanRepo } from "@/lib/repo";
import { readFiles } from "@/lib/repo/readFile";
import { chunkFiles } from "@/lib/chunking/chunker";
import type { FileData } from "@/lib/types/fileData";

export async function indexRepository(repoPath: string): Promise<IndexingResult> {
  const metadata = scanRepo(repoPath);

  const filePaths = metadata.map((m) => m.absolutePath);

  const fileDatas = await readFiles(filePaths, repoPath);

  const chunks = chunkFiles(fileDatas);

  return {
    status: "stubbed",
    indexedChunkCount: chunks.length,
    message: `Repository indexing is not implemented yet.`,
  };
}
