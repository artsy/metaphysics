/**
 * Runs one Art Assistant turn in-process -- the real runTurn, the real
 * query_artsy tool against whatever Gravity the environment points at -- and
 * records what an evaluator needs.
 */

import { randomUUID } from "crypto"
import type { GraphQLSchema } from "graphql"
import type { LanguageModel, StepResult, ToolSet } from "ai"
import { createLoaders } from "lib/loaders"
import { runTurn } from "schema/v2/ai/agent/runTurn"
import type { AIAgentToolRunResult } from "schema/v2/ai/agent/tools"
import type {
  AIAgentHistoryEntry,
  AIAgentResponseSectionPayload,
  AIAgentTurnCompletePayload,
} from "schema/v2/ai/agent/types"
import type { ResolverContext } from "types/graphql"
import { stepCostUSD } from "./models"
import type {
  EvalCard,
  EvalCase,
  EvalRunOutput,
  EvalSectionType,
  EvalStep,
} from "./types"

export interface EvalUser {
  accessToken: string
  userID: string
}

/** A fresh context per turn, as each request gets in the server. */
export function evalContext(user: EvalUser): ResolverContext {
  const requestIDs = {
    requestID: randomUUID(),
    xForwardedFor: "127.0.0.1",
  }
  const userAgent = "metaphysics-evals"
  const loaders = createLoaders(user.accessToken, user.userID, {
    requestIDs,
    userAgent,
  })
  return ({
    accessToken: user.accessToken,
    userID: user.userID,
    ...loaders,
    requestIDs,
    userAgent,
  } as unknown) as ResolverContext
}

const SECTION_TYPES: Record<string, EvalSectionType> = {
  AIAgentArtworksSection: "ARTWORKS",
  AIAgentArtistsSection: "ARTISTS",
}

// Raw Gravity hashes; read defensively, they are only for the judge.
function describeCards(section: AIAgentResponseSectionPayload): EvalCard[] {
  if (section.__typename === "AIAgentArtworksSection") {
    return section.artworks.map((artwork: any) => ({
      internalID: String(artwork._id ?? artwork.id ?? ""),
      title: artwork.title ?? undefined,
      artist:
        artwork.artist?.name ??
        ((artwork.artists ?? [])
          .map((artist: any) => artist?.name)
          .filter(Boolean)
          .join(", ") ||
          undefined),
      price: artwork.sale_message ?? artwork.price ?? undefined,
      medium: artwork.medium ?? artwork.category ?? undefined,
    }))
  }
  return section.artists.map((artist: any) => ({
    internalID: String(artist._id ?? artist.id ?? ""),
    name: artist.name ?? undefined,
    nationality: artist.nationality ?? undefined,
  }))
}

function toHistory(testCase: EvalCase): AIAgentHistoryEntry[] {
  return (testCase.input.history ?? []).map((entry) => ({
    role: entry.role === "ASSISTANT" ? "assistant" : "user",
    content: entry.content,
    displayedSections: entry.displayedSections ?? null,
  }))
}

function toStep(step: StepResult<ToolSet>, durationMs: number): EvalStep {
  const results = new Map(
    step.toolResults.map((result) => [
      result.toolCallId,
      result.output as AIAgentToolRunResult,
    ])
  )
  const usage = step.usage
  return {
    durationMs,
    finishReason: step.finishReason,
    modelId: step.response?.modelId ?? step.model?.modelId ?? null,
    inputTokens: usage.inputTokens ?? 0,
    cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
    cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    toolCalls: step.toolCalls.map((call) => {
      const input = (call.input ?? {}) as {
        query?: unknown
        variables?: unknown
      }
      const result = results.get(call.toolCallId)
      return {
        query: typeof input.query === "string" ? input.query : null,
        variables: input.variables ?? null,
        ok: result ? result.ok : null,
        result: String(result?.content ?? ""),
      }
    }),
  }
}

export async function runCase(
  testCase: EvalCase,
  {
    model,
    systemPromptTemplate,
    now,
    schema,
    user,
  }: {
    model: LanguageModel
    systemPromptTemplate?: string
    now: Date
    schema: GraphQLSchema
    user: EvalUser
  }
): Promise<EvalRunOutput> {
  const steps: EvalStep[] = []
  const startedAt = Date.now()
  let lastBoundary = startedAt
  let complete: AIAgentTurnCompletePayload | null = null

  for await (const event of runTurn(
    {
      conversationID: `eval-${randomUUID()}`,
      message: testCase.input.message,
      history: toHistory(testCase),
      supportedSections: testCase.input.supportedSections ?? [
        "ARTWORKS",
        "ARTISTS",
      ],
      includeSuggestedReplies: true,
      useLiteLLM: false,
    },
    schema,
    evalContext(user),
    {
      model,
      systemPromptTemplate,
      now,
      skipRateLimit: true,
      disableTracing: true,
      onStepFinish: (step) => {
        const finishedAt = Date.now()
        // Model time plus that step's tool calls, which run before it ends.
        steps.push(toStep(step, finishedAt - lastBoundary))
        lastBoundary = finishedAt
      },
    }
  )) {
    if (event.__typename === "AIAgentTurnComplete") complete = event
  }

  const latencyMs = Date.now() - startedAt
  const section = complete?.sections?.[0] ?? null
  const costs = steps.map(stepCostUSD)

  return {
    message: complete?.message ?? null,
    stopReason: complete?.stopReason ?? "no_completion",
    sectionType: section ? SECTION_TYPES[section.__typename] ?? null : null,
    cards: section ? describeCards(section) : [],
    suggestedReplies: (complete?.suggestedReplies ?? []).map(
      (reply) => reply.text
    ),
    steps,
    latencyMs,
    costUSD: costs.some((cost) => cost === null)
      ? null
      : costs.reduce((sum: number, cost) => sum + (cost as number), 0),
  }
}
