import { createAnthropic } from "@ai-sdk/anthropic"
import type { AnthropicProvider } from "@ai-sdk/anthropic"
import config from "config"

/**
 * Lazy singleton Anthropic providers for the AI agent (src/schema/v2/ai/agent).
 *
 * Deviates from the src/lib/apis/fetch.ts loader convention on purpose,
 * following the precedent set by src/lib/apis/ashby.ts: no DataLoader/cache
 * wiring, since loader caching doesn't apply to LLM calls.
 */
let provider: AnthropicProvider | undefined
let litellm: AnthropicProvider | undefined

export const anthropicProvider = () => {
  if (!provider) {
    provider = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })
  }
  return provider
}

/** With LiteLLM configured, the agent goes through it and Phoenix, not Sentry. */
export const isLiteLLMConfigured = (): boolean =>
  !!(config.LITELLM_BASE_URL && config.LITELLM_API_KEY)

/** A LiteLLM alias; the model behind it is set in LiteLLM. */
export const LITELLM_AGENT_MODEL = "art-assistant"

export const litellmURL = (path = ""): string =>
  (config.LITELLM_BASE_URL as string).replace(/\/+$/, "").replace(/\/v1$/, "") +
  path

/**
 * Its own base URL rather than ANTHROPIC_BASE_URL, which the SDK would also
 * apply to `anthropicProvider`.
 */
export const litellmProvider = () => {
  if (!litellm) {
    litellm = createAnthropic({
      baseURL: litellmURL("/v1"),
      apiKey: config.LITELLM_API_KEY,
    })
  }
  return litellm
}
