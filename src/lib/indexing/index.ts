import type { IndexingResult } from "@/lib/types";

export async function indexRepository(
  _repoPath: string,
): Promise<IndexingResult> {
  void _repoPath;

  return {
    status: "stubbed",
    indexedChunkCount: 0,
    message: "Repository indexing is not implemented yet.",
  };
}
