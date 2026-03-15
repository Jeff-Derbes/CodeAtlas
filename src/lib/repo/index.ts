import type { RepoSelection } from "@/lib/types";

export function normalizeRepoPath(input: string): string {
  return input.trim();
}

export function createRepoSelection(rootPath: string): RepoSelection {
  return {
    rootPath: normalizeRepoPath(rootPath),
  };
}
