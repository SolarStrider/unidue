import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const PROVIDER_TO_MODEL: Record<string, string> = {
  gemini: "google/gemini-3-flash-preview",
  openai: "openai/gpt-5-mini",
  claude: "openai/gpt-5-mini", // Claude proxied via gateway alternative
};

export function modelFor(provider?: string | null) {
  const key = (provider || "gemini").toLowerCase();
  return PROVIDER_TO_MODEL[key] || PROVIDER_TO_MODEL.gemini;
}