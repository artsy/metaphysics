import { Request } from "express"
import { parse, FieldNode, OperationDefinitionNode } from "graphql"

/**
 * Returns a stable string representing the root field(s) being requested in the
 * current GraphQL operation. This can be combined with the caller's IP address
 * to form a more granular rate-limiting key (IP + operation).
 *
 * Examples:
 *   `{ artist(id: "banksy") { name } }`   ->  "query.artist"
 *   `mutation { followArtist(id: "banksy") { artist { id } } }` -> "mutation.followArtist"
 *   Multiple root fields: `{ me { id } artist(id: "cat") { id } }` -> "query.artist,me"
 *
 * For persisted queries (when `req.body.documentID` is present and the actual
 * query string is not yet injected) this falls back to
 * `persisted.<documentID>`.
 *
 * If parsing fails the function returns the string "unknown" so that rate-
 * limiting still proceeds but groups those unknown queries together.
 */
export function rateLimitInterfaceKey(req: Request): string {
  try {
    const { body } = req as any

    // If the raw GraphQL source is available, derive the key from it.
    if (body && typeof body.query === "string" && body.query.trim().length) {
      const ast = parse(body.query)
      const identifiers = new Set<string>()

      for (const def of ast.definitions) {
        if (def.kind === "OperationDefinition") {
          const op = (def as OperationDefinitionNode).operation // query | mutation | subscription
          const selections = (def as OperationDefinitionNode).selectionSet
            .selections
          selections.forEach((sel) => {
            if (sel.kind === "Field") {
              identifiers.add(`${op}.${(sel as FieldNode).name.value}`)
            }
          })
        }
      }

      if (identifiers.size) {
        return Array.from(identifiers).sort().join(",")
      }
    }

    // Persisted-query fallback (no raw query before fetchPersistedQuery runs)
    if (body && body.documentID) {
      return `persisted.${body.documentID}`
    }
  } catch (error) {
    // Swallow errors – we don't want the rate limiter to break the request.
    console.error(
      "[rateLimitInterfaceKey] Failed to parse GraphQL query",
      error
    )
  }
  return "unknown"
}
