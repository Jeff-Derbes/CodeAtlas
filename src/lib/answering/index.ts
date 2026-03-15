import { generateAnswer } from "@/lib/llm";
import type { AnswerResult } from "@/lib/types";

export async function answerQuestion(question: string): Promise<AnswerResult> {
  const answer = await generateAnswer(question);

  return {
    status: "stubbed",
    answer,
    citations: [],
  };
}
