import type { LmStudioConfig } from "@/lib/types";

const DEFAULT_LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1";
const DEFAULT_LM_STUDIO_MODEL = "local-model";

export function getLmStudioConfig(): LmStudioConfig {
  const baseUrl =
    process.env.LM_STUDIO_BASE_URL?.trim() || DEFAULT_LM_STUDIO_BASE_URL;
  const model = process.env.LM_STUDIO_MODEL?.trim() || DEFAULT_LM_STUDIO_MODEL;
  const embeddingModel =
    process.env.LM_STUDIO_EMBEDDING_MODEL?.trim() || model;
  const apiKey = process.env.LM_STUDIO_API_KEY?.trim() || undefined;

  return {
    baseUrl,
    model,
    embeddingModel,
    apiKey,
  };
}
