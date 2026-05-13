import { GraphQLNonNull, GraphQLString } from "graphql"
import { fieldToConfig } from "graphql-tools"
import dateField from "schema/v2/fields/date"

export const ReplaceCommerceDateTimeType = (
  _typeName,
  _fieldName,
  fieldConfig
) => {
  let newFieldConfig = fieldToConfig(fieldConfig)

  if (
    ["CommerceDateTime!", "CommerceDate"].includes(fieldConfig.type.toString())
  ) {
    newFieldConfig = {
      ...newFieldConfig,
      ...dateField,
      type: new GraphQLNonNull(GraphQLString),
    }
    return newFieldConfig
  }

  if (
    ["CommerceDateTime", "CommerceDate"].includes(fieldConfig.type.toString())
  ) {
    newFieldConfig = {
      ...newFieldConfig,
      ...dateField,
    }

    return newFieldConfig
  }

  return undefined
}
