import { Transform } from "graphql-tools"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLFieldConfigMap,
  GraphQLField,
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

export class FilterFields implements Transform {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private filter: (
      type: GraphQLObjectType<any, any> | GraphQLInterfaceType,
      field: GraphQLField<any, any>
    ) => boolean
  ) {}

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

  private transformFields(
    type: GraphQLObjectType<any, any> | GraphQLInterfaceType
  ) {
    let madeChanges = false
    const fields = type.getFields()
    const newFields: GraphQLFieldConfigMap<any, any> = {}
    const resolveType = createResolveType((_name, type) => type)
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      if (this.filter(type, field)) {
        newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
      } else {
        madeChanges = true
      }
    })
    return madeChanges ? newFields : undefined
  }
}
