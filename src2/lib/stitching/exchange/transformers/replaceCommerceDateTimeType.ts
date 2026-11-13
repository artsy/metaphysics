import { GraphQLNonNull, GraphQLString } from "graphql"
import dateField from "schema/v2/fields/date"

export const ReplaceCommerceDateTimeType = (
  _typeName,
  _fieldName,
  fieldConfig
) => {
  if (
    ["CommerceDateTime!", "CommerceDate"].includes(fieldConfig.type.toString())
  ) {
    return {
      ...fieldConfig,
      ...dateField,
      type: new GraphQLNonNull(GraphQLString),
    }
  }

  if (
    ["CommerceDateTime", "CommerceDate"].includes(fieldConfig.type.toString())
  ) {
    return {
      ...fieldConfig,
      ...dateField,
    }
  }

  return undefined
}
