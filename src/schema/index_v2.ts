import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldMap,
  GraphQLType,
} from "graphql"
import { transformSchema, Transform } from "graphql-tools"
import {
  visitSchema,
  VisitSchemaKind,
  TypeVisitor,
} from "graphql-tools/dist/transforms/visitSchema"
import {
  createResolveType,
  fieldToFieldConfig,
} from "graphql-tools/dist/stitching/schemaRecreation"

class IdRenamer implements Transform {
  transformSchema(schema: GraphQLSchema): GraphQLSchema {
    return visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        const fields = type.getFields()
        const newFields = {}

        const resolveType = createResolveType((_name, type) => type)

        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName]
          newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
        })

        return new GraphQLObjectType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: newFields,
        })
      }) as TypeVisitor,
    })
  }
}

export const transformToV2 = (schema: GraphQLSchema): GraphQLSchema => {
  return transformSchema(schema, [new IdRenamer()])
}
