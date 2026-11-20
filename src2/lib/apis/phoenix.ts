/**
 * Phoenix, reached only through LiteLLM's pass-through routes, which add the
 * Phoenix key. The LiteLLM key must allow `/phoenix/v1/trace_annotations` and
 * `/phoenix/v1/projects/<project>/spans`.
 *
 * Spans use Phoenix's JSON API, not OTLP: the pass-through re-sends bodies as
 * JSON, and Phoenix's OTLP endpoint only takes protobuf.
 */

import fetch from "node-fetch"
import config from "config"
import { isLiteLLMConfigured, litellmURL } from "lib/apis/anthropic"
import { error } from "lib/loggers"

const TIMEOUT_MS = 5000

const TRACE_ID = /^[0-9a-f]{32}$/

/** A span for Phoenix's `POST /v1/projects/{project}/spans`. */
export interface PhoenixSpan {
  name: string
  context: { trace_id: string; span_id: string }
  parent_id: string | null
  span_kind: "AGENT" | "TOOL"
  /** ISO 8601 with a timezone; Phoenix rejects naive timestamps. */
  start_time: string
  end_time: string
  status_code: "OK" | "ERROR"
  status_message?: string
  /** OpenInference attributes, e.g. `input.value`. */
  attributes: Record<string, unknown>
  events: []
}

/** Resolves false on any failure, which is logged; never throws. */
async function post(path: string, data: unknown[]): Promise<boolean> {
  if (!isLiteLLMConfigured()) return false

  try {
    const response = await fetch(litellmURL(`/phoenix/v1${path}`), {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.LITELLM_API_KEY}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      // Otherwise LiteLLM logs this call to Phoenix as a stray trace of its
      // own. Phoenix ignores the field.
      body: JSON.stringify({ "no-log": true, data }),
      timeout: TIMEOUT_MS,
    })

    if (!response.ok) {
      error(
        `[phoenix] POST ${path} failed: HTTP ${response.status} ` +
          (await response.text().catch(() => "")).slice(0, 500)
      )
      return false
    }

    return true
  } catch (cause) {
    error(`[phoenix] POST ${path} failed: ${(cause as Error)?.message}`)
    return false
  }
}

/**
 * `project` must match the LiteLLM key's phoenix_project_name, or the trace is
 * split across two projects. One invalid span rejects the whole batch.
 */
export const exportSpans = (
  project: string,
  spans: PhoenixSpan[]
): Promise<boolean> =>
  post(`/projects/${encodeURIComponent(project)}/spans`, spans)

/**
 * A human judgment on a whole trace. Annotating again with the same name and
 * identifier replaces the earlier one. Phoenix accepts an annotation before
 * its trace arrives, so an unknown but well-formed trace ID still succeeds.
 */
export async function annotateTrace({
  traceID,
  name,
  identifier,
  label,
  score,
  explanation,
  metadata,
}: {
  traceID: string
  name: string
  identifier: string
  label: string
  score: number
  explanation?: string | null
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  if (!TRACE_ID.test(traceID)) return false

  return post("/trace_annotations", [
    {
      trace_id: traceID,
      name,
      annotator_kind: "HUMAN",
      result: { label, score, explanation: explanation || null },
      identifier,
      metadata: metadata ?? {},
    },
  ])
}
