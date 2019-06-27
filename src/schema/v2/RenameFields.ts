import { Transform, Request } from "graphql-tools"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLFieldConfigMap,
  GraphQLField,
  TypeInfo,
  visit,
  visitWithTypeInfo,
  Kind,
  getNamedType,
  GraphQLList,
  isLeafType,
  GraphQLUnionType,
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

type TypeWithSelectableFields =
  | GraphQLObjectType<any, any>
  | GraphQLInterfaceType

export class RenameFields implements Transform {
  private newSchema?: GraphQLSchema
  private changedFields: { [fieldName: string]: string }

  constructor(
    private renamer: (
      type: TypeWithSelectableFields,
      field: GraphQLField<any, any>
    ) => string | null | undefined
  ) {
    this.changedFields = {}
  }

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

    this.newSchema = newSchema
    return newSchema
  }

  private transformFields(type: TypeWithSelectableFields) {
    let madeChanges = false
    const fields = type.getFields()
    const newFields: GraphQLFieldConfigMap<any, any> = {}
    const resolveType = createResolveType((_name, type) => type)

    Object.keys(fields).forEach(oldName => {
      const field = fields[oldName]
      const newField = fieldToFieldConfig(field, resolveType, true)
      const newName = this.renamer(type, field)
      if (newName) {
        madeChanges = true
        newFields[newName] = {
          ...newField,
          resolve: source => source[oldName],
        }
        this.changedFields[fieldKey(type, newName)] = oldName
      } else {
        newFields[oldName] = newField
      }
    })

    return madeChanges ? newFields : undefined
  }

  public transformRequest(originalRequest: Request): Request {
    const typeInfo = new TypeInfo(this.newSchema!)

    const newDocument = visit(
      originalRequest.document,
      visitWithTypeInfo(typeInfo, {
        [Kind.FIELD]: {
          enter: node => {
            // This is the only field you can select on a union type, which is
            // why union types don’t have a `getFields()` method. But seeing as
            // we don’t care about renaming that field anyways, might as well
            // just short-cut it here.
            if (node.name.value === "__typename") {
              return
            }

            const type = getTypeWithSelectableFields(typeInfo)
            const oldName =
              type && this.changedFields[fieldKey(type, node.name.value)]
            if (oldName) {
              return {
                ...node,
                name: {
                  ...node.name,
                  value: oldName,
                },
              }
            }
            return
          },
        },
      })
    )

    return {
      ...originalRequest,
      document: newDocument,
    }
  }
}

function fieldKey(type: TypeWithSelectableFields, fieldName: string) {
  return `${type.name}.${fieldName}`
}

// FIXME: Unsure why the `typeInfo` methods return `any`.
function getTypeWithSelectableFields(
  typeInfo: TypeInfo
): TypeWithSelectableFields {
  let type
  if (typeInfo.getType() instanceof GraphQLList) {
    return getNamedType(typeInfo.getParentType())
  } else {
    type = getNamedType(typeInfo.getType())
  }
  return isLeafType(type) || type instanceof GraphQLUnionType
    ? getNamedType(typeInfo.getParentType())
    : type
}
