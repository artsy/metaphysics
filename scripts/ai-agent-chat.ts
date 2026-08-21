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
import * as readline from "readline"

const METAPHYSICS_URL = process.env.METAPHYSICS_URL || "http://localhost:5001/v2"
const ACCESS_TOKEN = process.env.METAPHYSICS_ACCESS_TOKEN
const USER_ID = process.env.METAPHYSICS_USER_ID

if (!ACCESS_TOKEN || !USER_ID) {
  console.error(
    [
      "Set METAPHYSICS_ACCESS_TOKEN and METAPHYSICS_USER_ID (in .env, or prefixed on the",
      "command line) before running this script -- a signed-in user with the",
      "`onyx_ai_agent-turn` Unleash flag enabled (or any values, if the running server's",
      "NODE_ENV is \"development\", which skips that check).",
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
      ... on AIAgentToolCall { toolName summary }
      ... on AIAgentToolResult { toolName ok summary }
      ... on AIAgentTurnComplete { message stopReason toolCallCount }
    }
  }
`

type HistoryEntry = { role: "USER" | "ASSISTANT"; content: string }

const dim = (text: string) => `\x1b[2m${text}\x1b[0m`

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
    cause = cause instanceof Error ? (cause as { cause?: unknown }).cause : undefined
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
): Promise<string | null> {
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
      variables: { input: { conversationID, message, history } },
    }),
  })

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("text/event-stream")) {
    // Pre-turn rejection (not signed in, flag off, input too large) comes
    // back as a normal, non-streaming GraphQL error response.
    const body = await response.json().catch(() => null)
    const errorMessage =
      body?.errors?.map((error: { message: string }) => error.message).join("; ") ??
      `Unexpected response (${response.status})`
    throw new Error(errorMessage)
  }

  if (!response.body) {
    throw new Error("Response had no body to stream.")
  }

  let assistantText: string | null = null
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
            "[error] " + payload.errors.map((e: { message: string }) => e.message).join("; ")
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
          process.stdout.write(`\n${dim(`[calling ${event.toolName}: ${event.summary ?? ""}]`)}\n`)
          break
        case "AIAgentToolResult":
          process.stdout.write(
            `${dim(
              `[${event.toolName} ${event.ok ? "ok" : "failed"}${
                event.summary ? `: ${event.summary}` : ""
              }]`
            )}\n`
          )
          break
        case "AIAgentTurnComplete":
          assistantText = event.message
          process.stdout.write(
            `\n${dim(`(stopReason: ${event.stopReason}, ${event.toolCallCount} tool call(s))`)}\n`
          )
          stop = true
          break
      }
    }
  }

  return assistantText
}

function main() {
  const conversationID = randomUUID()
  const history: HistoryEntry[] = []

  console.log(`Chatting with the Artsy AI agent (conversation ${conversationID}).`)
  console.log('Type your message and press enter. Type "exit" or Ctrl+C to quit.\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "you> ",
  })
  rl.prompt()

  rl.on("line", async (line) => {
    const message = line.trim()
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
      const assistantText = await sendTurn(conversationID, message, history)
      history.push({ role: "USER", content: message })
      if (assistantText) {
        history.push({ role: "ASSISTANT", content: assistantText })
      }
    } catch (error) {
      console.error(`\n${dim(`[error] ${describeError(error)}`)}`)
    }

    console.log()
    rl.resume()
    rl.prompt()
  })

  rl.on("close", () => {
    console.log("\nBye.")
    process.exit(0)
  })
}

main()
