import { getLmStudioConfig } from "@/lib/config";
export { embedText } from "./embedder";

export interface GenerateAnswerInput {
  systemPrompt: string;
  userPrompt: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: ChatMessageContent;
    };
  }>;
  error?: {
    message?: string;
  };
}

type ChatMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>
  | undefined;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function readMessageContent(content: ChatMessageContent): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" ? part.text ?? "" : ""))
      .join("\n")
      .trim();
  }

  return "";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ChatCompletionResponse;
    return data.error?.message || `LM Studio request failed with status ${response.status}.`;
  } catch {
    return `LM Studio request failed with status ${response.status}.`;
  }
}

export async function generateAnswer({
  systemPrompt,
  userPrompt,
}: GenerateAnswerInput): Promise<string> {
  const { baseUrl, model, apiKey } = getLmStudioConfig();
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = readMessageContent(data.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error(`LM Studio returned an empty response for model "${model}".`);
  }

  return content;
}
