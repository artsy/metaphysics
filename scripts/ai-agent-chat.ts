// Interactively chat with the `aiAgentTurn` GraphQL subscription against a
// running `yarn dev` server, over the same SSE transport a real client uses.
//
// Requires:
//   - `yarn dev` running with a real ANTHROPIC_API_KEY in its environment.
//   - A signed-in user with the `onyx_ai_agent-turn` Unleash flag enabled
//     (or any placeholder value, if the server's NODE_ENV is "development").
//   - A real access token for that user: needs a real token, since the
//     tool's queries hit real Gravity.
//
// Usage:
//   METAPHYSICS_ACCESS_TOKEN=... METAPHYSICS_USER_ID=... yarn ai-agent-chat
//
// These can also be set in .env instead of prefixing every invocation.

import "../src/lib/loadenv"
import { randomUUID } from "crypto"
import { readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import * as readline from "readline"

const METAPHYSICS_URL =
  process.env.METAPHYSICS_URL || "http://localhost:5001/v2"
const ACCESS_TOKEN = process.env.METAPHYSICS_ACCESS_TOKEN
const USER_ID = process.env.METAPHYSICS_USER_ID
const INPUT_HISTORY_SIZE = 200
const INPUT_HISTORY_FILE =
  process.env.AI_AGENT_CHAT_HISTORY_FILE ||
  join(homedir(), ".metaphysics-ai-agent-history.json")

if (!ACCESS_TOKEN || !USER_ID) {
  console.error(
    [
      "Set METAPHYSICS_ACCESS_TOKEN and METAPHYSICS_USER_ID (in .env, or prefixed on the",
      "command line) before running this script -- a signed-in user with the",
      "`onyx_ai_agent-turn` Unleash flag enabled (or any values, if the running server's",
      'NODE_ENV is "development", which skips that check).',
      "Optionally set METAPHYSICS_URL (default http://localhost:5001/v2).",
    ].join(" ")
  )
  process.exit(1)
}

const QUERY = `
  subscription AIAgentChatScript($input: AIAgentTurnInput!) {
    aiAgentTurn(input: $input) {
      __typename
      ... on AIAgentTextDelta { text }
      ... on AIAgentToolCall { toolName activity summary debugSummary }
      ... on AIAgentToolResult { toolName ok summary debugSummary }
      ... on AIAgentTurnComplete {
        message
        stopReason
        toolCallCount
        sections {
          __typename
          ... on AIAgentArtworksSection {
            artworks { internalID title artistNames saleMessage }
          }
        }
        # Only to check the dual write below -- a real client picks one.
        artworks { internalID }
      }
    }
  }
`

type EntityType = "ARTWORK"

// What the client keeps: the entity type and the ids, in display order, never
// the entities themselves -- replayed next turn so an ordinal follow-up
// resolves against what was on screen.
type DisplayedSection = { entityType: EntityType; internalIDs: string[] }

// A real client declares only the types it has a renderer for.
const SUPPORTED_SECTIONS = ["ARTWORKS"]

type HistoryEntry = {
  role: "USER" | "ASSISTANT"
  content: string
  displayedSections?: DisplayedSection[]
}

const SECTION_ENTITY_TYPES: Record<string, EntityType> = {
  AIAgentArtworksSection: "ARTWORK",
}

function describeSections(sections: any[]): DisplayedSection[] {
  return sections.flatMap((section) => {
    // An unknown future section type is skipped, not guessed at.
    const entityType = SECTION_ENTITY_TYPES[section.__typename]
    if (!entityType) return []
    const entities = section.artworks ?? []
    return [
      {
        entityType,
        internalIDs: entities.map(
          (entity: { internalID: string }) => entity.internalID
        ),
      },
    ]
  })
}

const dim = (text: string) => `\x1b[2m${text}\x1b[0m`

const indent = (text: string) =>
  text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n")

// A terminal has no card UI, so each section prints as a compact list.
function printSections(sections: any[]): void {
  for (const section of sections) {
    switch (section.__typename) {
      case "AIAgentArtworksSection":
        process.stdout.write(`\n${dim("Artworks:")}\n`)
        for (const artwork of section.artworks) {
          const price = artwork.saleMessage ? ` — ${artwork.saleMessage}` : ""
          const artist = artwork.artistNames ? `${artwork.artistNames}, ` : ""
          process.stdout.write(dim(`  • ${artist}${artwork.title}${price}\n`))
        }
        break
      default:
        process.stdout.write(
          `\n${dim(`[${section.__typename}: this script can't render it]`)}\n`
        )
    }
  }
}

// `artworks` should always hold the same works as the artworks section. Drift
// is a server bug that would otherwise only show up as missing cards on old
// app versions.
function warnOnLegacyDrift(event: any): void {
  const section = (event.sections ?? []).find(
    (candidate: any) => candidate.__typename === "AIAgentArtworksSection"
  )
  const fromSection = (section?.artworks ?? []).map(
    (artwork: { internalID: string }) => artwork.internalID
  )
  const legacy = (event.artworks ?? []).map(
    (artwork: { internalID: string }) => artwork.internalID
  )

  if (fromSection.join() !== legacy.join()) {
    process.stdout.write(
      `\n${dim(
        `[warn] legacy artworks (${legacy.length}) do not match the ` +
          `artworks section (${fromSection.length})`
      )}\n`
    )
  }
}

function loadInputHistory(): string[] {
  try {
    const history = JSON.parse(readFileSync(INPUT_HISTORY_FILE, "utf8"))
    if (!Array.isArray(history)) return []

    return history
      .filter((entry): entry is string => typeof entry === "string")
      .slice(0, INPUT_HISTORY_SIZE)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== "ENOENT") {
      console.error(dim(`[history] Could not read ${INPUT_HISTORY_FILE}`))
    }
    return []
  }
}

function saveInputHistory(history: readonly string[]): void {
  const entries = history
    .map((entry) => entry.trim())
    .filter(
      (entry, index, all) =>
        entry.length > 0 &&
        entry !== "exit" &&
        entry !== "quit" &&
        all.indexOf(entry) === index
    )
    .slice(0, INPUT_HISTORY_SIZE)

  try {
    writeFileSync(INPUT_HISTORY_FILE, `${JSON.stringify(entries, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    })
  } catch (_error) {
    console.error(dim(`[history] Could not write ${INPUT_HISTORY_FILE}`))
  }
}

function describeOne(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  if (error.message) return error.message
  const code = (error as { code?: string }).code
  return code ? `(empty message, code: ${code})` : "(empty message)"
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  const parts = [describeOne(error)]
  let cause: unknown = (error as { cause?: unknown }).cause
  while (cause) {
    const nestedErrors = (cause as { errors?: unknown[] }).errors
    if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
      parts.push(nestedErrors.map(describeOne).join(", "))
      break // AggregateError.errors don't chain further
    }
    parts.push(describeOne(cause))
    cause =
      cause instanceof Error ? (cause as { cause?: unknown }).cause : undefined
  }

  let description = parts.join(" -> ")
  if (description.includes("ECONNREFUSED")) {
    description += ` (is \`yarn dev\` running, and listening at ${METAPHYSICS_URL}?)`
  }
  return description
}

async function sendTurn(
  conversationID: string,
  message: string,
  history: HistoryEntry[]
): Promise<{ text: string | null; displayedSections: DisplayedSection[] }> {
  const response = await fetch(METAPHYSICS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
      "x-access-token": ACCESS_TOKEN as string,
      "x-user-id": USER_ID as string,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        input: {
          conversationID,
          message,
          history,
          supportedSections: SUPPORTED_SECTIONS,
          includeDebugToolCalls: true,
        },
      },
    }),
  })

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("text/event-stream")) {
    // Pre-turn rejection (not signed in, flag off, input too large) comes
    // back as a normal, non-streaming GraphQL error response.
    const body = await response.json().catch(() => null)
    const errorMessage =
      body?.errors
        ?.map((error: { message: string }) => error.message)
        .join("; ") ?? `Unexpected response (${response.status})`
    throw new Error(errorMessage)
  }

  if (!response.body) {
    throw new Error("Response had no body to stream.")
  }

  let assistantText: string | null = null
  let displayedSections: DisplayedSection[] = []
  let stop = false

  const decoder = new TextDecoder()
  let buffer = ""
  const reader = response.body.getReader()

  while (!stop) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
      if (dataLines.length === 0) continue

      const payload = JSON.parse(dataLines.join("\n"))

      if (payload.errors?.length) {
        console.error(
          `\n${dim(
            "[error] " +
              payload.errors
                .map((e: { message: string }) => e.message)
                .join("; ")
          )}`
        )
        stop = true
        break
      }

      const event = payload.data?.aiAgentTurn
      if (!event) continue

      switch (event.__typename) {
        case "AIAgentTextDelta":
          process.stdout.write(event.text)
          break
        case "AIAgentToolCall":
          process.stdout.write(
            `\n${dim(`[calling ${event.toolName}: ${event.summary ?? ""}]`)}\n`
          )
          if (event.debugSummary) {
            process.stdout.write(`${dim(indent(event.debugSummary))}\n`)
          }
          break
        case "AIAgentToolResult":
          process.stdout.write(
            `${dim(
              `[${event.toolName} ${event.ok ? "ok" : "failed"}${
                event.summary ? `: ${event.summary}` : ""
              }]`
            )}\n`
          )
          if (event.debugSummary) {
            process.stdout.write(`${dim(indent(event.debugSummary))}\n`)
          }
          break
        case "AIAgentTurnComplete":
          assistantText = event.message
          displayedSections = describeSections(event.sections ?? [])
          printSections(event.sections ?? [])
          warnOnLegacyDrift(event)
          process.stdout.write(
            `\n${dim(
              `(stopReason: ${event.stopReason}, ${event.toolCallCount} tool call(s))`
            )}\n`
          )
          stop = true
          break
      }
    }
  }

  return { text: assistantText, displayedSections }
}

function main() {
  const conversationID = randomUUID()
  const history: HistoryEntry[] = []

  console.log(
    `Chatting with the Artsy AI agent (conversation ${conversationID}).`
  )
  console.log(
    'Type your message and press enter. Type "exit" or Ctrl+C to quit.\n'
  )

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "you> ",
    history: loadInputHistory(),
    historySize: INPUT_HISTORY_SIZE,
    removeHistoryDuplicates: true,
  })
  rl.prompt()

  rl.on("line", async (line) => {
    const message = line.trim()
    saveInputHistory(rl.history)
    if (!message) {
      rl.prompt()
      return
    }
    if (message === "exit" || message === "quit") {
      rl.close()
      return
    }

    rl.pause()
    process.stdout.write("agent> ")
    try {
      const { text, displayedSections } = await sendTurn(
        conversationID,
        message,
        history
      )
      history.push({ role: "USER", content: message })
      if (text) {
        history.push({
          role: "ASSISTANT",
          content: text,
          ...(displayedSections.length > 0 && { displayedSections }),
        })
      }
    } catch (error) {
      console.error(`\n${dim(`[error] ${describeError(error)}`)}`)
    }

    console.log()
    rl.resume()
    rl.prompt()
  })

  rl.on("close", () => {
    saveInputHistory(rl.history)
    console.log("\nBye.")
    process.exit(0)
  })
}

main()
