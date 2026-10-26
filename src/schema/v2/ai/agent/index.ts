import { GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runTurn } from "./runTurn"
import { isSupportedImageBucket } from "./images"
import {
  AIAgentEventType,
  AIAgentHistoryEntry,
  AIAgentImage,
  AIAgentSectionType,
  AIAgentTurnInputType,
} from "./types"

// Guardrail: reject a client-supplied history before it ever reaches the model.
const MAX_HISTORY_MESSAGES = 40
const MAX_HISTORY_BYTES = 100_000

function imageBytes(image: AIAgentImage | null | undefined): number {
  if (!image) return 0
  return (
    Buffer.byteLength(image.s3Key ?? "", "utf8") +
    Buffer.byteLength(image.s3Bucket ?? "", "utf8")
  )
}

// Every client-supplied field reaches the model one way or another, so a
// history that is small in prose but enormous in replayed ids can't slip past.
function historyEntryBytes(entry: AIAgentHistoryEntry): number {
  const sections = entry.displayedSections ?? []
  const ids = [
    ...(entry.artworkIDs ?? []),
    ...sections.flatMap((section) => section.internalIDs ?? []),
  ]

  return (
    Buffer.byteLength(entry.content ?? "", "utf8") +
    sections.reduce(
      (bytes, section) =>
        bytes + Buffer.byteLength(section.entityType ?? "", "utf8"),
      0
    ) +
    ids.reduce((bytes, id) => bytes + Buffer.byteLength(id ?? "", "utf8"), 0) +
    imageBytes(entry.image)
  )
}

// An image the collector attaches is a message on its own, so the text may be
// empty then -- but not both.
function assertMessageOrImage(input: {
  message: string
  image?: AIAgentImage | null
}) {
  if (input.message.trim().length === 0 && !input.image) {
    throw new Error("A message or an image is required")
  }
}

// Checked here, before any model spend, rather than left to Gravity: by then
// the turn has already paid for the model call that tried the search.
function assertSupportedImages(input: {
  image?: AIAgentImage | null
  history?: Array<AIAgentHistoryEntry> | null
}) {
  const images = [
    input.image,
    ...(input.history ?? [])
      .filter((entry) => entry.role !== "assistant")
      .map((entry) => entry.image),
  ]
  images.forEach((image) => {
    if (!image) return
    if (!image.s3Key.trim()) {
      throw new Error("An attached image needs an S3 key")
    }
    if (!isSupportedImageBucket(image.s3Bucket)) {
      throw new Error(
        `Images must be uploaded to a supported bucket, not "${image.s3Bucket}"`
      )
    }
  })
}

function assertInputWithinLimits(input: {
  message: string
  image?: AIAgentImage | null
  history?: Array<AIAgentHistoryEntry> | null
  supportedSections?: Array<AIAgentSectionType> | null
}) {
  const history = input.history ?? []
  if (history.length > MAX_HISTORY_MESSAGES) {
    throw new Error(
      `Conversation history is too long (max ${MAX_HISTORY_MESSAGES} messages)`
    )
  }

  const totalBytes =
    Buffer.byteLength(input.message, "utf8") +
    imageBytes(input.image) +
    // The enum bounds the values, not how many arrive.
    (input.supportedSections ?? []).reduce(
      (bytes, sectionType) => bytes + Buffer.byteLength(sectionType, "utf8"),
      0
    ) +
    history.reduce((sum, entry) => sum + historyEntryBytes(entry), 0)
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

    // Dev convenience, scoped to the agent's flags — not a general dev
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
      image?: AIAgentImage | null
      history?: Array<AIAgentHistoryEntry> | null
      supportedSections?: Array<AIAgentSectionType> | null
      includeDebugToolCalls?: boolean | null
    }

    // Gates attaching a new image only. Images already in a replayed history
    // were accepted when they were sent; turning the flag off shouldn't break
    // those conversations.
    if (
      input.image &&
      !isDevelopment &&
      !isFeatureFlagEnabled("onyx_ai_agent-image-input", {
        userId: context.userID,
      })
    ) {
      throw new Error("Image input is not currently enabled")
    }

    assertMessageOrImage(input)
    assertInputWithinLimits(input)
    assertSupportedImages(input)

    const debugAvailable = isDevelopment || config.ENABLE_AI_AGENT_DEBUG
    const includeSuggestedReplies =
      isDevelopment ||
      isFeatureFlagEnabled("onyx_ai_agent-suggested-replies", {
        userId: context.userID,
      })

    return runTurn(
      {
        ...input,
        includeDebugToolCalls: debugAvailable && !!input.includeDebugToolCalls,
        includeSuggestedReplies,
      },
      info.schema,
      context
    )
  },
  resolve: (payload) => payload,
}
