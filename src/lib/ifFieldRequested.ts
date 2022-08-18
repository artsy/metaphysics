import { GraphQLResolveInfo } from "graphql"
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from "graphql-parse-resolve-info"

export const isFieldRequested = (
  field: string,
  resolveInfo: GraphQLResolveInfo
) => {
  const parsedResolveInfoFragment = parseResolveInfo(resolveInfo)
  if (parsedResolveInfoFragment) {
    const {
      fields: requestedFields,
    } = simplifyParsedResolveInfoFragmentWithType(
      parsedResolveInfoFragment as any,
      resolveInfo.returnType
    )

    return !!Object.values(requestedFields).find(
      (requestedField) => (requestedField as ResolveTree).name === field
    )
  }
  return false
}
