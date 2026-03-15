export interface LmStudioConfig {
  baseUrl: string;
  model: string;
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

export interface Citation {
  id: string;
  path: string;
  snippet: string;
}

export interface IndexingResult {
  status: "stubbed";
  indexedChunkCount: number;
  message: string;
}

export interface AnswerResult {
  status: "stubbed";
  answer: string;
  citations: Citation[];
}
