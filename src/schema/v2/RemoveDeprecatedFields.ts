import { GraphQLObjectType, GraphQLInterfaceType, GraphQLField } from "graphql"
import { shouldBeRemoved } from "lib/deprecation"
import { FilterFields } from "./FilterFields"

export class RemoveDeprecatedFields extends FilterFields {
  constructor(
    private options: {
      fromVersion: number
      filter: (
        type: GraphQLObjectType<any, any> | GraphQLInterfaceType,
        field: GraphQLField<any, any>
      ) => boolean
    }
  ) {
    super((type, field) => {
      return (
        !field.deprecationReason ||
        (this.options.filter(type, field) &&
          !shouldBeRemoved({
            inVersion: this.options.fromVersion,
            deprecationReason: field.deprecationReason,
            typeName: type.name,
            fieldName: field.name,
          }))
      )
    })
  }
}
