import type { LanguageModel } from "ai"
import { anthropicProvider, litellmProvider } from "lib/apis/anthropic"

/**
 * A variant is what one experiment varies: a model, and optionally a prompt.
 * Written `label=provider:model[@prompt-file]`, e.g.
 *   sonnet-5=litellm:claude-sonnet-5
 *   new-prompt=litellm:claude-sonnet-5@prompts/candidate.md
 */
export interface EvalVariant {
  label: string
  provider: "anthropic" | "litellm"
  model: string
  promptFile?: string
}

const VARIANT = /^([\w.-]+)=(anthropic|litellm):([\w.-]+)(?:@(.+))?$/

export function parseVariant(spec: string): EvalVariant {
  const match = VARIANT.exec(spec.trim())
  if (!match) {
    throw new Error(
      `Bad --variant "${spec}": expected label=anthropic|litellm:model[@prompt-file]`
    )
  }
  const [, label, provider, model, promptFile] = match
  return {
    label,
    provider: provider as EvalVariant["provider"],
    model,
    ...(promptFile ? { promptFile } : {}),
  }
}

export function languageModelFor(variant: EvalVariant): LanguageModel {
  return variant.provider === "litellm"
    ? litellmProvider()(variant.model)
    : anthropicProvider()(variant.model)
}

/** USD per token, as LiteLLM's /model/info reports it. */
export interface Price {
  input: number
  output: number
  cacheRead: number | null
  cacheWrite: number | null
}

/** `anthropic/claude-sonnet-5-20260901` → `claude-sonnet-5`. */
export const baseModel = (id: string) =>
  id.replace(/^anthropic\//, "").replace(/-\d{8}$/, "")

/**
 * LiteLLM's /model/info, keyed by both the public name and the upstream
 * model, so either form of the ID a response carries finds it. A model
 * without input and output prices is left out, so its cost is unknown.
 */
export function parseModelInfo(body: any): Map<string, Price> {
  const prices = new Map<string, Price>()
  for (const entry of body?.data ?? []) {
    const info = entry?.model_info ?? {}
    if (
      typeof info.input_cost_per_token !== "number" ||
      typeof info.output_cost_per_token !== "number"
    ) {
      continue
    }
    const price: Price = {
      input: info.input_cost_per_token,
      output: info.output_cost_per_token,
      cacheRead: info.cache_read_input_token_cost ?? null,
      cacheWrite: info.cache_creation_input_token_cost ?? null,
    }
    for (const name of [entry.model_name, entry.litellm_params?.model]) {
      if (typeof name === "string") prices.set(baseModel(name), price)
    }
  }
  return prices
}

let prices = new Map<string, Price>()

/** Prices come from LiteLLM, so they match what it records as spend. */
export async function loadPrices(
  fetchModelInfo: () => Promise<unknown>
): Promise<Map<string, Price>> {
  prices = parseModelInfo(await fetchModelInfo())
  return prices
}

export function priceFor(modelId: string | null | undefined): Price | null {
  return (modelId && prices.get(baseModel(modelId))) || null
}

/**
 * Null when the model has no price, or the step used a cache rate LiteLLM
 * doesn't list: an unknown cost rather than a wrong one.
 */
export function stepCostUSD(step: {
  modelId: string | null
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
}): number | null {
  const price = priceFor(step.modelId)
  if (!price) return null
  if (step.cacheReadTokens && price.cacheRead == null) return null
  if (step.cacheWriteTokens && price.cacheWrite == null) return null
  // `inputTokens` is the total; the cached parts are billed at their own rate.
  const uncached = Math.max(
    0,
    step.inputTokens - step.cacheReadTokens - step.cacheWriteTokens
  )
  return (
    uncached * price.input +
    step.cacheReadTokens * (price.cacheRead ?? 0) +
    step.cacheWriteTokens * (price.cacheWrite ?? 0) +
    step.outputTokens * price.output
  )
}
