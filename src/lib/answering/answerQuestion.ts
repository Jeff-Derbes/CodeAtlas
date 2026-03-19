import { generateAnswer } from "@/lib/llm";
import { buildAnswerPrompt } from "@/lib/llm/prompts";
import type { RetrievedChunk } from "@/lib/retrieval";
import type { AnswerResult, AnswerSourceChunk, Citation } from "@/lib/types";

import { buildContext, type BuiltContextSource } from "./buildContext";

interface ParsedLlmAnswer {
  answer: string;
  citations: number[];
}

export interface AnswerQuestionOptions {
  generateText?: typeof generateAnswer;
}

function normalizeChunks(chunks: RetrievedChunk[]): AnswerSourceChunk[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    relativePath: chunk.filePath,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    content: chunk.content,
    score: chunk.score,
  }));
}

function extractJsonObject(raw: string): string | null {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return raw.slice(firstBrace, lastBrace + 1).trim();
}

function normalizeCitationNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+)/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  return null;
}

function extractInlineCitations(text: string): number[] {
  const matches = text.matchAll(/\[Source\s+(\d+)\]/gi);
  const citationNumbers = Array.from(matches, (match) => Number.parseInt(match[1], 10));

  return [...new Set(citationNumbers)];
}

function parseLlmAnswer(raw: string): ParsedLlmAnswer {
  const jsonCandidate = extractJsonObject(raw);

  if (!jsonCandidate) {
    return {
      answer: raw.trim(),
      citations: extractInlineCitations(raw),
    };
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as {
      answer?: unknown;
      citations?: unknown;
    };
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : raw.trim();
    const citations = Array.isArray(parsed.citations)
      ? parsed.citations
          .map(normalizeCitationNumber)
          .filter((value): value is number => value !== null)
      : extractInlineCitations(answer);

    return {
      answer,
      citations: [...new Set(citations)],
    };
  } catch {
    return {
      answer: raw.trim(),
      citations: extractInlineCitations(raw),
    };
  }
}

function truncateSnippet(content: string, maxLength = 240): string {
  const normalized = content.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function toCitation(source: BuiltContextSource): Citation {
  return {
    sourceId: source.sourceId,
    relativePath: source.relativePath,
    startLine: source.startLine,
    endLine: source.endLine,
    snippet: truncateSnippet(source.content),
    score: source.score,
  };
}

function mapCitations(
  citationNumbers: number[],
  sources: BuiltContextSource[],
): Citation[] {
  const sourceMap = new Map(sources.map((source) => [source.sourceId, source]));

  return citationNumbers
    .map((citationNumber) => sourceMap.get(citationNumber))
    .filter((source): source is BuiltContextSource => source !== undefined)
    .map(toCitation);
}

export async function answerQuestion(
  question: string,
  retrievedChunks: RetrievedChunk[],
  options: AnswerQuestionOptions = {},
): Promise<AnswerResult> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    return {
      status: "error",
      answer: "A question is required before an answer can be generated.",
      citations: [],
    };
  }

  const answerChunks = normalizeChunks(retrievedChunks);
  const { contextText, sources } = buildContext(answerChunks);

  if (sources.length === 0) {
    return {
      status: "no_context",
      answer:
        "I couldn't find any relevant indexed code chunks for that question, so I can't give a grounded answer yet.",
      citations: [],
    };
  }

  const { systemPrompt, userPrompt } = buildAnswerPrompt({
    question: trimmedQuestion,
    contextText,
  });

  try {
    const generateText = options.generateText ?? generateAnswer;
    const rawAnswer = await generateText({ systemPrompt, userPrompt });
    const parsed = parseLlmAnswer(rawAnswer);
    const citationNumbers =
      parsed.citations.length > 0 ? parsed.citations : extractInlineCitations(parsed.answer);

    return {
      status: "answered",
      answer: parsed.answer,
      citations: mapCitations(citationNumbers, sources),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    return {
      status: "error",
      answer: `Failed to generate an answer from the local model: ${message}`,
      citations: [],
    };
  }
}
