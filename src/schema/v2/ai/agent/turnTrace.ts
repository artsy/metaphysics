/**
 * One agent turn as one Phoenix trace, sent through LiteLLM:
 *
 *   ai_agent_turn (AGENT)    <- sent from here when the turn ends
 *   ├─ LLM call              <- LiteLLM's span, parented via `traceparent`
 *   ├─ query_artsy (TOOL)    <- sent from here
 *   └─ LLM call
 */

import { randomBytes } from "crypto"
import { LITELLM_AGENT_MODEL } from "lib/apis/anthropic"
import { exportSpans, PhoenixSpan } from "lib/apis/phoenix"
import { AIAgentToolRunResult } from "./tools"
import { AIAgentResponseSectionPayload, AIAgentSuggestedReply } from "./types"

/** Must match the LiteLLM key's phoenix_project_name and its spans route. */
const PHOENIX_PROJECT = "metaphysics"

const FAILED_STOP_REASONS = new Set(["error", "aborted"])

const ARTSY_URL = "https://www.artsy.net"

const hex = (bytes: number) => randomBytes(bytes).toString("hex")

/** One Markdown line per card shown under the answer. */
function describeSection(section: AIAgentResponseSectionPayload): string[] {
  const line = (title: string, path: string, details: unknown[]) =>
    [`- [${title}](${ARTSY_URL}/${path})`, ...details.filter(Boolean)].join(
      " — "
    )

  switch (section.__typename) {
    case "AIAgentArtworksSection":
      return section.artworks.map((artwork) =>
        line(
          [artwork.title, artwork.date].filter(Boolean).join(", ") ||
            "Untitled",
          `artwork/${artwork.id ?? artwork._id}`,
          [
            artwork.artist?.name ?? artwork.artists?.[0]?.name,
            artwork.partner?.name,
            artwork.sale_message,
          ]
        )
      )
    case "AIAgentArtistsSection":
      return section.artists.map((artist) =>
        line(
          String(artist.name ?? artist._id),
          `artist/${artist.id ?? artist._id}`,
          []
        )
      )
  }
}

interface ToolSpan {
  spanID: string
  name: string
  input: unknown
  startedAt: Date
  endedAt?: Date
  result?: AIAgentToolRunResult
}

interface TurnOutcome {
  message: string | null
  stopReason: string
  toolCallCount: number
  section: AIAgentResponseSectionPayload | null
  suggestedReplies: AIAgentSuggestedReply[] | null
}

export class TurnTrace {
  readonly traceID = hex(16)
  private readonly rootSpanID = hex(8)
  private readonly startedAt = new Date()
  private readonly tools = new Map<string, ToolSpan>()
  private finished = false

  constructor(
    private readonly turn: {
      conversationID: string
      userID: string
      message: string
      hasImage: boolean
    }
  ) {}

  /** Sent on every model call so LiteLLM nests its spans under the root. */
  get traceparent(): string {
    return `00-${this.traceID}-${this.rootSpanID}-01`
  }

  toolCall(toolCallID: string, name: string, input: unknown): void {
    this.tools.set(toolCallID, {
      spanID: hex(8),
      name,
      input,
      startedAt: new Date(),
    })
  }

  toolResult(toolCallID: string, result: AIAgentToolRunResult): void {
    const tool = this.tools.get(toolCallID)
    if (!tool) return
    tool.endedAt = new Date()
    tool.result = result
  }

  /** Sends the spans once; later calls are no-ops. Never throws or waits. */
  finish(outcome: TurnOutcome): void {
    if (this.finished) return
    this.finished = true

    void exportSpans(PHOENIX_PROJECT, this.spans(outcome, new Date())).catch(
      () => undefined
    )
  }

  private spans(outcome: TurnOutcome, endedAt: Date): PhoenixSpan[] {
    const { section } = outcome
    const failed = FAILED_STOP_REASONS.has(outcome.stopReason)
    const replies = outcome.suggestedReplies ?? []
    const output = [
      outcome.message,
      ...(section ? describeSection(section) : []),
      replies.length > 0
        ? [
            "Suggested replies:",
            ...replies.map(({ text }) => `- ${text}`),
          ].join("\n")
        : null,
    ].filter(Boolean)

    const root: PhoenixSpan = {
      name: "ai_agent_turn",
      context: { trace_id: this.traceID, span_id: this.rootSpanID },
      parent_id: null,
      span_kind: "AGENT",
      start_time: this.startedAt.toISOString(),
      end_time: endedAt.toISOString(),
      status_code: failed ? "ERROR" : "OK",
      ...(failed ? { status_message: outcome.stopReason } : {}),
      attributes: {
        "openinference.span.kind": "AGENT",
        // Groups a conversation's turns in Phoenix's Sessions view.
        "session.id": this.turn.conversationID,
        "user.id": this.turn.userID,
        "input.value": this.turn.hasImage
          ? `${this.turn.message}\n[image attached]`.trim()
          : this.turn.message,
        "input.mime_type": "text/plain",
        ...(output.length > 0
          ? {
              "output.value": output.join("\n\n"),
              "output.mime_type": "text/markdown",
            }
          : {}),
        metadata: {
          model: LITELLM_AGENT_MODEL,
          stopReason: outcome.stopReason,
          toolCallCount: outcome.toolCallCount,
          sectionType: section?.__typename ?? null,
          sectionIDs:
            section?.__typename === "AIAgentArtworksSection"
              ? section.artworks.map((artwork) => artwork._id)
              : section?.artists.map((artist) => artist._id) ?? [],
        },
      },
      events: [],
    }

    const tools = Array.from(this.tools.values()).map(
      (tool): PhoenixSpan => {
        // No result: the turn ended mid-call.
        const ok = tool.result?.ok ?? false
        return {
          name: tool.name,
          context: { trace_id: this.traceID, span_id: tool.spanID },
          parent_id: this.rootSpanID,
          span_kind: "TOOL",
          start_time: tool.startedAt.toISOString(),
          end_time: (tool.endedAt ?? endedAt).toISOString(),
          status_code: ok ? "OK" : "ERROR",
          ...(ok
            ? {}
            : { status_message: tool.result ? "tool failed" : "no result" }),
          attributes: {
            "openinference.span.kind": "TOOL",
            "tool.name": tool.name,
            "input.value": JSON.stringify(tool.input ?? null),
            "input.mime_type": "application/json",
            ...(tool.result
              ? {
                  "output.value": tool.result.content,
                  "output.mime_type": "text/plain",
                }
              : {}),
          },
          events: [],
        }
      }
    )

    return [root, ...tools]
  }
}
