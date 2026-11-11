/**
 * Shapes shared by the Art Assistant eval runner (scripts/evals) and the
 * Phoenix dataset it reads. One dataset example is one assistant turn.
 */

export type EvalSectionType = "ARTWORKS" | "ARTISTS"

/** The GraphQL input enum names, as a client would send them. */
export interface EvalHistoryEntry {
  role: "USER" | "ASSISTANT"
  content: string
  displayedSections?: Array<{
    entityType: "ARTWORK" | "ARTIST"
    internalIDs: string[]
  }>
}

export interface EvalCaseInput {
  message: string
  history?: EvalHistoryEntry[]
  supportedSections?: EvalSectionType[]
}

/** The reference half of an example: what a good answer does. */
export interface EvalCaseReference {
  expectedBehavior?: string
  /** ANY (or absent) means the case doesn't care. */
  expectedSection?: EvalSectionType | "NONE" | "ANY"
  mustNot?: string[]
}

export interface EvalConstraints {
  priceMaxUSD?: number | null
  priceMinUSD?: number | null
  medium?: string | null
  forSale?: boolean | null
  artist?: string | null
  other?: string[]
}

export interface EvalCaseMetadata {
  caseId?: string
  category?: string
  constraints?: EvalConstraints
  signals?: string[]
  userDependent?: boolean
  [key: string]: unknown
}

export interface EvalCase {
  /** Phoenix's example ID, or caseId for a local file. */
  id: string
  input: EvalCaseInput
  reference: EvalCaseReference
  metadata: EvalCaseMetadata
}

export interface EvalToolCall {
  query: string | null
  variables: unknown
  ok: boolean | null
  /** Truncated: enough to judge grounding and to read a failure. */
  result: string
}

export interface EvalStep {
  durationMs: number
  finishReason: string
  modelId: string | null
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  outputTokens: number
  toolCalls: EvalToolCall[]
}

export interface EvalCard {
  internalID: string
  title?: string
  artist?: string
  price?: string
  medium?: string
  name?: string
  nationality?: string
}

/** What one run of one case produced: the Phoenix run's `output`. */
export interface EvalRunOutput {
  message: string | null
  stopReason: string
  sectionType: EvalSectionType | null
  cards: EvalCard[]
  suggestedReplies: string[]
  steps: EvalStep[]
  latencyMs: number
  /** Null when a model's price isn't in the table. */
  costUSD: number | null
}

export interface EvalScore {
  name: string
  kind: "CODE" | "LLM"
  /** Null: not applicable to this case, so left out of averages. */
  score: number | null
  label?: string
  explanation?: string
}
