import { jsonSchema, tool } from "ai"
import type { JSONSchema7, Tool } from "ai"
import {
  DocumentNode,
  execute,
  GraphQLSchema,
  parse,
  specifiedRules,
  validate,
  visit,
} from "graphql"
import depthLimit from "graphql-depth-limit"
import { filterSchema, pruneSchema } from "@graphql-tools/utils"
import type { RootFieldFilter } from "@graphql-tools/utils"
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
 */

const ALLOWED_ROOT_FIELDS = new Set([
  "artworksConnection",
  "artistsConnection",
  "artist",
  "artwork",
  "showsConnection",
  "matchConnection",
])

const rootFieldFilter: RootFieldFilter = (operation, rootFieldName) =>
  operation === "Query" && ALLOWED_ROOT_FIELDS.has(rootFieldName)

// Memoized rather than rebuilt per request — pruning a schema isn't free,
// and `schema` is the same instance across requests except on a dev
// hot-reload.
let cachedRealSchema: GraphQLSchema | undefined
let cachedNarrowSchema: GraphQLSchema | undefined

function narrowSchemaFor(realSchema: GraphQLSchema): GraphQLSchema {
  if (cachedRealSchema === realSchema && cachedNarrowSchema) {
    return cachedNarrowSchema
  }

  const filtered = filterSchema({ schema: realSchema, rootFieldFilter })
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

  const result = await execute({
    schema: narrowSchema,
    document,
    contextValue: context,
    variableValues,
  })

  if (result.errors?.length) {
    return {
      ok: false,
      content: result.errors.map((error) => error.message).join("; "),
    }
  }

  return { ok: true, content: JSON.stringify(result.data) }
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
        "showsConnection, matchConnection. Use GraphQL introspection (e.g. " +
        '`{ __type(name: "Artwork") { fields { name description } } }`) to ' +
        "discover the fields and args available on any type. Always " +
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
    /\b(artworksConnection|artistsConnection|artist|artwork|showsConnection|matchConnection)\b/
  )
  return match ? `Querying Artsy: ${match[1]}…` : "Querying Artsy…"
}
