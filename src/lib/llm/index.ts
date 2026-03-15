import { getLmStudioConfig } from "@/lib/config";

export async function generateAnswer(_question: string): Promise<string> {
  void _question;

  const { model } = getLmStudioConfig();

  return `LLM generation is stubbed. Future requests will target the "${model}" model through LM Studio.`;
}
