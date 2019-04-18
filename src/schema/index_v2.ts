import {
  GraphQLSchema,
  GraphQLObjectType,
  SelectionSetNode,
  FieldNode,
  visit,
  Kind,
  BREAK,
} from "graphql"
import { transformSchema, Transform, Request } from "graphql-tools"
import {
  visitSchema,
  VisitSchemaKind,
  TypeVisitor,
} from "graphql-tools/dist/transforms/visitSchema"
import {
  createResolveType,
  fieldToFieldConfig,
} from "graphql-tools/dist/stitching/schemaRecreation"
import { GravityIDFields, InternalIDFields } from "./object_identification"

const KAWSTypes = ["MarketingCollection", "MarketingCollectionQuery"]

class IdRenamer implements Transform {
  transformSchema(schema: GraphQLSchema): GraphQLSchema {
    return visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        const fields = type.getFields()
        const newFields = {}

        const resolveType = createResolveType((_name, type) => type)

        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName]
          if (field.name === "id") {
            if (
              field.description === GravityIDFields.id.description ||
              type.name === "DoNotUseThisPartner"
            ) {
              newFields["gravityID"] = {
                ...fieldToFieldConfig(
                  {
                    ...field,
                    resolve: source => source.id,
                  },
                  resolveType,
                  true
                ),
                name: "gravityID",
              }
            } else if (
              field.description === InternalIDFields.id.description ||
              KAWSTypes.includes(type.name)
            ) {
              newFields["internalID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                name: "internalID",
              }
            } else {
              throw new Error("Do not add new id fields")
            }
          } else {
            newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
          }
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

  public transformRequest(originalRequest: Request): Request {
    // let fromSelection: SelectionSetNode | undefined
    const newDocument = visit(originalRequest.document, {
      [Kind.FIELD]: {
        enter: (node: FieldNode) => {
          if (node.name.value === "gravityID") {
            // fromSelection = node.selectionSet
            return {
              ...node,
              name: {
                ...node.name,
                value: "id",
              },
            }
          }
        },
      },
    })

    // const newDocument = visit(originalRequest.document, {
    //   [Kind.FIELD]: {
    //     enter: (node: FieldNode) => {
    //       if (node.name.value === "id" && fromSelection) {
    //         return {
    //           ...node,
    //           selectionSet: fromSelection,
    //         }
    //       }
    //     },
    //   },
    // })
    return {
      ...originalRequest,
      document: newDocument,
    }
  }
}

export const transformToV2 = (schema: GraphQLSchema): GraphQLSchema => {
  return transformSchema(schema, [new IdRenamer()])
}
