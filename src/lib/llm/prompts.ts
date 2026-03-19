export interface AnswerPromptInput {
  question: string;
  contextText: string;
}

export interface AnswerPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export function buildAnswerPrompt({
  question,
  contextText,
}: AnswerPromptInput): AnswerPrompt {
  const systemPrompt = `You are CodeAtlas, a grounded codebase explainer.
Answer only from the provided sources.
Do not invent files, functions, or behavior that are not supported by the sources.
If the sources are insufficient, say what is missing.
Use inline citations in the answer text like [Source 1] or [Source 2].
Return only valid JSON with this shape:
{"answer":"string","citations":[1,2]}
The citations array must contain the source numbers you relied on.`;

  const userPrompt = `Question:
${question}

Retrieved source context:
${contextText}

Respond with JSON only.`;

  return {
    systemPrompt,
    userPrompt,
  };
}
