import { GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runTurn } from "./runTurn"
import {
  AIAgentEventType,
  AIAgentHistoryEntry,
  AIAgentTurnInputType,
} from "./types"

// Guardrail: reject a client-supplied history before it ever reaches the model.
const MAX_HISTORY_MESSAGES = 40
const MAX_HISTORY_BYTES = 100_000

function assertInputWithinLimits(input: {
  message: string
  history?: Array<AIAgentHistoryEntry> | null
}) {
  const history = input.history ?? []
  if (history.length > MAX_HISTORY_MESSAGES) {
    throw new Error(
      `Conversation history is too long (max ${MAX_HISTORY_MESSAGES} messages)`
    )
  }

  const totalBytes =
    Buffer.byteLength(input.message, "utf8") +
    history.reduce(
      (sum, entry) =>
        sum +
        Buffer.byteLength(entry.content ?? "", "utf8") +
        (entry.artworkIDs ?? []).reduce(
          (bytes, id) => bytes + Buffer.byteLength(id ?? "", "utf8"),
          0
        ),
      0
    )
  if (totalBytes > MAX_HISTORY_BYTES) {
    throw new Error(
      `Conversation input is too large (max ${MAX_HISTORY_BYTES} bytes)`
    )
  }
}

export const AIAgentTurn: GraphQLFieldConfig<void, ResolverContext> = {
  type: AIAgentEventType,
  args: {
    input: { type: new GraphQLNonNull(AIAgentTurnInputType) },
  },
  // IMPORTANT: must stay synchronous (no `await`) up to `return runTurn(...)`.
  // graphql-middleware races a field's `subscribe` (not `resolve`) against
  // RESOLVER_TIMEOUT_MS; calling `runTurn(...)` only constructs the async
  // generator without running it, which keeps the turn itself outside that race.
  subscribe: (_root, args, context, info) => {
    if (!context.userID || !context.accessToken) {
      throw new Error("You need to be signed in to perform this action")
    }

    // Read fresh per call (not hoisted) so tests can toggle it.
    const isDevelopment = config.NODE_ENV === "development"

    // Dev convenience, scoped to just this one flag — not a general dev
    // override for feature flags, which real Unleash still gates everywhere else.
    if (
      !isDevelopment &&
      !isFeatureFlagEnabled("onyx_ai_agent-turn", { userId: context.userID })
    ) {
      throw new Error("This feature is not currently enabled")
    }

    const input = args.input as {
      conversationID: string
      message: string
      history?: Array<AIAgentHistoryEntry> | null
    }

    assertInputWithinLimits(input)

    return runTurn(input, info.schema, context)
  },
  resolve: (payload) => payload,
}
