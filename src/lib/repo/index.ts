import type { RepoSelection } from "@/lib/types";
import { scanRepo } from "./scanRepo";

export function normalizeRepoPath(input: string): string {
  return input.trim();
}

export function createRepoSelection(rootPath: string): RepoSelection {
  return {
    rootPath: normalizeRepoPath(rootPath),
  };
}

// Export the scanning functionality
export { scanRepo, scanRepoPaths } from "./scanRepo";
export type { FileMetadata } from "./scanRepo";
export * from "./readFile";
