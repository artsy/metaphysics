import { Transform } from "graphql-tools"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLFieldConfigMap,
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
import dateField from "schema/v1/fields/date"

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
      if (type.name === "CommerceDateTime") {
        return dateField.type
      }
      return type
    })

    Object.entries(fields).forEach(([fieldName, fieldDefinition]) => {
      const fieldConfig = fieldToFieldConfig(fieldDefinition, resolveType, true)
      // If it's not a type we want to replace, just skip it
      if (fieldDefinition.type.name !== "CommerceDateTime") {
        newFields[fieldName] = fieldConfig
      } else {
        madeChanges = true
        newFields[fieldName] = {
          ...fieldConfig,
          ...dateField,
        }
      }
    })

    return madeChanges ? newFields : undefined
  }
}
