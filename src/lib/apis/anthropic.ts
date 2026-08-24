import { createAnthropic } from "@ai-sdk/anthropic"
import type { AnthropicProvider } from "@ai-sdk/anthropic"
import config from "config"

/**
 * Lazy singleton Anthropic provider for the AI agent (src/schema/v2/ai/agent).
 *
 * Deviates from the src/lib/apis/fetch.ts loader convention on purpose,
 * following the precedent set by src/lib/apis/ashby.ts: no DataLoader/cache
 * wiring, since loader caching doesn't apply to LLM calls.
 */
let provider: AnthropicProvider | undefined

export const anthropicProvider = () => {
  if (!provider) {
    provider = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })
  }
  return provider
}
