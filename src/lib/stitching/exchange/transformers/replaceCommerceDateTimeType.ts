import { Transform } from "graphql-tools"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLString,
  getNamedType,
} from "graphql"
import {
  visitSchema,
  VisitSchemaKind,
  TypeVisitor,
} from "graphql-tools/dist/transforms/visitSchema"
import {
  createResolveType,
  fieldToFieldConfig,
} from "graphql-tools/dist/stitching/schemaRecreation"
import dateField from "schema/v2/fields/date"

type TypeWithSelectableFields =
  | GraphQLObjectType<any, any>
  | GraphQLInterfaceType

export class ReplaceCommerceDateTimeType implements Transform {
  public transformSchema(schema: GraphQLSchema): GraphQLSchema {
    const newSchema = visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        const fields = this.transformFields(type)
        return (
          fields &&
          new GraphQLObjectType({
            fields,
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            extensionASTNodes: type.extensionASTNodes,
            isTypeOf: type.isTypeOf,
            interfaces: type.getInterfaces(),
          })
        )
      }) as TypeVisitor,

      [VisitSchemaKind.INTERFACE_TYPE]: ((type: GraphQLInterfaceType) => {
        const fields = this.transformFields(type)
        return (
          fields &&
          new GraphQLInterfaceType({
            fields,
            name: type.name,
            description: type.description,
            astNode: type.astNode,
            resolveType: type.resolveType,
            extensionASTNodes: type.extensionASTNodes,
          })
        )
      }) as TypeVisitor,
    })

    return newSchema
  }

  private transformFields(type: TypeWithSelectableFields) {
    let madeChanges = false
    const fields = type.getFields()
    const newFields: GraphQLFieldConfigMap<any, any> = {}
    const resolveType = createResolveType((_name, type) => {
      if (
        type.name === "CommerceDateTime" ||
        (type.ofType && type.ofType.name === "CommerceDateTime")
      ) {
        return dateField.type
      }
      return type
    })

    Object.entries(fields).forEach(([fieldName, fieldDefinition]) => {
      const fieldConfig = fieldToFieldConfig(fieldDefinition, resolveType, true)
      // If it's not a type we want to replace, just skip it
      if (
        ["CommerceDateTime", "CommerceDate"].includes(fieldDefinition.type.name)
      ) {
        madeChanges = true
        newFields[fieldName] = {
          ...fieldConfig,
          ...dateField,
        }
      } else if (
        ["CommerceDateTime!", "CommerceDate!"].includes(
          getNamedType(fieldDefinition).type.toString()
        )
      ) {
        madeChanges = true
        newFields[fieldName] = {
          ...fieldConfig,
          ...dateField,
          type: new GraphQLNonNull(GraphQLString),
        }
      } else {
        newFields[fieldName] = fieldConfig
      }
    })

    return madeChanges ? newFields : undefined
  }
}
