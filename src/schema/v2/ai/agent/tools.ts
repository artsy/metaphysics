import { jsonSchema, tool } from "ai"
import type { JSONSchema7, Tool } from "ai"
import {
  DocumentNode,
  execute,
  getNamedType,
  GraphQLError,
  GraphQLSchema,
  isLeafType,
  parse,
  specifiedRules,
  validate,
  visit,
} from "graphql"
import type { ValidationRule } from "graphql"
import depthLimit from "graphql-depth-limit"
import { createComplexityRule, simpleEstimator } from "graphql-query-complexity"
import type { ComplexityEstimator } from "graphql-query-complexity"
import { filterSchema, pruneSchema } from "@graphql-tools/utils"
import type { FieldFilter, RootFieldFilter } from "@graphql-tools/utils"
import * as Sentry from "@sentry/node"
import {
  flattenErrors,
  shouldReportError,
  statusCodeForError,
} from "lib/graphqlErrorHandler"
import { ResolverContext } from "types/graphql"

/**
 * The AI agent's entire tool surface: one generic `query_artsy` tool that
 * runs a model-authored GraphQL query against the real schema, restricted to
 * a fixed set of read-only root fields. This lets the model use its own
 * GraphQL fluency and our already-typed resolvers directly.
 *
 * Field-level access within those root fields is not re-checked here:
 * Metaphysics' own resolvers already enforce field-level authorization
 * (an unauthorized/unauthenticated caller gets null, not a leak), so this
 * only needs to gate *which entry points* are reachable at all, not which
 * fields within them.
 *
 * `Me` is the exception — its fields are allowlisted too, because there
 * resolver-level auth is what creates the problem rather than solving it.
 * See ALLOWED_FIELDS_BY_TYPE below.
 */

const ALLOWED_ROOT_FIELDS = new Set([
  "artworksConnection",
  "artistsConnection",
  "artist",
  "artwork",
  "showsConnection",
  "matchConnection",
  "trendingSearches",
  "me",
])

const rootFieldFilter: RootFieldFilter = (operation, rootFieldName) =>
  operation === "Query" && ALLOWED_ROOT_FIELDS.has(rootFieldName)

/**
 * `me` is the exception to the comment above: for every other root field,
 * gating the entry point is enough, because what hangs off it is public
 * catalogue data. `Me` is the signed-in collector's own record, and almost
 * all of it is personal — orders, credit cards, bank accounts, conversations,
 * addresses, identity verification, inquiries. Metaphysics' resolvers do
 * authorize those (they return this user's data, not someone else's), which
 * is exactly the problem: a model-authored query would be *correctly*
 * authorized to read the user's payment details into the model's context.
 *
 * So `Me` is the one type whose fields are allowlisted too, down to the
 * personalization connections that answer "what should I look at next" —
 * they return artworks and artists, the same shape the rest of the tool
 * already returns. `id` is not optional here: `Me` implements `Node`, so
 * dropping it would leave the filtered schema invalid.
 */
const ALLOWED_FIELDS_BY_TYPE: Record<string, Set<string>> = {
  Me: new Set([
    "id",
    "basedOnUserSaves",
    "artworkRecommendations",
    "artistRecommendations",
    "followsAndSaves",
  ]),
  FollowsAndSaves: new Set(["artworksConnection", "artistsConnection"]),
}

const objectFieldFilter: FieldFilter = (typeName, fieldName) => {
  const allowed = ALLOWED_FIELDS_BY_TYPE[typeName]
  return !allowed || allowed.has(fieldName)
}

/**
 * The one way the allowlist above fails *open*: it keys on a type's name, so
 * renaming `Me` or `FollowsAndSaves` upstream stops the lookup matching, and
 * `objectFieldFilter` then waves through every field on the type it was
 * written to restrict. Nothing about a rename looks like a privacy change at
 * the call site, and the gate it disables lives in a different directory.
 *
 * So resolve the names against the real schema while narrowing it, and refuse
 * to build the schema if one has gone missing. Failing here costs the agent
 * its `query_artsy` tool — it surfaces as a tool error and a Sentry report —
 * which is the right trade against silently widening what a model-authored
 * query can read about the signed-in collector.
 *
 * Only missing *types* throw. A missing field name fails closed on its own
 * (the field just stays unreachable), so it isn't worth taking the tool down.
 */
function assertFieldAllowlistsResolve(schema: GraphQLSchema): void {
  const missing = Object.keys(ALLOWED_FIELDS_BY_TYPE).filter(
    (typeName) => !schema.getType(typeName)
  )
  if (missing.length === 0) return

  throw new Error(
    `AI agent field allowlist names unknown type(s): ${missing.join(", ")}. ` +
      "They were most likely renamed — update ALLOWED_FIELDS_BY_TYPE to match, " +
      "or every field on them becomes readable by a model-authored query."
  )
}

// Memoized rather than rebuilt per request — pruning a schema isn't free,
// and `schema` is the same instance across requests except on a dev
// hot-reload.
let cachedRealSchema: GraphQLSchema | undefined
let cachedNarrowSchema: GraphQLSchema | undefined

export function narrowSchemaFor(realSchema: GraphQLSchema): GraphQLSchema {
  if (cachedRealSchema === realSchema && cachedNarrowSchema) {
    return cachedNarrowSchema
  }

  assertFieldAllowlistsResolve(realSchema)

  const filtered = filterSchema({
    schema: realSchema,
    rootFieldFilter,
    objectFieldFilter,
  })
  const pruned = pruneSchema(filtered)

  cachedRealSchema = realSchema
  cachedNarrowSchema = pruned

  return pruned
}

// Model-authored queries pass page sizes as literal ints or variables, so
// clamp both here.
const MAX_QUERY_DEPTH = 8
const MAX_PAGE_SIZE = 20
const PAGE_SIZE_ARGS = new Set(["first", "last", "size"])

/**
 * Depth and page-size caps bound each *level* independently, but upstream cost
 * is the *product* across levels: `artworksConnection(first: 20)` nesting an
 * `artist { artworksConnection(first: 20) }` passes both caps while fanning out
 * to ~400 nodes and ~40 Gravity calls, because the inner connection resolves
 * once per outer node. This budget bounds the product.
 */
const MAX_QUERY_COMPLEXITY = 300

/**
 * `__type` is the introspection entry point worth having: one type at a time,
 * a few KB, and what the system prompt already tells the model to reach for.
 * `__schema` returns the entire type map — measured at 179 KB for field names
 * alone and 685 KB with args and descriptions, i.e. most of the model's
 * context window spent in a single tool call. Reject it at validation with a
 * pointer to `__type`, so the model redirects instead of burning a step
 * discovering the limit.
 */
const noFullSchemaIntrospection: ValidationRule = (context) => ({
  Field(node) {
    if (node.name.value !== "__schema") return
    context.reportError(
      new GraphQLError(
        "`__schema` is not available — it returns the entire type map. " +
          'Introspect one type at a time with `__type(name: "TypeName")`.',
        { nodes: node }
      )
    )
  },
})

/**
 * Backstop for everything the validation rules can't price: a query can pass
 * the depth, page-size and complexity caps and still serialize to something
 * enormous (long biographies, a wide `__type`, a full page of verbose nodes).
 * Sized to clear the introspection shape the system prompt recommends (~17 KB
 * for `__type` on Artwork with field types) and a full 20-node page, while
 * bounding one tool call at ~12k tokens.
 */
const MAX_TOOL_RESULT_BYTES = 48_000

function serializeToolResult(data: unknown): string {
  const content = JSON.stringify(data)
  const buffer = Buffer.from(content, "utf8")
  if (buffer.byteLength <= MAX_TOOL_RESULT_BYTES) return content

  // Cutting mid-value leaves invalid JSON, hence the trailing note: the model
  // has to know the data is incomplete rather than read it as the whole result
  // set. The replace() drops a partial multi-byte character at the boundary.
  const truncated = buffer
    .subarray(0, MAX_TOOL_RESULT_BYTES)
    .toString("utf8")
    .replace(/\uFFFD+$/, "")

  return (
    `${truncated}\n\n[Truncated: the result exceeded ${MAX_TOOL_RESULT_BYTES} ` +
    "bytes and is cut off mid-value. Re-run requesting fewer fields, or a " +
    "smaller `first`, for a complete result.]"
  )
}

/**
 * Multiplies a paginated field's children by its page size, which is what makes
 * nesting expensive. Returns undefined (deferring to the next estimator) for
 * fields without a page-size argument.
 */
const paginationEstimator: ComplexityEstimator = ({
  args,
  childComplexity,
}) => {
  const pageSize = [args.first, args.last, args.size].find(
    (value) => typeof value === "number" && value > 0
  )
  if (pageSize === undefined) return undefined
  return childComplexity * pageSize + 1
}

/**
 * Scalars and enums are free: they come back on a body we already fetched, so
 * asking for 25 of them costs the same one REST call as asking for 5. Charging
 * for them would make a cheap-but-wide selection score higher than a genuinely
 * expensive nested one.
 */
const leafFieldEstimator: ComplexityEstimator = ({ field }) => {
  if (field?.type && isLeafType(getNamedType(field.type))) return 0
  return undefined
}

const COMPLEXITY_ESTIMATORS = [
  paginationEstimator,
  leafFieldEstimator,
  simpleEstimator({ defaultComplexity: 1 }),
]

function findOversizedPageArg(
  document: DocumentNode,
  variableValues: Record<string, unknown>
): string | null {
  let violation: string | null = null

  visit(document, {
    Argument(node) {
      if (violation || !PAGE_SIZE_ARGS.has(node.name.value)) return

      const valueNode = node.value
      let value: number | undefined
      if (valueNode.kind === "IntValue") {
        value = Number(valueNode.value)
      } else if (valueNode.kind === "Variable") {
        const raw = variableValues[valueNode.name.value]
        if (typeof raw === "number") value = raw
      }

      if (value !== undefined && value > MAX_PAGE_SIZE) {
        violation = `${node.name.value}: ${value} exceeds the max of ${MAX_PAGE_SIZE}`
      }
    },
  })

  return violation
}

/**
 * Never pass the upstream text through. Reduce each error to a category
 * derived from its HTTP status, which keeps the signal the model needs to adapt
 * (retry vs. give up vs. ask for something else) while leaking nothing. The
 * field path is included because it's from the query the model itself wrote.
 */
function describeExecutionError(error: GraphQLError): string {
  const status = flattenErrors(error)
    .map((flattened) => statusCodeForError(flattened))
    .find((code) => typeof code === "number")
  const path = error.path?.length ? ` at \`${error.path.join(".")}\`` : ""

  if (status === 404) return `No record found${path}`
  if (status === 401 || status === 403) return `Not authorized to read${path}`
  if (status === 429) {
    return `Upstream rate limit reached${path} — wait before retrying`
  }
  if (typeof status === "number" && status >= 500) {
    return `Upstream service error${path} — the data source is unavailable`
  }
  return `Could not resolve${path}`
}

function sanitizeExecutionErrors(errors: readonly GraphQLError[]): string {
  const categories = new Set<string>()
  errors.forEach((error) => {
    // Keep the real, unredacted error for us — only the model's copy is reduced.
    if (shouldReportError(error)) Sentry.captureException(error)
    categories.add(describeExecutionError(error))
  })
  return Array.from(categories).join("; ")
}

export interface AIAgentToolRunResult {
  ok: boolean
  content: string
}

/**
 * Runs one model-authored query against the schema, restricted to
 * `ALLOWED_ROOT_FIELDS`. Never throws — every failure mode (bad syntax,
 * validation, execution errors) becomes `{ ok: false, content }`.
 */
export async function runQueryArtsyTool(
  input: unknown,
  schema: GraphQLSchema,
  context: ResolverContext
): Promise<AIAgentToolRunResult> {
  const { query, variables } = (input ?? {}) as {
    query?: unknown
    variables?: unknown
  }

  if (typeof query !== "string" || query.trim().length === 0) {
    return { ok: false, content: "A non-empty `query` string is required." }
  }

  const narrowSchema = narrowSchemaFor(schema)

  let document: DocumentNode
  try {
    document = parse(query)
  } catch (error) {
    return { ok: false, content: `Invalid GraphQL syntax: ${error}` }
  }

  // `validate`'s `rules` parameter REPLACES the standard rule set entirely
  // if provided, rather than adding to it — the standard rules (does this
  // field exist, are required args present, ...) must be spread in
  // explicitly alongside the depth-limit rule.
  const validationErrors = validate(narrowSchema, document, [
    ...specifiedRules,
    depthLimit(MAX_QUERY_DEPTH),
    noFullSchemaIntrospection,
  ])
  if (validationErrors.length > 0) {
    return {
      ok: false,
      content: validationErrors.map((error) => error.message).join("; "),
    }
  }

  const variableValues = (variables ?? {}) as Record<string, unknown>
  const oversizedPageArg = findOversizedPageArg(document, variableValues)
  if (oversizedPageArg) {
    return { ok: false, content: `Page size too large — ${oversizedPageArg}` }
  }

  // Run as its own pass, after the standard rules have confirmed the document
  // is well-formed: the complexity visitor resolves field types as it walks,
  // and would throw rather than report an error on an unknown field.
  const complexityErrors = validate(narrowSchema, document, [
    createComplexityRule({
      maximumComplexity: MAX_QUERY_COMPLEXITY,
      variables: variableValues,
      estimators: COMPLEXITY_ESTIMATORS,
      createError: (max, actual) =>
        new GraphQLError(
          `Query is too expensive (cost ${actual}, max ${max}). Nesting a ` +
            `paginated field inside another multiplies cost by the outer page ` +
            `size. Reduce \`first\`, or split this into separate queries.`
        ),
    }),
  ])
  if (complexityErrors.length > 0) {
    return {
      ok: false,
      content: complexityErrors.map((error) => error.message).join("; "),
    }
  }

  const result = await execute({
    schema: narrowSchema,
    document,
    contextValue: context,
    variableValues,
  })

  if (result.errors?.length) {
    return { ok: false, content: sanitizeExecutionErrors(result.errors) }
  }

  return { ok: true, content: serializeToolResult(result.data) }
}

/**
 * Builds the AI SDK ToolSet for one request. `schema` comes from the
 * resolver's `info.schema`, not a static import of schema/v2 — importing
 * schema/v2 here would create an import cycle (schema/v2/schema.ts ->
 * ai/index.ts -> ai/agent/index.ts -> ai/agent/tools.ts -> schema/v2/index.ts
 * -> back to schema/v2/schema.ts).
 */
export function buildAgentTools(
  schema: GraphQLSchema,
  context: ResolverContext
): Record<string, Tool> {
  return {
    query_artsy: tool({
      description:
        "Run a read-only GraphQL query to search and look up artists, " +
        "artworks, shows, and fairs. Available root fields: " +
        "artworksConnection, artistsConnection, artist, artwork, " +
        "showsConnection, matchConnection, trendingSearches (for " +
        "trending/most-popular rankings), and me (the signed-in collector's " +
        "own saves, follows and recommendations — `me` is null when signed " +
        "out, and only its personalization fields are reachable). Use " +
        "GraphQL introspection (e.g. " +
        '`{ __type(name: "Artwork") { fields { name description } } }`) to ' +
        "discover the fields and args available on any type — one type at a " +
        "time, as `__schema` is not available. Always " +
        "request `internalID` and `slug` for anything you might reference " +
        `again. \`first\`/\`last\`/\`size\` are capped at ${MAX_PAGE_SIZE}. ` +
        "Never pass mode: INTERNAL_AUTOSUGGEST to matchConnection — it " +
        "requires a signed-in session and will error. Price/estimate/fee " +
        "fields (e.g. priceMin, priceMax, listPrice) are typed `Money`, not " +
        "a scalar — select a subfield, usually `display` for a formatted " +
        "string or `major`/`minor` for a number.",
      inputSchema: jsonSchema({
        type: "object",
        properties: {
          query: { type: "string", description: "A GraphQL query document." },
          variables: {
            type: "object",
            description: "Variables referenced by the query, if any.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      } as JSONSchema7),
      execute: (input: unknown) => runQueryArtsyTool(input, schema, context),
    }),
  }
}

/**
 * A short, human-readable label for the AIAgentToolCall event — the tool
 * name itself is always "query_artsy", so it carries no information on its own.
 */
export function summarizeToolCall(input: unknown): string {
  const query = (input as { query?: unknown } | undefined)?.query
  if (typeof query !== "string") return "Querying Artsy…"

  const match = query.match(
    /\b(artworksConnection|artistsConnection|artist|artwork|showsConnection|matchConnection|trendingSearches|basedOnUserSaves|artworkRecommendations|artistRecommendations|followsAndSaves)\b/
  )
  return match ? `Querying Artsy: ${match[1]}…` : "Querying Artsy…"
}
