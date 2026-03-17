/**
 * Repository scanner utility
 * Recursively scans a repository and returns flat list of files to be indexed
 */

import fs from "fs";
import path from "path";
import { shouldIgnorePath, isAllowedExtension } from "./ignoreRules";

export interface FileMetadata {
  /** Absolute path to the file */
  absolutePath: string;

  /** Relative path from the repository root */
  relativePath: string;

  /** File extension including the dot (e.g., '.ts', '.js') */
  extension: string;

  /** Size of the file in bytes */
  size: number;

  /** Last modified timestamp */
  lastModified: Date;
}

/**
 * Scan a repository directory and return metadata for all files that should be indexed
 * @param rootPath - The root path of the repository to scan
 * @returns A flat array of FileMetadata objects for all eligible files
 */
export function scanRepo(rootPath: string): FileMetadata[] {
  const results: FileMetadata[] = [];

  // Resolve the root path to ensure it's absolute
  const resolvedRoot = path.resolve(rootPath);

  // Ensure we're working with a valid directory
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    throw new Error(`Invalid repository path: ${rootPath}`);
  }

  // Helper function to recursively scan directories
  const scanDirectory = (dirPath: string, relativeDir: string = "") => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = relativeDir ? path.join(relativeDir, item.name) : item.name;

      // Skip symlinks to prevent recursion or escaping
      if (item.isSymbolicLink()) {
        continue;
      }

      // Skip ignored paths - only check repo-relative paths for ignore rules
      if (shouldIgnorePath(relativePath)) {
        continue;
      }

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath, relativePath);
        } else if (stats.isFile()) {
          // Check file extension
          const ext = path.extname(item.name);
          if (isAllowedExtension(ext)) {
            results.push({
              absolutePath: fullPath,
              relativePath,
              extension: ext,
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      } catch (error) {
        // Handle permission errors per entry - continue scanning sibling entries
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === "EACCES") {
          console.warn(`Permission denied accessing entry: ${fullPath}`);
          continue; // Skip this entry and continue with siblings
        } else if (error instanceof Error && (error as NodeJS.ErrnoException).code === "EPERM") {
          console.warn(`Permission denied accessing entry: ${fullPath}`);
          continue; // Skip this entry and continue with siblings
        } else {
          throw error; // Re-throw other errors
        }
      }
    }
  };

  scanDirectory(resolvedRoot);

  return results;
}

/**
 * Scan a repository and return only the file paths
 * @param rootPath - The root path of the repository to scan
 * @returns A flat array of absolute file paths for all eligible files
 */
export function scanRepoPaths(rootPath: string): string[] {
  const metadata = scanRepo(rootPath);
  return metadata.map((item) => item.absolutePath);
}

// Example usage:
/*
const repoFiles = scanRepo('./my-repo');
console.log('Found', repoFiles.length, 'files to index');

repoFiles.forEach(file => {
  console.log(`- ${file.relativePath} (${file.size} bytes)`);
});
*/
