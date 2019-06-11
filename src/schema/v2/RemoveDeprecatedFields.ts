import { Transform, defaultMergedResolver } from "graphql-tools"
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
import { shouldBeRemoved } from "lib/deprecation"

export class RemoveDeprecatedFields implements Transform {
  // eslint-disable-next-line no-useless-constructor
  constructor(private options: { fromVersion: number }) {}

  public transformSchema(schema: GraphQLSchema): GraphQLSchema {
    const newSchema = visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        return new GraphQLObjectType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: this.transformFields(type),
          extensionASTNodes: type.extensionASTNodes,
          isTypeOf: type.isTypeOf,
          interfaces: type.getInterfaces(),
        })
      }) as TypeVisitor,

      [VisitSchemaKind.INTERFACE_TYPE]: ((type: GraphQLInterfaceType) => {
        return new GraphQLInterfaceType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: this.transformFields(type),
          resolveType: type.resolveType,
          extensionASTNodes: type.extensionASTNodes,
        })
      }) as TypeVisitor,
    })

    return newSchema
  }

  private transformFields(
    type: GraphQLObjectType<any, any> | GraphQLInterfaceType
  ) {
    const fields = type.getFields()
    const newFields: GraphQLFieldConfigMap<any, any> = {}
    const resolveType = createResolveType((_name, type) => type)
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      if (
        !shouldBeRemoved({
          inVersion: this.options.fromVersion,
          deprecationReason: field.deprecationReason,
          typeName: type.name,
          fieldName,
        })
      ) {
        newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
      }
    })
    return newFields
  }
}
