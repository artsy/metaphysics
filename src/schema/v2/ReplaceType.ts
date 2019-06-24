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
import Show from "schema/show"

type TypeWithSelectableFields =
  | GraphQLObjectType<any, any>
  | GraphQLInterfaceType

interface ReplaceTypeMap {
  [oldType: string]: {
    newTypeName: string
    type: TypeWithSelectableFields
  }
}

export class ReplaceType implements Transform {
  private newSchema?: GraphQLSchema
  private changedFields: { [fieldName: string]: string }
  private typesToReplace: ReplaceTypeMap

  constructor(input: ReplaceTypeMap) {
    this.changedFields = {}
    this.typesToReplace = input
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
    const replacementTypes = Object.keys(this.typesToReplace)
    const resolveType = createResolveType((name, type) => {
      if (replacementTypes.includes(name)) {
        return this.typesToReplace[name].type
      }
      return type
    })

    Object.entries(fields).forEach(([fieldName, fieldDefinition]) => {
      const fieldConfig = fieldToFieldConfig(fieldDefinition, resolveType, true)
      // If it's not a type we want to replace, just skip it
      if (!replacementTypes.includes(fieldDefinition.type.name)) {
        newFields[fieldName] = fieldConfig
      } else {
        madeChanges = true
        const replacementType = this.typesToReplace[fieldDefinition.type.name]
          .type
        newFields[fieldName] = {
          ...fieldConfig,
          type: replacementType,
        }
        console.log("====>2", newFields[fieldName])
      }
    })

    return madeChanges ? newFields : undefined

    // Object.keys(fields).forEach(name => {
    //   const field = fields[name]
    //   console.log("====>1", field.type, name)
    //   console.log("=====>3", Object.keys(this.typesToReplace))
    //   if (Object.keys(this.typesToReplace).includes(field.type.toString())) {
    //     const oldField = fieldToFieldConfig(field, resolveType, true)
    //     console.log("=================> Got Here", oldField)
    //     newFields[name] = {
    //       ...oldField,
    //       type: this.typesToReplace[field.type].type,
    //     }
    //     console.log("====>2", newFields)
    //     madeChanges = true
    //   }
    //   this.changedFields[fieldKey(type, name)] = name
    // })

    // return madeChanges ? newFields : undefined
  }
}

function fieldKey(type: TypeWithSelectableFields, fieldName: string) {
  return `${type.name}.${fieldName}`
}
