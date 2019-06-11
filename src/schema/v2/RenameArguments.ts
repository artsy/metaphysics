// TODO: Push upstream

import { Transform, defaultMergedResolver } from "graphql-tools"
import {
  GraphQLField,
  GraphQLSchema,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLArgument,
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

export class RenameArguments implements Transform {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private renamer: (
      field: GraphQLField<any, any>,
      arg: GraphQLArgument
    ) => string | null | undefined
  ) {}

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
      const newField = fieldToFieldConfig(field, resolveType, true)
      const newFieldArgs = newField.args
      if (newFieldArgs) {
        field.args.forEach(arg => {
          const oldName = arg.name
          const newName = this.renamer(field, arg)
          if (newName) {
            newFieldArgs[newName] = newFieldArgs[oldName]
            delete newFieldArgs[oldName]
            const originalResolver = newField.resolve
            newField.resolve = (source, args, context, info) => {
              const newArgs = { ...args, [oldName]: args[newName] }
              delete newArgs[newName]
              const resolver = originalResolver || defaultMergedResolver
              return resolver(source, newArgs, context, info)
            }
          }
        })
      }
      newFields[fieldName] = newField
    })

    return newFields
  }
}
