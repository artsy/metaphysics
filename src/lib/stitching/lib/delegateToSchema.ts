import {
  delegateToSchema as realDelegateToSchema,
  IDelegateToSchemaOptions,
} from "@graphql-tools/delegate"
import type { FieldNode, GraphQLResolveInfo } from "graphql"

// Thin wrapper so tests can mock delegation via info.mergeInfo.delegateToSchema
// (the legacy graphql-tools v5 API) without us needing to change every
// production callsite. At runtime we delegate to the real
// @graphql-tools/delegate function.
export function delegateToSchema<TContext = Record<string, unknown>>(
  options: IDelegateToSchemaOptions<TContext>
) {
  const info = (options as { info?: unknown }).info as
    | (GraphQLResolveInfo & {
        mergeInfo?: { delegateToSchema?: typeof realDelegateToSchema }
      })
    | undefined
  const legacy = info?.mergeInfo?.delegateToSchema
  if (typeof legacy === "function") {
    return legacy(options)
  }

  // @graphql-tools/delegate v10+ tries to reuse the caller's argument AST when
  // the resolver passes an explicit `args` whose value matches a variable on
  // the outer query. The reused arg keeps the *outer* variable definition
  // (e.g. `$partnerId: ID!`) and applies it to a *different* target argument
  // whose type may not match (e.g. `commerceOrders.sellerId: String`),
  // producing "Type mismatch on variable $X and argument Y" errors from the
  // remote service. Strip args we explicitly forward from `info.fieldNodes`
  // so delegate falls back to minting fresh, target-typed variables for them.
  const args = options.args
  if (info && args && Object.keys(args).length > 0) {
    const argNames = new Set(Object.keys(args))
    const newFieldNodes: FieldNode[] = info.fieldNodes.map((fieldNode) => {
      if (!fieldNode.arguments?.length) return fieldNode
      const filtered = fieldNode.arguments.filter(
        (arg) => !argNames.has(arg.name.value)
      )
      if (filtered.length === fieldNode.arguments.length) return fieldNode
      return { ...fieldNode, arguments: filtered }
    })
    options = { ...options, info: { ...info, fieldNodes: newFieldNodes } }
  }

  return realDelegateToSchema(options)
}
