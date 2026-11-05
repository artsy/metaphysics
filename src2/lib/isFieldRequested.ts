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
  let parsedResolveInfoFragment
  try {
    parsedResolveInfoFragment = parseResolveInfo(resolveInfo)
  } catch (e) {
    console.error("Error parsing resolve info fragment", e)
  }
  if (parsedResolveInfoFragment) {
    const {
      fields: requestedFields,
    } = simplifyParsedResolveInfoFragmentWithType(
      parsedResolveInfoFragment as any,
      resolveInfo.returnType
    )

    return recursivelyFindField(field.split("."), requestedFields)
  }

  return false
}

const recursivelyFindField = (fields: string[], requestedFields) => {
  const [firstField, ...restFields] = fields
  const foundField = Object.values<ResolveTree>(requestedFields).find(
    (requestedField) => requestedField.name === firstField
  )
  if (foundField) {
    if (restFields.length === 0) {
      return true
    }
    return !!Object.values(foundField.fieldsByTypeName).find((subField) =>
      recursivelyFindField(restFields, subField)
    )
  }
  return false
}
