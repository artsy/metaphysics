import config from "config"
import { error } from "./loggers"

/**
 * Per-user request counter backed by memcached, for guarding expensive fields
 * that the IP-based `rateLimiterMiddleware` doesn't meaningfully protect:
 * that middleware keys on IP and is skipped entirely for callers sending
 * `x-datadog-trace-id` (our own services), so a signed-in user behind a proxy
 * or carrier NAT is effectively unthrottled there.
 *
 * Fixed window, not sliding: a user gets `max` calls per `windowSeconds`, and
 * the window resets when the key expires. Cheaper than a sliding log and
 * sufficient for cost control.
 *
 * Fails OPEN — if memcached is unavailable, slow, or missing the atomic ops,
 * the request is allowed. This matches `rateLimiterMiddleware`, which also
 * degrades open (memcached is known to occasionally hang in production, and
 * we'd rather serve traffic than hard-fail on a cache blip).
 */

export interface RateLimitResult {
  allowed: boolean
  /** Calls used within the current window, or null when the store was unavailable. */
  count: number | null
}

// Subset of the `memcached` client surface we need, so tests can inject a fake.
interface CounterClient {
  incr?: (key: string, amount: number, cb: Callback) => void
  add?: (key: string, value: number, lifetime: number, cb: Callback) => void
}

type Callback = (err: unknown, result?: number | boolean) => void

const ALLOW_UNKNOWN: RateLimitResult = { allowed: true, count: null }

/**
 * Resolved lazily, on first use, rather than imported at module scope.
 * `lib/cache` builds its memcached, dd-trace and statsd clients as import-time
 * side effects, and those hold open sockets. A top-level import here would pull
 * them into the import graph of every consumer — including `schema/v2`, and so
 * `scripts/dump-schema.ts`, which has no `process.exit()` and would therefore
 * hang forever waiting for the event loop to drain (breaking `yarn dump:staging`
 * and the pre-commit hook).
 */
let sharedClient: CounterClient | undefined
function getSharedClient(): CounterClient {
  if (!sharedClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sharedClient = require("./cache").client as CounterClient
  }
  return sharedClient
}

function withTimeout<T>(
  operation: (cb: Callback) => void,
  timeoutMs: number
): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      settled = true
      resolve(null)
    }, timeoutMs)

    try {
      operation((err, result) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(err ? null : (result as T))
      })
    } catch (e) {
      // A client missing the method entirely (e.g. the test mock) throws
      // synchronously rather than calling back.
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(null)
    }
  })
}

/**
 * Records one call against `userID` and reports whether it may proceed.
 *
 * `scope` namespaces the counter so separate expensive fields don't share a
 * budget (e.g. "ai_agent_turn").
 */
export async function rateLimitByUser({
  scope,
  userID,
  max,
  windowSeconds,
  client,
  timeoutMs = config.CACHE_RETRIEVAL_TIMEOUT_MS,
}: {
  scope: string
  userID: string
  max: number
  windowSeconds: number
  client?: CounterClient
  timeoutMs?: number
}): Promise<RateLimitResult> {
  if (!Number.isFinite(max)) {
    error(
      `[rateLimitByUser] ${scope} max is not a finite number (${max}); allowing all requests`
    )
    return ALLOW_UNKNOWN
  }
  if (max <= 0) return ALLOW_UNKNOWN

  const counter = client ?? getSharedClient()
  if (typeof counter.incr !== "function" || typeof counter.add !== "function") {
    return ALLOW_UNKNOWN
  }

  const key = `rate-limit-user:${scope}:${userID}`

  try {
    // `incr` returns false when the key doesn't exist yet, so seed it with
    // `add` (which no-ops if a concurrent request seeded it first) and then
    // re-`incr` to pick up that request's count too.
    const incremented = await withTimeout<number | boolean>(
      (cb) => counter.incr!(key, 1, cb),
      timeoutMs
    )

    if (typeof incremented === "number") {
      return { allowed: incremented <= max, count: incremented }
    }

    if (incremented === false) {
      const added = await withTimeout<number | boolean>(
        (cb) => counter.add!(key, 1, windowSeconds, cb),
        timeoutMs
      )
      if (added === null) return ALLOW_UNKNOWN
      if (added !== false) return { allowed: 1 <= max, count: 1 }

      // Lost the race to seed the key — count this call against the winner's.
      const retried = await withTimeout<number | boolean>(
        (cb) => counter.incr!(key, 1, cb),
        timeoutMs
      )
      return typeof retried === "number"
        ? { allowed: retried <= max, count: retried }
        : ALLOW_UNKNOWN
    }

    return ALLOW_UNKNOWN
  } catch (e) {
    error(`[rateLimitByUser] ${scope} counter failed, allowing request: ${e}`)
    return ALLOW_UNKNOWN
  }
}
