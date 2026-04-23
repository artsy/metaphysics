import {
  delegateToSchema as realDelegateToSchema,
  IDelegateToSchemaOptions,
} from "@graphql-tools/delegate"

// Thin wrapper so tests can mock delegation via info.mergeInfo.delegateToSchema
// (the legacy graphql-tools v5 API) without us needing to change every
// production callsite. At runtime we delegate to the real
// @graphql-tools/delegate function.
export function delegateToSchema<TContext = Record<string, unknown>>(
  options: IDelegateToSchemaOptions<TContext>
) {
  const info = (options as { info?: unknown }).info as
    | { mergeInfo?: { delegateToSchema?: typeof realDelegateToSchema } }
    | undefined
  const legacy = info?.mergeInfo?.delegateToSchema
  if (typeof legacy === "function") {
    return legacy(options)
  }
  return realDelegateToSchema(options)
}
