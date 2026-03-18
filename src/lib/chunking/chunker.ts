import type { FileData } from "@/lib/types/fileData";

export const CHUNK_SIZE = 100;
export const OVERLAP = 20;

// Local CodeChunk definition to avoid duplication with types/index.ts
export interface CodeChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

// Re-export FileData for convenient imports from this module
export type { FileData };

export function chunkFiles(files: FileData[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  for (const file of files) {
    if (!file.content || file.error) continue;

    // Handle trailing newlines properly
    let lines = file.content.split("\n");

    // If content ends with a newline, the split creates an empty string at the end
    // We should remove this empty line to avoid off-by-one errors in chunking
    if (file.content.endsWith("\n") && lines.length > 0) {
      lines = lines.slice(0, -1);
    }

    const totalLines = lines.length;

    for (let i = 0; i < totalLines; i += CHUNK_SIZE - OVERLAP) {
      const startLine = i + 1;
      const endLine = Math.min(i + CHUNK_SIZE, totalLines);
      const remainingLines = totalLines - i;

      // Skip chunks that only contain overlap (no new content)
      // This prevents redundant tail chunks when remaining lines <= OVERLAP
      if (remainingLines <= OVERLAP && i > 0) {
        continue;
      }

      const content = lines.slice(i, endLine).join("\n");

      chunks.push({
        id: `${file.relativePath}:${startLine}-${endLine}`,
        filePath: file.relativePath,
        startLine,
        endLine,
        content,
      });
    }
  }

  return chunks;
}
