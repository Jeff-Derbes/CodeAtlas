import fs from "fs/promises";
import path from "path";
import { FileData } from "../types/fileData";
import { ALLOWED_EXTENSIONS } from "./ignoreRules";

export async function readFiles(filePaths: string[], repoRoot: string): Promise<FileData[]> {
  const results: FileData[] = [];
  for (const filePath of filePaths) {
    try {
      const stats = await fs.stat(filePath);
      const size = stats.size;
      const lastModified = stats.mtimeMs;
      const relativePath = path.relative(repoRoot, filePath);
      const extension = path.extname(filePath).toLowerCase();

      if (size > 1_000_000) {
        results.push({
          relativePath,
          extension,
          size,
          lastModified,
          content: null,
          error: "File too large",
        });
        continue;
      }

      const buffer = await fs.readFile(filePath);
      // Use scanner's allowed extensions to avoid misclassifying UTF‑16 files.
      const textExtensions = new Set([...ALLOWED_EXTENSIONS, ".txt", ".css", ".html"]);
      if (buffer.includes(0) && !textExtensions.has(extension)) {
        results.push({
          relativePath,
          extension,
          size,
          lastModified,
          content: null,
          error: "Binary file",
        });
        continue;
      }

      const content = buffer.toString("utf8");
      results.push({ relativePath, extension, size, lastModified, content });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        relativePath: path.relative(repoRoot, filePath),
        extension: path.extname(filePath).toLowerCase(),
        size: 0,
        lastModified: 0,
        content: null,
        error: message || "Read error",
      });
    }
  }
  return results;
}

/**
 * Usage example:
 *
 * import { readFiles } from './readFile';
 *
 * const filePaths = ['/path/to/repo/src/app/page.tsx', '/path/to/repo/README.md'];
 * const repoRoot = '/path/to/repo';
 *
 * readFiles(filePaths, repoRoot).then(results => {
 *   console.log(JSON.stringify(results, null, 2));
 * });
 */
