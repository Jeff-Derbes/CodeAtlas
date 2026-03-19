import { getLmStudioConfig } from "@/lib/config";

export type EmbedTextFn = (text: string) => Promise<number[]>;

interface EmbeddingResponse {
  data?: Array<{
    embedding?: number[];
  }>;
  error?: {
    message?: string;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as EmbeddingResponse;
    return data.error?.message || `LM Studio request failed with status ${response.status}.`;
  } catch {
    return `LM Studio request failed with status ${response.status}.`;
  }
}

export async function embedText(text: string): Promise<number[]> {
  const { baseUrl, embeddingModel, apiKey } = getLmStudioConfig();
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as EmbeddingResponse;
  const embedding = data.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(`LM Studio returned an empty embedding for model "${embeddingModel}".`);
  }

  return embedding;
}
