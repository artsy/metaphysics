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

/**
 * USD per million tokens, Anthropic first-party rates (checked 2026-11-10).
 * Sonnet 5.5 kept Sonnet 5's prices, cache reads included ($0.20). Opus
 * 5.5's cache reads are also $0.20, not a tenth of its input. Cache writes
 * are the 5-minute rate, which is what runTurn's ephemeral breakpoints use.
 * Add a model here before comparing costs with it; unknown models report a
 * null cost rather than a wrong one.
 */
export const PRICES_PER_MTOK: Record<
  string,
  { input: number; output: number; cacheRead: number; cacheWrite: number }
> = {
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-sonnet-5-5": {
    input: 2,
    output: 10,
    cacheRead: 0.2,
    cacheWrite: 2.5,
  },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
}

/** `anthropic/claude-sonnet-5-20260901` → `claude-sonnet-5`. */
export const baseModel = (id: string) =>
  id.replace(/^anthropic\//, "").replace(/-\d{8}$/, "")

/** Exact on the base name: a new model gets no price, not a neighbour's. */
export function priceFor(modelId: string | null | undefined) {
  return (modelId && PRICES_PER_MTOK[baseModel(modelId)]) || null
}

export function stepCostUSD(step: {
  modelId: string | null
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
}): number | null {
  const price = priceFor(step.modelId)
  if (!price) return null
  // `inputTokens` is the total; the cached parts are billed at their own rate.
  const uncached = Math.max(
    0,
    step.inputTokens - step.cacheReadTokens - step.cacheWriteTokens
  )
  return (
    (uncached * price.input +
      step.cacheReadTokens * price.cacheRead +
      step.cacheWriteTokens * price.cacheWrite +
      step.outputTokens * price.output) /
    1_000_000
  )
}
