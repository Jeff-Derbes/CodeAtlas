import type { AnswerSourceChunk } from "@/lib/types";

export interface BuiltContextSource extends AnswerSourceChunk {
  sourceId: number;
}

export interface BuiltContextResult {
  contextText: string;
  sources: BuiltContextSource[];
}

function inferLanguage(relativePath: string): string {
  const segments = relativePath.split(/[\\/]/);
  const fileName = segments[segments.length - 1] ?? relativePath;
  const extensionMatch = fileName.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? "";

  switch (extension) {
    case ".ts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".js":
      return "js";
    case ".jsx":
      return "jsx";
    case ".json":
      return "json";
    case ".md":
      return "md";
    case ".css":
      return "css";
    case ".html":
      return "html";
    case ".yml":
    case ".yaml":
      return "yaml";
    case ".sh":
      return "sh";
    default:
      return "text";
  }
}

function getFence(content: string): string {
  const matches = content.match(/`+/g) ?? [];
  const longestRun = matches.reduce((max, value) => Math.max(max, value.length), 0);

  return "`".repeat(Math.max(3, longestRun + 1));
}

export function buildContext(chunks: AnswerSourceChunk[]): BuiltContextResult {
  const sources = chunks.map((chunk, index) => ({
    ...chunk,
    sourceId: index + 1,
  }));

  const contextText = sources
    .map((source) => {
      const language = inferLanguage(source.relativePath);
      const fence = getFence(source.content);
      const scoreLine =
        typeof source.score === "number" ? `Score: ${source.score.toFixed(4)}\n` : "";

      return [
        `[Source ${source.sourceId}]`,
        `File: ${source.relativePath}`,
        `Lines: ${source.startLine}-${source.endLine}`,
        scoreLine.trimEnd(),
        `${fence}${language}`,
        source.content,
        fence,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return {
    contextText,
    sources,
  };
}
