export interface LmStudioConfig {
  baseUrl: string;
  model: string;
  embeddingModel: string;
  apiKey?: string;
}

export interface RepoSelection {
  rootPath: string;
}

export interface IndexedChunk {
  id: string;
  path: string;
  content: string;
  score?: number;
}

export interface AnswerSourceChunk {
  id?: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  content: string;
  score?: number;
}

export interface Citation {
  sourceId: number;
  relativePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  score?: number;
}

export interface IndexingResult {
  status: "indexed" | "error";
  repoPath: string;
  indexPath: string;
  indexedChunkCount: number;
  indexedFileCount: number;
  message: string;
}

export interface AnswerResult {
  status: "answered" | "no_context" | "error";
  answer: string;
  citations: Citation[];
}
